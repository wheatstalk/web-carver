import { expect as expectCDK } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import { IntegEnvironment } from '../../src/integ/integ-environment';


test('it runs the integ-environment synthesizes', () => {
  const app = new cdk.App();
  const stack = new IntegEnvironment(app);

  expectCDK(stack);
});