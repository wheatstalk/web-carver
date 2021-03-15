import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '../../src';

describe('spotCapacity', () => {
  test('adds the right capacity provider strategy to service props', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.spotCapacity(),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::Service', {
      CapacityProviderStrategy: [
        { CapacityProvider: 'FARGATE_SPOT', Weight: 100 },
        { CapacityProvider: 'FARGATE', Weight: 1 },
      ],
    }));
  });
});

describe('capacityProviderStrategies', () => {
  test('adds the right capacity provider strategy to service props', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.capacityProviderStrategies([{
          capacityProvider: 'FOOBAR',
          weight: 1234,
          base: 15,
        }]),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::Service', {
      CapacityProviderStrategy: [{
        CapacityProvider: 'FOOBAR',
        Weight: 1234,
        Base: 15,
      }],
    }));
  });
});

describe('taskSize', () => {
  test('sets the task size to the right size', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.taskSize({
          cpu: 1024,
          memoryLimitMiB: 2048,
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::TaskDefinition', {
      Cpu: '1024',
      Memory: '2048',
    }));
  });
});

describe('httpGatewayRoute', () => {
  it('creates a virtual gateway route', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.httpGatewayRoute({
          gateway: environment.defaultGateway,
          prefixPath: '/path',
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::GatewayRoute', {
      Spec: {
        HttpRoute: {
          Action: {
            Target: {
              VirtualService: {
                VirtualServiceName: {
                  'Fn::GetAtt': ['ServiceVirtualServiceD08EEC86', 'VirtualServiceName'],
                },
              },
            },
          },
          Match: {
            Prefix: '/path',
          },
        },
      },
    }));
    // Allow traffic from the gateway:
    expectCDK(stack).to(haveResourceLike('AWS::EC2::SecurityGroupIngress', {
      GroupId: { 'Fn::GetAtt': ['ServiceSecurityGroupC96ED6A7', 'GroupId'] },
      SourceSecurityGroupId: { 'Fn::GetAtt': ['EnvironmentGatewaySecurityGroup473A5143', 'GroupId'] },
    }));
  });
});

describe('http2GatewayRoute', () => {
  it('creates a virtual gateway route', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.http2GatewayRoute({
          gateway: environment.defaultGateway,
          prefixPath: '/path',
        }),
      ],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::GatewayRoute', {
      Spec: {
        Http2Route: {
          Action: {
            Target: {
              VirtualService: {
                VirtualServiceName: {
                  'Fn::GetAtt': ['ServiceVirtualServiceD08EEC86', 'VirtualServiceName'],
                },
              },
            },
          },
          Match: {
            Prefix: '/path',
          },
        },
      },
    }));
    // Allow traffic from the gateway:
    expectCDK(stack).to(haveResourceLike('AWS::EC2::SecurityGroupIngress', {
      GroupId: { 'Fn::GetAtt': ['ServiceSecurityGroupC96ED6A7', 'GroupId'] },
      SourceSecurityGroupId: { 'Fn::GetAtt': ['EnvironmentGatewaySecurityGroup473A5143', 'GroupId'] },
    }));
  });
});

describe('httpRoute', () => {
  it('creates routes', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    // WHEN
    new webcarver.Service(stack, 'Service', {
      environment,
      extensions: [
        webcarver.ServiceExtension.httpRoute({
          prefixPath: '/path',
          method: 'GET',
          headers: [
            webcarver.HttpRouteHeaderMatch.valueIs('Content-Type', 'text/plain'),
            webcarver.HttpRouteHeaderMatch.valueIsNot('Content-Type', 'text/html'),
            webcarver.HttpRouteHeaderMatch.valueMatchesRegex('Content-Type', 'text/.*'),
            webcarver.HttpRouteHeaderMatch.valueDoesNotMatchRegex('Content-Type', '.*/html'),
            webcarver.HttpRouteHeaderMatch.valueEndsWith('Content-Type', '/plain'),
            webcarver.HttpRouteHeaderMatch.valueDoesNotEndWith('Content-Type', '/html'),
            webcarver.HttpRouteHeaderMatch.valueStartsWith('Content-Type', 'text/'),
            webcarver.HttpRouteHeaderMatch.valueDoesNotStartWith('Content-Type', 'application/'),
            webcarver.HttpRouteHeaderMatch.valueIsInRange('Something', { start: 1, end: 5 }),
            webcarver.HttpRouteHeaderMatch.valueIsNotInRange('Something', { start: 5, end: 10 }),
          ],
        }),
      ],
    });

    // THEN
    const route = {
      Action: {
        WeightedTargets: [
          {
            VirtualNode: { 'Fn::GetAtt': ['ServiceVirtualNode93E7428B', 'VirtualNodeName'] },
            Weight: 1,
          },
        ],
      },
      Match: {
        Headers: [
          {
            Invert: false,
            Match: {
              Exact: 'text/plain',
            },
            Name: 'Content-Type',
          },
          {
            Invert: true,
            Match: {
              Exact: 'text/html',
            },
            Name: 'Content-Type',
          },
          {
            Invert: false,
            Match: {
              Regex: 'text/.*',
            },
            Name: 'Content-Type',
          },
          {
            Invert: true,
            Match: {
              Regex: '.*/html',
            },
            Name: 'Content-Type',
          },
          {
            Invert: false,
            Match: {
              Suffix: '/plain',
            },
            Name: 'Content-Type',
          },
          {
            Invert: true,
            Match: {
              Suffix: '/html',
            },
            Name: 'Content-Type',
          },
          {
            Invert: false,
            Match: {
              Prefix: 'text/',
            },
            Name: 'Content-Type',
          },
          {
            Invert: false,
            Match: {
              Prefix: 'application/',
            },
            Name: 'Content-Type',
          },
          {
            Invert: false,
            Match: {
              Range: {
                End: 5,
                Start: 1,
              },
            },
            Name: 'Something',
          },
          {
            Invert: true,
            Match: {
              Range: {
                End: 10,
                Start: 5,
              },
            },
            Name: 'Something',
          },
        ],
        Method: 'GET',
        Prefix: '/path',
      },
    };

    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::Route', {
      Spec: {
        HttpRoute: route,
      },
    }));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::Route', {
      Spec: {
        Http2Route: route,
      },
    }));
    // Allow traffic from the gateway:
    expectCDK(stack).to(haveResourceLike('AWS::EC2::SecurityGroupIngress', {
      GroupId: { 'Fn::GetAtt': ['ServiceSecurityGroupC96ED6A7', 'GroupId'] },
      SourceSecurityGroupId: { 'Fn::GetAtt': ['EnvironmentGatewaySecurityGroup473A5143', 'GroupId'] },
    }));
  });
});

describe('linkedService', () => {
  it('adds a backend and ingress', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const environment = new webcarver.Environment(stack, 'Environment');

    const backend = new webcarver.Service(stack, 'Backend', {
      environment,
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('nginx'),
          listeners: [
            webcarver.ServiceListener.http2(),
          ],
        }),
      ],
    });

    // WHEN
    new webcarver.Service(stack, 'Frontend', {
      environment,
      extensions: [
        webcarver.ServiceExtension.linkedService({
          service: backend,
        }),
      ],
    });

    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::VirtualNode', {
      Spec: {
        Backends: [{
          VirtualService: {
            VirtualServiceName: {
              'Fn::GetAtt': ['BackendVirtualService610FBB07', 'VirtualServiceName'],
            },
          },
        }],
      },
    }));

    // The backend lets the frontend access its traffic port:
    expectCDK(stack).to(haveResourceLike('AWS::EC2::SecurityGroupIngress', {
      FromPort: 80,
      ToPort: 80,
      GroupId: { 'Fn::GetAtt': ['BackendSecurityGroup19C7428D', 'GroupId'] },
      SourceSecurityGroupId: { 'Fn::GetAtt': ['FrontendSecurityGroup76500A52', 'GroupId'] },
    }));
  });
});

describe('envVars', () => {
  // GIVEN
  const stack = new cdk.Stack();
  const environment = new webcarver.Environment(stack, 'Environment');

  const envVars: Record<string, string> = {};

  // WHEN
  new webcarver.Service(stack, 'Service', {
    environment,
    extensions: [
      webcarver.ServiceExtension.envVars({
        FOO: 'BAR',
        BAZ: 'XYZ',
      }),
      webcarver.ServiceExtension.envVars({
        ABC: '123',
      }),
      {
        _extensionTypeName: 'text',
        _register: (service) => {
          service._onEnvVars(env => Object.assign(envVars, env));
        },
      },
    ],
  });

  // THEN
  expect(envVars).toEqual({
    FOO: 'BAR',
    BAZ: 'XYZ',
    ABC: '123',
  });
});
