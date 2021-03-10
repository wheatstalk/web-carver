import * as path from 'path';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '..';
import { SSM_PARAM_NAME, STACK_NAME_BASE } from './integ-environment-constants';

export class IntegEnvironmentChild extends cdk.Stack {
  constructor(scope: cdk.Construct, props?: cdk.StackProps) {
    super(scope, `${STACK_NAME_BASE}-child`, props ?? {
      env: {
        account: process.env.CDK_DEFAULT_ACCOUNT,
        region: process.env.CDK_DEFAULT_REGION,
      },
    });

    webcarver.PreferencesContext.set(this.node, {
      usePublicServiceNetworking: true,
      useFargateSpot: true,
    });

    const environment = webcarver.EnvironmentManifest.environmentFromStringParameter(this, 'Environment', SSM_PARAM_NAME);

    const backend = new webcarver.Service(this, 'Backend', {
      environment,
      name: webcarver.ServiceName.hostName('backend'),
      listeners: [webcarver.ServiceListener.http1(80)],
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'mesh-app')),
          environment: { FLASK_APP: 'backend.py' },
        }),
        webcarver.ServiceExtension.httpRoute({
          prefixPath: '/backend',
        }),
      ],
    });

    new webcarver.Service(this, 'Consumer', {
      environment,
      name: webcarver.ServiceName.hostName('consumer'),
      listeners: [webcarver.ServiceListener.http1(80)],
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'mesh-app')),
          environment: { FLASK_APP: 'consumer.py' },
        }),
        webcarver.ServiceExtension.httpRoute({ prefixPath: '/consumer' }),
        webcarver.ServiceExtension.linkedService({ service: backend }),
      ],
    });
  }
}
