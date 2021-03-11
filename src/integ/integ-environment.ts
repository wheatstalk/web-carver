import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import * as webcarver from '..';
import { SSM_PARAM_NAME, STACK_NAME_BASE } from './integ-environment-constants';

export class IntegEnvironment extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, STACK_NAME_BASE);

    webcarver.PreferencesContext.set(this.node, {
      usePublicServiceNetworking: true,
      useFargateSpot: true,
    });

    const environment = new webcarver.Environment(this, 'Environment');

    // Create a manifest file that the environment can be loaded from.
    new webcarver.EnvironmentManifest(this, 'EnvironmentManifest', {
      parameterName: SSM_PARAM_NAME,
      environment,
    });

    new webcarver.Service(this, 'GatewayEcho', {
      environment,
      name: webcarver.ServiceName.hostName('gateway-echo'),
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
          environment: { PORT: '80' },
          listeners: [
            webcarver.ServiceListener.http2(80),
          ],
        }),
        webcarver.ServiceExtension.http2GatewayRoute({ prefixPath: '/gateway-echo' }),
      ],
    });

    new webcarver.Service(this, 'RoutedEcho', {
      environment,
      name: webcarver.ServiceName.hostName('routed-echo'),
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
          environment: { PORT: '80' },
          listeners: [
            webcarver.ServiceListener.http1(80),
          ],
        }),
        // Handle requests on /echo
        webcarver.ServiceExtension.httpRoute({ prefixPath: '/echo' }),
        // Handle requests to routed-echo.myexample.com
        webcarver.ServiceExtension.httpRoute({
          headers: [
            webcarver.HttpRouteHeaderMatch.exact('x-forwarded-host', 'routed-echo.myexample.com'),
          ],
        }),
      ],
    });
  }
}
