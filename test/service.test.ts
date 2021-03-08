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
      listeners: [
        webcarver.ServiceListener.http2(80),
      ],
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
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

  test('errors when more than one virtual node listener is used', () => {
    // Because: AppMesh nodes only support one listener - I believe this is
    // because the proxy configuration only allows one ingress and egress
    // port, but don't quote me on this.

    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'WebCarver');

    // WHEN / THEN
    expect(() => {
      new webcarver.Service(stack, 'Http', {
        environment,
        listeners: [
          webcarver.ServiceListener.http2(80),
          webcarver.ServiceListener.http2(8080),
        ],
        extensions: [
          ServiceExtension.container({
            image: ecs.ContainerImage.fromRegistry('nginx'),
          }),
        ],
      });
    }).toThrow(/more than one.*AppMesh/i);
  });

  test('can add an http2 service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'WebCarver');

    // WHEN
    new webcarver.Service(stack, 'EchoV2', {
      environment,
      listeners: [webcarver.ServiceListener.http2(80)],
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
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
