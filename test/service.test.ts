import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '../src';
import { ServiceExtension } from '../src/service/service-extension/service-extension';

describe('Service', () => {
  test('creating a service creates an appmesh node & service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'WebCarver');

    // WHEN
    new webcarver.Service(stack, 'Http', {
      environment,
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualNode'));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualService'));
    expectCDK(stack).to(haveResourceLike('AWS::ServiceDiscovery::Service'));
  });

  test('creating a service adds the envoy sidecar with proxy config', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'WebCarver');

    // WHEN
    new webcarver.Service(stack, 'Http', {
      environment,
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ProxyConfiguration: {
        ContainerName: 'Envoy',
        Type: 'APPMESH',
      },
      ContainerDefinitions: [
        {
          Essential: true,
          Name: 'Main',
        },
        {
          Essential: true,
          Name: 'Envoy',
        },
      ],
    }));
  });

  test('creating a service with a listener creates a port mapping and virtual node listener', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'WebCarver');

    // WHEN
    new webcarver.Service(stack, 'Http', {
      environment,
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
          listeners: [webcarver.ServiceListener.http2(80)],
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Essential: true,
          Name: 'Main',
          PortMappings: [{
            ContainerPort: 80,
            Protocol: 'tcp',
          }],
        },
      ],
    }));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualNode'));
  });

  test('can add an http2 service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'WebCarver');

    // WHEN
    new webcarver.Service(stack, 'EchoV2', {
      environment,
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
          listeners: [webcarver.ServiceListener.http2(80)],
        }),
        ServiceExtension.http2GatewayRoute({ prefixPath: '/first' }),
        ServiceExtension.http2GatewayRoute({ prefixPath: '/second' }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::GatewayRoute', {
      Spec: {
        Http2Route: {
          Match: { Prefix: '/first' },
        },
      },
    }));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::GatewayRoute', {
      Spec: {
        Http2Route: {
          Match: { Prefix: '/second' },
        },
      },
    }));
  });
});
