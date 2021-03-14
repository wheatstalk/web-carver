import * as appmesh from '@aws-cdk/aws-appmesh';
import * as cdk from '@aws-cdk/core';
import { IGateway } from '../../gateway';
import { IServiceExtension, IServiceExtensionApi } from './api';

/**
 * HTTP/2 Gateway Route Extension Options
 */
export interface Http2GatewayRouteExtensionOptions {
  /**
   * The path prefix the gateway route should match. Your service will receive
   * a rewritten host path.
   * @default '/'
   */
  readonly prefixPath?: string;

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
  private readonly http2GatewayRouteSpecMatch: appmesh.HttpGatewayRouteMatch;

  constructor(private readonly props?: Http2GatewayRouteExtensionOptions) {
    this.http2GatewayRouteSpecMatch = {
      prefixPath: props?.prefixPath ?? '/',
    };
  }

  _register(service: IServiceExtensionApi, privateScope: cdk.Construct) {
    const gateway = this.props?.gateway ?? service.environment.defaultGateway;

    service._onWorkloadReady(workloadOptions => {
      const { virtualService } = workloadOptions;

      new appmesh.GatewayRoute(privateScope, 'Http2GatewayRoute', {
        virtualGateway: gateway,
        routeSpec: appmesh.GatewayRouteSpec.http2({
          match: this.http2GatewayRouteSpecMatch,
          routeTarget: virtualService,
        }),
      });
    });

    service._onConnectionsReady(connections => {
      connections.allowDefaultPortFrom(gateway);
    });
  }
}

/**
 * HTTP Gateway Route Extension Options
 */
export interface HttpGatewayRouteExtensionOptions {
  /**
   * The path prefix the gateway route should match. Your service will receive
   * a rewritten host path.
   * @default '/'
   */
  readonly prefixPath?: string;

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
  private readonly http2GatewayRouteSpecMatch: appmesh.HttpGatewayRouteMatch;

  constructor(private readonly props?: HttpGatewayRouteExtensionOptions) {
    this.http2GatewayRouteSpecMatch = {
      prefixPath: props?.prefixPath ?? '/',
    };
  }

  _register(service: IServiceExtensionApi, privateScope: cdk.Construct) {
    const gateway = this.props?.gateway ?? service.environment.defaultGateway;

    service._onWorkloadReady(workloadOptions => {
      const { virtualService } = workloadOptions;

      new appmesh.GatewayRoute(privateScope, 'HttpGatewayRoute', {
        virtualGateway: gateway,
        routeSpec: appmesh.GatewayRouteSpec.http({
          match: this.http2GatewayRouteSpecMatch,
          routeTarget: virtualService,
        }),
      });
    });

    service._onConnectionsReady(connections => {
      connections.allowDefaultPortFrom(gateway);
    });
  }
}