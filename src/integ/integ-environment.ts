import * as path from 'path';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { Environment } from '../environment';
import { PreferencesContext } from '../preferences';
import { ServiceListener, Service, ServiceExtension, HttpRouteHeaderMatch, ServiceName } from '../service';

export class IntegEnvironment extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, 'integ-environment');

    PreferencesContext.set(this.node, {
      usePublicServiceNetworking: true,
      useFargateSpot: true,
    });

    const environment = new Environment(this, 'Environment');

    new Service(this, 'GatewayEcho', {
      environment,
      name: ServiceName.hostName('gateway-echo'),
      listeners: [ServiceListener.http2(80)],
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
          environment: { PORT: '80' },
        }),
        ServiceExtension.http2GatewayRoute({ prefixPath: '/gateway-echo' }),
      ],
    });

    new Service(this, 'RoutedEcho', {
      environment,
      name: ServiceName.hostName('routed-echo'),
      listeners: [ServiceListener.http1(80)],
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
          environment: { PORT: '80' },
        }),
        // Handle requests on /echo
        ServiceExtension.httpRoute({ prefixPath: '/echo' }),
        // Handle requests to routed-echo.myexample.com
        ServiceExtension.httpRoute({
          headers: [
            HttpRouteHeaderMatch.exact('x-forwarded-host', 'routed-echo.myexample.com'),
          ],
        }),
      ],
    });

    const backend = new Service(this, 'Backend', {
      environment,
      name: ServiceName.hostName('backend'),
      listeners: [ServiceListener.http1(80)],
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'mesh-app')),
          environment: { FLASK_APP: 'backend.py' },
        }),
        ServiceExtension.httpRoute({
          prefixPath: '/backend',
        }),
      ],
    });

    new Service(this, 'Consumer', {
      environment,
      name: ServiceName.hostName('consumer'),
      listeners: [ServiceListener.http1(80)],
      extensions: [
        ServiceExtension.container({
          image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'mesh-app')),
          environment: { FLASK_APP: 'consumer.py' },
        }),
        ServiceExtension.httpRoute({ prefixPath: '/consumer' }),
        ServiceExtension.linkedService({ service: backend }),
      ],
    });
  }
}

const app = new cdk.App();
new IntegEnvironment(app);