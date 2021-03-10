import { SynthUtils } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { IntegEnvironment } from '../../src/integ/integ-environment';
import { IntegEnvironmentChild } from '../../src/integ/integ-environment-child';


test('integ-environment', () => {
  const app = new cdk.App();
  const stack = new IntegEnvironment(app);

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});

test('integ-environment-child', () => {
  const app = new cdk.App();
  const stack = new IntegEnvironmentChild(app, {
    env: {
      account: '1234',
      region: 'us-fake-1',
    },
  });

  expect(SynthUtils.toCloudFormation(stack)).toMatchSnapshot();
});