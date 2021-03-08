import * as appmesh from '@aws-cdk/aws-appmesh';
import * as cdk from '@aws-cdk/core';
import { IGateway } from '../../gateway';
import { Service } from '../service';
import { IServiceExtension } from './api';

/**
 * Options for adding gateway routes.
 */
export interface Http2GatewayRouteExtensionOptions extends appmesh.HttpGatewayRouteMatch {
  /**
   * The gateway to add a route to.
   * @default - the service's default gateway.
   */
  readonly gateway?: IGateway;
}

/**
 * Adds an HTTP2 route to the environment's gateway.
 * @internal
 */
export class Http2GatewayRouteExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'Http2GatewayRouteExtension';

  constructor(private readonly props?: Http2GatewayRouteExtensionOptions) {
  }

  _register(service: Service, privateScope: cdk.Construct) {
    service._virtualServiceEvent.subscribe((_scope, virtualService) => {
      const gateway = this.props?.gateway ?? service.environment.defaultGateway;

      new appmesh.GatewayRoute(privateScope, 'Http2GatewayRoute', {
        virtualGateway: gateway,
        routeSpec: appmesh.GatewayRouteSpec.http2({
          match: this.props,
          routeTarget: virtualService,
        }),
      });

      service.connections.allowDefaultPortFrom(gateway);
    });
  }
}

export interface HttpGatewayRouteExtensionOptions extends appmesh.HttpGatewayRouteMatch {
  /**
   * The gateway to add a route to.
   * @default - the service's default gateway.
   */
  readonly gateway?: IGateway;
}

/**
 * Adds an HTTP route to the environment's gateway and allows in traffic from
 * the gateway.
 * @internal
 */
export class HttpGatewayRouteExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'HttpGatewayRouteExtension';

  constructor(private readonly props?: HttpGatewayRouteExtensionOptions) {
  }

  _register(service: Service, privateScope: cdk.Construct) {
    service._virtualServiceEvent.subscribe((_scope, virtualService) => {
      const gateway = this.props?.gateway ?? service.environment.defaultGateway;

      new appmesh.GatewayRoute(privateScope, 'HttpGatewayRoute', {
        virtualGateway: gateway,
        routeSpec: appmesh.GatewayRouteSpec.http({
          match: this.props,
          routeTarget: virtualService,
        }),
      });

      service.connections.allowDefaultPortFrom(gateway);
    });
  }
}