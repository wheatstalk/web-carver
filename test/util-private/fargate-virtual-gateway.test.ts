import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { FargateVirtualGatewayService } from '../../src/util-private';

describe('fargate virtual gateway', () => {
  test('creates a virtual gateway and service', () => {
    // Notes: By default,

    // GIVEN
    const stack = new cdk.Stack();
    const cluster = new ecs.Cluster(stack, 'Cluster');
    const mesh = new appmesh.Mesh(stack, 'Mesh');
    const virtualGateway = mesh.addVirtualGateway('Gateway', {
      listeners: [appmesh.VirtualGatewayListener.http2()], // Default listener port is 8080
    });

    // WHEN
    const { service } = new FargateVirtualGatewayService(stack, 'VirtualGateway', {
      cluster,
      virtualGateway,
    });

    // THEN
    expect(service.taskDefinition.defaultContainer!.containerPort).toEqual(16080);

    expectCDK(stack).to(haveResourceLike('AWS::ECS::Service'));
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Name: 'UtilEnvoy',
          Essential: true,
          PortMappings: [
            {
              ContainerPort: 16080,
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
        { Name: 'VirtualGatewayEnvoy' },
      ],
    }));
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        { Name: 'UtilEnvoy' },
        {
          Name: 'VirtualGatewayEnvoy',
          Essential: true,
          Environment: [
            { Name: 'APPMESH_VIRTUAL_NODE_NAME', Value: { Ref: 'MeshGatewayEBAA5432' } },
            { Name: 'AWS_REGION', Value: { Ref: 'AWS::Region' } },
            { Name: 'ENABLE_ENVOY_STATS_TAGS', Value: '1' },
            { Name: 'ENABLE_ENVOY_DOG_STATSD', Value: '1' },
          ],
          PortMappings: [{
            // Should match the default virtual gateway http2 listener port, which is 8080
            ContainerPort: 8080,
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
});