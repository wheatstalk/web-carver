import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { DUMMY_ENVIRONMENT_MANIFEST_V1, Environment, EnvironmentFromManifest, EnvironmentManifest } from '../src';

describe('Environment Manifest', () => {
  it('produces an SSM parameter', () => {
    const stack = new cdk.Stack();
    const environment = new Environment(stack, 'Environment');

    // WHEN
    new EnvironmentManifest(stack, 'Manifest', {
      parameterName: '/foo/bar',
      environment,
    });

    // THEN
    expectCDK(stack).to(haveResource('AWS::SSM::Parameter', {
      Name: '/foo/bar',
      Type: 'String',
      Value: {
        'Fn::Sub': [
          '{\n  "version": "1.0.0",\n  "crossStackDependencyExportName": "Manifest",\n  "vpcId": "${Ref0}",\n  "securityGroupId": "${Ref1}",\n  "namespaceAttributes": {\n    "namespaceType": "DNS_PRIVATE",\n    "namespaceArn": "${Ref2}",\n    "namespaceId": "${Ref3}",\n    "namespaceName": "${Ref4}"\n  },\n  "meshArn": "${Ref5}",\n  "clusterAttributes": {\n    "clusterName": "${Ref6}",\n    "clusterArn": "${Ref7}",\n    "hasEc2Capacity": false,\n    "securityGroupIds": []\n  },\n  "defaultGatewayAttributes": {\n    "securityGroupIds": [\n      "${Ref8}"\n    ],\n    "virtualGatewayArn": "${Ref9}"\n  },\n  "defaultRouterAttributes": {\n    "securityGroupIds": [\n      "${Ref10}"\n    ],\n    "virtualRouterArn": "${Ref11}",\n    "virtualServiceArn": "${Ref12}"\n  }\n}',
          {
            Ref0: { Ref: 'EnvironmentVpc6FD2605E' },
            Ref1: { 'Fn::GetAtt': ['EnvironmentSecurityGroupF309ED62', 'GroupId'] },
            Ref2: { 'Fn::GetAtt': ['Namespace9B63B8C8', 'Arn'] },
            Ref3: { 'Fn::GetAtt': ['Namespace9B63B8C8', 'Id'] },
            Ref4: 'default',
            Ref5: { Ref: 'EnvironmentMeshE4273EA5' },
            Ref6: { Ref: 'EnvironmentClusterE81C7902' },
            Ref7: { 'Fn::GetAtt': ['EnvironmentClusterE81C7902', 'Arn'] },
            Ref8: { 'Fn::GetAtt': ['EnvironmentGatewaySecurityGroup473A5143', 'GroupId'] },
            Ref9: { Ref: 'EnvironmentGateway3306D38F' },
            Ref10: { 'Fn::GetAtt': ['EnvironmentGatewaySecurityGroup473A5143', 'GroupId'] },
            Ref11: { Ref: 'EnvironmentRouter36ACE08F' },
            Ref12: { Ref: 'EnvironmentRouterService4B5D623E' },
          },
        ],
      },
    }));
  });

  it('imports an environment from a manifest', () => {
    const stack = new cdk.Stack(undefined, undefined, STACK_PROPS);

    // WHEN
    const environment = EnvironmentManifest.environmentFromStringParameter(stack, 'Environment', '/some/path');

    // THEN
    expect(environment).toBeInstanceOf(EnvironmentFromManifest);
    expect(environment.vpc.vpcId).toEqual('vpc-12345'); // should be vpc-12345 to match the Vpc.fromLookup dummy value, not the manifest dummy value.
    expect(environment.namespace.namespaceArn).toEqual('arn:aws:servicediscovery:ca-central-1:0000000000000:namespace/fake-ns');
    expect(environment.cluster.clusterArn).toEqual('arn:aws:ecs:ca-central-1:0000000000000:cluster/fake-cluster');
    expect(environment.mesh.meshArn).toEqual('arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh');
    expect(environment.defaultGateway.virtualGatewayArn).toEqual('arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh/virtualGateway/fake-gateway');
    expect(environment.defaultRouter.virtualRouterArn).toEqual('arn:aws:appmesh:ca-central-1:0000000000000:mesh/fake-mesh/virtualRouter/fake-router');
  });

  it('throws when the manifest cant be parsed', () => {
    const app = new cdk.App({
      context: {
        'ssm:account=1234:parameterName=/some/path:region=us-fake-1': 'not valid json',
      },
    });
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    expect(() => {
      EnvironmentManifest.environmentFromStringParameter(stack, 'Environment', '/some/path');
    }).toThrow(/parsing error/i);
  });

  it('throws when the manifest is unsupported', () => {
    const app = new cdk.App({
      context: {
        'ssm:account=1234:parameterName=/some/path:region=us-fake-1': JSON.stringify({ something: 'else' }),
      },
    });
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    expect(() => {
      EnvironmentManifest.environmentFromStringParameter(stack, 'Environment', '/some/path');
    }).toThrow(/manifest version/i);
  });

  it('imports a public dns namespace', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    const environment = new EnvironmentFromManifest(stack, 'Environment', {
      ...DUMMY_ENVIRONMENT_MANIFEST_V1,
      namespaceAttributes: {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1.namespaceAttributes,
        namespaceType: cloudmap.NamespaceType.DNS_PUBLIC,
      },
    });

    // THEN
    expect(environment.namespace.type).toEqual(cloudmap.NamespaceType.DNS_PUBLIC);

    new EnvironmentFromManifest(stack, 'Environment2', {
      ...DUMMY_ENVIRONMENT_MANIFEST_V1,
      namespaceAttributes: {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1.namespaceAttributes,
        namespaceType: cloudmap.NamespaceType.DNS_PUBLIC,
      },
    });
  });

  it('imports a private dns namespace', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    const environment = new EnvironmentFromManifest(stack, 'Environment', {
      ...DUMMY_ENVIRONMENT_MANIFEST_V1,
      namespaceAttributes: {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1.namespaceAttributes,
        namespaceType: cloudmap.NamespaceType.DNS_PRIVATE,
      },
    });

    // THEN
    expect(environment.namespace.type).toEqual(cloudmap.NamespaceType.DNS_PRIVATE);
  });

  it('throws when importing an unsupported namespace type', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    expect(() => {
      new EnvironmentFromManifest(stack, 'Environment', {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1,
        namespaceAttributes: {
          ...DUMMY_ENVIRONMENT_MANIFEST_V1.namespaceAttributes,
          namespaceType: cloudmap.NamespaceType.HTTP,
        },
      });
    }).toThrow(/unsupported namespace type/i);
  });

  it('populates cluster security groups to connections', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    const environment = new EnvironmentFromManifest(stack, 'Environment', {
      ...DUMMY_ENVIRONMENT_MANIFEST_V1,
      clusterAttributes: {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1.clusterAttributes,
        securityGroupIds: ['sg-fake1', 'sg-fake2'],
      },
    });

    // THEN
    expect(environment.cluster.connections.securityGroups.length).toEqual(2);
  });

  it('populates default gateway security groups to connections', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    const environment = new EnvironmentFromManifest(stack, 'Environment', {
      ...DUMMY_ENVIRONMENT_MANIFEST_V1,
      defaultGatewayAttributes: {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1.defaultGatewayAttributes,
        securityGroupIds: ['sg-fake1', 'sg-fake2'],
      },
    });

    // THEN
    expect(environment.defaultGateway.connections.securityGroups.length).toEqual(2);
  });

  it('populates default router security groups to connections', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'stack', STACK_PROPS);

    // WHEN
    const environment = new EnvironmentFromManifest(stack, 'Environment', {
      ...DUMMY_ENVIRONMENT_MANIFEST_V1,
      defaultRouterAttributes: {
        ...DUMMY_ENVIRONMENT_MANIFEST_V1.defaultRouterAttributes,
        securityGroupIds: ['sg-fake1', 'sg-fake2'],
      },
    });

    // THEN
    expect(environment.defaultRouter.connections.securityGroups.length).toEqual(2);
  });
});

const STACK_PROPS = {
  env: {
    account: '1234',
    region: 'us-fake-1',
  },
};