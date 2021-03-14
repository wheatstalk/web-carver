import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as secrets from '@aws-cdk/aws-secretsmanager';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '../../src';

it('creates an http1 listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.http1();

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionApi());
  const virtualNodeListenerConfig = serviceListenerConfig.virtualNodeListener!.bind(stack);

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(80);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.TCP);
  expect(serviceListenerConfig.virtualNodeListener).toBeDefined();
  expect(virtualNodeListenerConfig.listener.portMapping).toEqual(expect.objectContaining({
    port: 80,
    protocol: 'http',
  }));
});

it('creates an http2 listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.http2();

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionApi());
  const virtualNodeListenerConfig = serviceListenerConfig.virtualNodeListener!.bind(stack);

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(80);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.TCP);
  expect(serviceListenerConfig.virtualNodeListener).toBeDefined();
  expect(virtualNodeListenerConfig.listener.portMapping).toEqual(expect.objectContaining({
    port: 80,
    protocol: 'http2',
  }));
});

it('creates a grpc listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.grpc();

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionApi());
  const virtualNodeListenerConfig = serviceListenerConfig.virtualNodeListener!.bind(stack);

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(80);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.TCP);
  expect(serviceListenerConfig.virtualNodeListener).toBeDefined();
  expect(virtualNodeListenerConfig.listener.portMapping).toEqual(expect.objectContaining({
    port: 80,
    protocol: 'grpc',
  }));
});

it('creates a tcp listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.tcp(3306);

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionApi());
  const virtualNodeListenerConfig = serviceListenerConfig.virtualNodeListener?.bind(stack);

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(3306);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.TCP);
  expect(serviceListenerConfig.virtualNodeListener).toBeDefined();
  expect(virtualNodeListenerConfig?.listener.portMapping).toEqual(expect.objectContaining({
    port: 3306,
    protocol: 'tcp',
  }));
});

it('creates a tcp port mapping that has no virtual node listener listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.tcpPortMapping(3306);

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionApi());

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(3306);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.TCP);
  expect(serviceListenerConfig.virtualNodeListener).toBeUndefined();
});

it('creates a udp port mapping that has no virtual node listener listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.udpPortMapping(53);

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionApi());

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(53);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.UDP);
  expect(serviceListenerConfig.virtualNodeListener).toBeUndefined();
});

describe('oidc http proxy', () => {
  it('adds an oidc http proxy', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
          listeners: [
            webcarver.ServiceListener.oidcHttpProxy({
              containerPort: 3000,
              oidcDiscoveryEndpoint: 'something',
              oidcPlainTextCredentials: { clientId: 'something', clientSecret: 'something' },
            }),
          ],
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Name: 'OidcHttpProxy',
          Image: 'evry/oidc-proxy:v1.3.0',
          Essential: true,
          LogConfiguration: { LogDriver: 'awslogs' },
          PortMappings: [{
            ContainerPort: 80,
            Protocol: 'tcp',
          }],
          Environment: [
            {
              Name: 'OID_SESSION_NAME',
              Value: { 'Fn::GetAtt': ['ServiceVirtualNode93E7428B', 'VirtualNodeName'] },
            },
            { Name: 'PROXY_HOST', Value: '127.0.0.1' },
            { Name: 'PROXY_PORT', Value: '3000' },
            { Name: 'PROXY_PROTOCOL', Value: 'http' },
            { Name: 'OID_DISCOVERY', Value: 'something' },
            { Name: 'OIDC_AUTH_METHOD', Value: 'client_secret_post' },
            { Name: 'ADD_HOST_HEADER', Value: 'true' },
            { Name: 'OID_CLIENT_ID', Value: 'something' },
            { Name: 'OID_CLIENT_SECRET', Value: 'something' },
          ],
        },
        {
          Name: 'Main',
          Image: 'nginx',
          PortMappings: [{
            ContainerPort: 3000,
            Protocol: 'tcp',
          }],
        },
        { Name: 'Envoy' },
      ],
    }));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualNode', {
      Spec: {
        Listeners: [{
          PortMapping: {
            Port: 80,
            Protocol: 'http',
          },
        }],
      },
    }));
  });

  it('adds an oidc http proxy with secrets manager secrets', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');
    const secret = new secrets.Secret(stack, 'Secret');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
          listeners: [
            webcarver.ServiceListener.oidcHttpProxy({
              containerPort: 3000,
              oidcDiscoveryEndpoint: 'something',
              oidcSecretCredentials: secret,
            }),
          ],
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      ContainerDefinitions: [
        {
          Name: 'OidcHttpProxy',
          Secrets: [
            {
              Name: 'OID_CLIENT_ID',
              ValueFrom: {
                'Fn::Join': ['', [{ Ref: 'SecretA720EF05' }, ':clientId::']],
              },
            },
            {
              Name: 'OID_CLIENT_SECRET',
              ValueFrom: {
                'Fn::Join': ['', [{ Ref: 'SecretA720EF05' }, ':clientSecret::']],
              },
            },
          ],
        },
        { Name: 'Main' },
        { Name: 'Envoy' },
      ],
    }));
  });
});

class MockServiceExtensionApi extends webcarver.ServiceExtensionApiBase {
  public get environment(): webcarver.IEnvironment { throw new Error('not implemented'); }
  public get defaultRouter(): webcarver.IRouter { throw new Error('not implemented'); }
  public get defaultGateway(): webcarver.IGateway { throw new Error('not implemented'); }
}