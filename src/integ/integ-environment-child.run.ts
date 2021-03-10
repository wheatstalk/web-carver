import * as cdk from '@aws-cdk/core';
import { IntegEnvironmentChild } from './integ-environment-child';

const app = new cdk.App();
new IntegEnvironmentChild(app);