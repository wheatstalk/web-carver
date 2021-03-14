import { expect as expectCDK, haveResourceLike } from '@aws-cdk/assert';
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