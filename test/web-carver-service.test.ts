import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { WebCarverEnvironment, WebCarverListener, WebCarverService, WebCarverServiceExtension } from '../src';

describe('WebCarver Service', () => {
  test('creating a service creates an appmesh node & service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new WebCarverEnvironment(stack, 'WebCarver');

    // WHEN
    new WebCarverService(stack, 'Http', {
      environment,
      image: ecs.ContainerImage.fromRegistry('nginx'),
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualNode'));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualService'));
    expectCDK(stack).to(haveResourceLike('AWS::ServiceDiscovery::Service'));
  });

  test('creating a service adds the envoy sidecar with proxy config', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new WebCarverEnvironment(stack, 'WebCarver');

    // WHEN
    new WebCarverService(stack, 'Http', {
      environment,
      image: ecs.ContainerImage.fromRegistry('nginx'),
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
    const environment = new WebCarverEnvironment(stack, 'WebCarver');

    // WHEN
    new WebCarverService(stack, 'Http', {
      environment,
      image: ecs.ContainerImage.fromRegistry('nginx'),
      listeners: [
        WebCarverListener.http2(80),
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
    const environment = new WebCarverEnvironment(stack, 'WebCarver');

    // WHEN / THEN
    expect(() => {
      new WebCarverService(stack, 'Http', {
        environment,
        image: ecs.ContainerImage.fromRegistry('nginx'),
        listeners: [
          WebCarverListener.http2(80),
          WebCarverListener.http2(8080),
        ],
      });
    }).toThrow(/more than one.*AppMesh/i);
  });

  test('can add an http2 service', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new WebCarverEnvironment(stack, 'WebCarver');

    // WHEN
    new WebCarverService(stack, 'EchoV2', {
      environment,
      image: ecs.ContainerImage.fromRegistry('nginx'),
      listeners: [WebCarverListener.http2(80)],
      extensions: [
        WebCarverServiceExtension.http2GatewayRoute({ prefixPath: '/first' }),
        WebCarverServiceExtension.http2GatewayRoute({ prefixPath: '/second' }),
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
