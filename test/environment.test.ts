import { haveResourceLike } from '@aws-cdk/assert';
import { expect as expectCDK } from '@aws-cdk/assert/lib/expect';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as cdk from '@aws-cdk/core';
import { Environment } from '../src';
import { EnvironmentManifest } from '../src/environment-manifest';
import { PreferencesContext } from '../src/preferences';

describe('Webcarver Environment', () => {
  test('can create a packaged environment', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new Environment(stack, 'WebCarver');

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::Cluster'));
    expectCDK(stack).to(haveResourceLike('AWS::AppMesh::Mesh'));
    expectCDK(stack).to(haveResourceLike('AWS::ServiceDiscovery::PrivateDnsNamespace'));
    expectCDK(stack).to(haveResourceLike('AWS::EC2::VPC'));
    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::LoadBalancer'));
    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTP',
    }));
  });

  test('can create an environment with HTTPS', () => {
    // GIVEN
    const stack = new cdk.Stack();
    const certificate = new acm.Certificate(stack, 'Certificate', {
      domainName: 'example.com',
    });

    // WHEN
    new Environment(stack, 'WebCarver', {
      certificates: [certificate],
    });

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTPS',
    }));
    expectCDK(stack).to(haveResourceLike('AWS::ElasticLoadBalancingV2::Listener', {
      Protocol: 'HTTP',
      DefaultActions: [{
        Type: 'redirect',
        RedirectConfig: {
          Port: '443',
          Protocol: 'HTTPS',
          StatusCode: 'HTTP_302',
        },
      }],
    }));
  });

  test('default networking creates gateway and services subnets with vpc', () => {
    // GIVEN
    const stack = new cdk.Stack();

    // WHEN
    new Environment(stack, 'WebCarver');

    expectCDK(stack).to(haveResourceLike('AWS::EC2::VPC'));
    expectCDK(stack).to(haveResourceLike('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'gateway',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
        },
      ],
    }));
    expectCDK(stack).to(haveResourceLike('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: false,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'services',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Private',
        },
        {
          Key: 'Name',
        },
      ],
    }));
  });

  test('public service networking creates an all-public with vpc', () => {
    // GIVEN
    const stack = new cdk.Stack();
    PreferencesContext.set(stack.node, {
      usePublicServiceNetworking: true,
    });

    // WHEN
    new Environment(stack, 'WebCarver');

    expectCDK(stack).to(haveResourceLike('AWS::EC2::VPC'));
    expectCDK(stack).to(haveResourceLike('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
        },
      ],
    }));
    expectCDK(stack).to(haveResourceLike('AWS::EC2::Subnet', {
      MapPublicIpOnLaunch: true,
      Tags: [
        {
          Key: 'aws-cdk:subnet-name',
          Value: 'public',
        },
        {
          Key: 'aws-cdk:subnet-type',
          Value: 'Public',
        },
        {
          Key: 'Name',
        },
      ],
    }));
  });

  test('created namespace is named based on the stack', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'MyStack');

    // WHEN
    new Environment(stack, 'WebCarver');

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ServiceDiscovery::PrivateDnsNamespace', {
      Name: 'mystack',
    }));
  });

  test('gateway service uses environment security group', () => {
    // GIVEN
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'MyStack');

    // WHEN
    const environment = new Environment(stack, 'WebCarver');

    // THEN
    expectCDK(stack).to(haveResourceLike('AWS::ECS::Service', {
      NetworkConfiguration: {
        AwsvpcConfiguration: {
          SecurityGroups: [
            { 'Fn::GetAtt': ['WebCarverGatewaySecurityGroup914397CC', 'GroupId'] },
            { 'Fn::GetAtt': ['WebCarverSecurityGroupC23EEF3F', 'GroupId'] },
          ],
        },
      },
    }));
    // default gateway connections should not include the environment's security group
    expect(environment.defaultGateway.connections.securityGroups.some(sg => sg === environment.securityGroup)).toEqual(false);
    // default router connections should not include the environment's security group
    expect(environment.defaultRouter.connections.securityGroups.some(sg => sg === environment.securityGroup)).toEqual(false);
  });

  describe('manifest', () => {
    test('stores a manifest in SSM', () => {
      // GIVEN
      const stack = new cdk.Stack();
      const environment = new Environment(stack, 'WebCarver');

      // WHEN
      new EnvironmentManifest(stack, 'WebCarverManifest', {
        parameterName: '/foo',
        environment,
      });

      // THEN
      expectCDK(stack).to(haveResourceLike('AWS::SSM::Parameter', {
        Name: '/foo',
        // Value: 'foobar',
      }));
    });
  });
});

