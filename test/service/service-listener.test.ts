// import { ABSENT, expect as expectCDK, haveResource, haveResourceLike } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '../../src';

it('creates an http1 listener', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.http1();

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionFacade());
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
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionFacade());
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
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionFacade());
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
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionFacade());
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
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionFacade());

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
  const serviceListenerConfig = serviceListener._bind(stack, new MockServiceExtensionFacade());

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(53);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.UDP);
  expect(serviceListenerConfig.virtualNodeListener).toBeUndefined();
});

it('adds an oidc http proxy', () => {
  const stack = new cdk.Stack();
  const serviceListener = webcarver.ServiceListener.oidcHttpProxy({
    containerPort: 3000,
    oidcDiscoveryEndpoint: 'something',
    oidcPlainTextCredentials: { clientId: 'something', clientSecret: 'something' },
  });

  const facade = new MockServiceExtensionFacade();
  const onServiceExtensionAdded = jest.fn();
  facade._onServiceExtensionAdded(onServiceExtensionAdded);

  // WHEN
  const serviceListenerConfig = serviceListener._bind(stack, facade);

  // THEN
  expect(serviceListenerConfig.containerPort).toEqual(3000);
  expect(serviceListenerConfig.protocol).toEqual(ecs.Protocol.TCP);
  expect(serviceListenerConfig.virtualNodeListener).toBeUndefined();
  expect(onServiceExtensionAdded).toBeCalledTimes(1);
  expect(onServiceExtensionAdded.mock.calls[0][0]).toBeInstanceOf(webcarver.OidcHttpProxyExtension);
});

class MockServiceExtensionFacade extends webcarver.ServiceExtensionFacadeBase {
  public get environment(): webcarver.IEnvironment { throw new Error('not implemented'); }
  public get defaultRouter(): webcarver.IRouter { throw new Error('not implemented'); }
  public get defaultGateway(): webcarver.IGateway { throw new Error('not implemented'); }
}