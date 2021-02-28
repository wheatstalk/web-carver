import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';
import { AddToListener, FargateVirtualGateway } from '../../src/util';

describe('fargate virtual gateway', () => {
  test('creates a virtual gateway and service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const cluster = new ecs.Cluster(stack, 'Cluster');
    const mesh = new appmesh.Mesh(stack, 'Mesh');

    // WHEN
    new FargateVirtualGateway(stack, 'VirtualGateway', {
      cluster,
      mesh,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::Service'));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualGateway', {
      MeshName: { 'Fn::GetAtt': ['Mesh73A573F6', 'MeshName'] },
      Spec: {
        Listeners: [{
          PortMapping: {
            Port: 8081,
            Protocol: 'http2',
          },
        }],
      },
    }));
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Name: 'UtilEnvoy',
          Essential: true,
          PortMappings: [
            {
              ContainerPort: 8080,
              Protocol: 'tcp',
            },
            {
              ContainerPort: 9902,
              Protocol: 'tcp',
            },
          ],
          Ulimits: [{
            HardLimit: 1024000,
            Name: 'nofile',
            SoftLimit: 1024000,
          }],
        },
        {
          Name: 'VirtualGatewayEnvoy',
          Essential: true,
          Environment: [
            { Name: 'APPMESH_VIRTUAL_NODE_NAME', Value: { Ref: 'VirtualGateway0F1FE072' } },
            { Name: 'AWS_REGION', Value: { Ref: 'AWS::Region' } },
            { Name: 'ENABLE_ENVOY_STATS_TAGS', Value: '1' },
            { Name: 'ENABLE_ENVOY_DOG_STATSD', Value: '1' },
          ],
          PortMappings: [{
            ContainerPort: 8081,
            Protocol: 'tcp',
          }],
          Ulimits: [{
            HardLimit: 1024000,
            Name: 'nofile',
            SoftLimit: 1024000,
          }],
          User: '1337',
        },
      ],
    }));
  });

  test('can add its ecs target to an application load balancer', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const cluster = new ecs.Cluster(stack, 'Cluster');
    const mesh = new appmesh.Mesh(stack, 'Mesh');

    const albListener = elbv2.ApplicationListener.fromApplicationListenerAttributes(stack, 'Listener', {
      listenerArn: 'fake',
      securityGroup: ec2.SecurityGroup.fromSecurityGroupId(stack, 'ListenerSG', 'sg-fakefakefake'),
    });

    const vgw = new FargateVirtualGateway(stack, 'VirtualGateway', {
      cluster,
      mesh,
    });

    new AddToListener(stack, 'AddToListener', {
      vpc: cluster.vpc,
      service: vgw.service,
      listener: albListener,
      priority: 1000,
      conditions: [elbv2.ListenerCondition.hostHeaders(['example.com'])],
    });

    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::ListenerRule', {
      Actions: [{
        TargetGroupArn: { Ref: 'AddToListenerTargetGroupA9F17A0A' },
        Type: 'forward',
      }],
      Conditions: [{
        Field: 'host-header',
        HostHeaderConfig: { Values: ['example.com'] },
      }],
      ListenerArn: 'fake',
      Priority: 1000,
    }));
  });
});