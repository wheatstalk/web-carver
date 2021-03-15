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
            webcarver.HttpRouteHeaderMatch.valueIs('x-forwarded-host', 'routed-echo.myexample.com'),
          ],
        }),
      ],
    });

    new webcarver.Service(this, 'ProtectedEcho', {
      environment,
      name: webcarver.ServiceName.hostName('protected-echo'),
      extensions: [
        webcarver.ServiceExtension.container({
          image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
          environment: { PORT: '8080' },
          listeners: [
            webcarver.ServiceListener.oidcHttpProxy({
              containerPort: 8080,
              oidcDiscoveryEndpoint: 'https://oidc-mock.wheatstalk.ca/.well-known/openid-configuration',
              // Bad: Only for the sake of demonstration. Use a Secret Manager
              // secret instead.
              oidcPlainTextCredentials: {
                // We're using a mock OIDC service. The credentials are not
                // used by the mock for authenticating.
                clientId: 'fake',
                clientSecret: 'fake',
              },
            }),
          ],
        }),
        webcarver.ServiceExtension.httpRoute({ prefixPath: '/protected-echo' }),
        webcarver.ServiceExtension.httpRoute({ prefixPath: '/redirect_uri' }),
      ],
    });
  }
}
