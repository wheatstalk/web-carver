import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as appmesh from '@aws-cdk/aws-appmesh';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '../../src';

describe('ApplicationLoadBalancedFargateGateway', () => {
  test('without certificate, it creates a load balancer with http listener and no https', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const cluster = new ecs.Cluster(stack, 'Cluster', {
      defaultCloudMapNamespace: {
        name: 'example',
      },
    });
    const mesh = new appmesh.Mesh(stack, 'Mesh');

    // WHEN
    new webcarver.ApplicationLoadBalancedFargateGateway(stack, 'Gateway', {
      cluster,
      certificates: [],
      mesh,
      namespace: cluster.defaultCloudMapNamespace!,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::LoadBalancer', {
      Scheme: 'internet-facing',
    }));

    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTP',
      Port: 80,
    }));

    expectCDK(stack).notTo(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTPS',
    }));
  });

  test('with certificates, it creates an https listener and upgrades http to https', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const cluster = new ecs.Cluster(stack, 'Cluster', {
      defaultCloudMapNamespace: {
        name: 'example',
      },
    });
    const mesh = new appmesh.Mesh(stack, 'Mesh');
    const certificate = new acm.Certificate(stack, 'Certificate', {
      domainName: 'example.com',
    });

    // WHEN
    new webcarver.ApplicationLoadBalancedFargateGateway(stack, 'Gateway', {
      cluster,
      certificates: [certificate],
      mesh,
      namespace: cluster.defaultCloudMapNamespace!,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::LoadBalancer'));

    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTP',
      Port: 80,
      DefaultActions: [{
        Type: 'redirect',
        RedirectConfig: {
          Port: '443',
          Protocol: 'HTTPS',
          StatusCode: 'HTTP_302',
        },
      }],
    }));

    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTPS',
      Port: 443,
      Certificates: [{
        CertificateArn: { Ref: 'Certificate4E7ABB08' },
      }],
    }));
  });

  test('creates a fargate service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const cluster = new ecs.Cluster(stack, 'Cluster', {
      defaultCloudMapNamespace: {
        name: 'example',
      },
    });
    const mesh = new appmesh.Mesh(stack, 'Mesh');

    // WHEN
    new webcarver.ApplicationLoadBalancedFargateGateway(stack, 'Gateway', {
      cluster,
      certificates: [],
      mesh,
      namespace: cluster.defaultCloudMapNamespace!,
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::Service'));
  });
});