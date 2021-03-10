import * as cdk from '@aws-cdk/core';
import { IntegEnvironment } from './integ-environment';

const app = new cdk.App();
new IntegEnvironment(app);