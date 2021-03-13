import { ABSENT, expect as expectCDK, haveResource, haveResourceLike } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '../../src';

it('provides a default name based on the unique name', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack', { env: { account: 'some-account', region: 'some-region' } });
  const environment = webcarver.EnvironmentManifest.environmentFromStringParameter(stack, 'Environment', '/param');

  // WHEN
  new webcarver.Service(stack, 'MyService', {
    environment,
  });

  // THEN
  expect(environment.namespace.namespaceName).toEqual('fake');
  expectCDK(stack).to(haveResourceLike('AWS::ECS::Service', {
    // Should not be set by default so that the we don't get in the
    // way of CloudFormation recreating the resource by forcing introducing
    // a potential naming conflict.
    ServiceName: ABSENT,
  }));
  expectCDK(stack).to(haveResource('AWS::AppMesh::VirtualNode', {
    VirtualNodeName: 'StackMyService9D20B14F-fake',
  }));
  expectCDK(stack).to(haveResource('AWS::AppMesh::VirtualService', {
    VirtualServiceName: 'StackMyService9D20B14F.fake',
  }));
});

it('allows the user to provide their own host name', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack', { env: { account: 'some-account', region: 'some-region' } });
  const environment = webcarver.EnvironmentManifest.environmentFromStringParameter(stack, 'Environment', '/param');

  // WHEN
  new webcarver.Service(stack, 'MyService', {
    environment,
    name: webcarver.ServiceName.hostName('my-service'),
  });

  // THEN
  expect(environment.namespace.namespaceName).toEqual('fake');
  expectCDK(stack).to(haveResourceLike('AWS::ECS::Service', {
    ServiceName: ABSENT,
  }));
  expectCDK(stack).to(haveResource('AWS::AppMesh::VirtualNode', {
    VirtualNodeName: 'my-service-fake',
  }));
  expectCDK(stack).to(haveResource('AWS::AppMesh::VirtualService', {
    VirtualServiceName: 'my-service.fake',
  }));
});

it('sends all events to extensions', () => {
  // GIVEN
  const app = new cdk.App();
  const stack = new cdk.Stack(app, 'Stack', { env: { account: 'some-account', region: 'some-region' } });
  const environment = webcarver.EnvironmentManifest.environmentFromStringParameter(stack, 'Environment', '/param');

  const onWorkloadReady = jest.fn();
  const onEnvVars = jest.fn();
  const onConnectionsReady = jest.fn();
  const onContainerDefinitionPublished = jest.fn();

  // WHEN
  let givenService: webcarver.IServiceExtensionFacade|undefined;
  let givenPrivateScope: cdk.Construct|undefined;
  let producedContainer: ecs.ContainerDefinition|undefined;

  const webCarverService = new webcarver.Service(stack, 'MyService', {
    environment,
    name: webcarver.ServiceName.hostName('my-service'),
    extensions: [{
      _extensionTypeName: 'mock',
      _register: (service, privateScope) => {
        givenService = service;
        givenPrivateScope = privateScope;
        service._onWorkloadReady(onWorkloadReady);
        service._onEnvVars(onEnvVars);
        service._onConnectionsReady(onConnectionsReady);
        service._onContainerDefinitionPublished(onContainerDefinitionPublished);
        service._addEnvVars({
          FOO: 'bar',
        });

        service._onWorkloadReady(options => {
          const container = options.taskDefinition.addContainer('container', {
            image: ecs.ContainerImage.fromRegistry('nginx'),
          });
          service._publishContainerDefinition(container);
          producedContainer = container;
        });
      },
    }],
  });

  // THEN
  expect(givenService).toBeDefined();
  expect(givenService).not.toBe(webCarverService);
  expect(givenPrivateScope).toBeDefined();
  expect(givenPrivateScope).not.toBe(webCarverService);

  expect(onWorkloadReady).toBeCalled();
  expect(onEnvVars).toBeCalledWith(expect.objectContaining({
    FOO: 'bar',
  }));
  expect(onConnectionsReady).toBeCalledWith(webCarverService.connections);
  expect(onContainerDefinitionPublished).toBeCalledWith(producedContainer);
});