import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';
import { WebCarverService } from './web-carver-service';

export abstract class WebCarverServiceExtension {
  static linkedService(props: LinkedServiceExtensionProps): IWebCarverServiceExtension {
    return new LinkedServiceExtension(props);
  }

  static envVars(env: Record<string, string>): IWebCarverServiceExtension {
    return new EnvVarsExtension(env);
  }

  static httpGatewayRoute(props?: HttpGatewayRouteExtensionProps): IWebCarverServiceExtension {
    return new HttpGatewayRouteExtension(props);
  }

  static http2GatewayRoute(props?: Http2GatewayRouteExtensionProps): IWebCarverServiceExtension {
    return new Http2GatewayRouteExtension(props);
  }
}

/**
 * Extends the service with additional features.
 */
export interface IWebCarverServiceExtension {
  extend(scope: cdk.Construct, webCarverService: WebCarverService): void;
}

/**
 * Adds environment variables to the container.
 */
class EnvVarsExtension implements IWebCarverServiceExtension {
  constructor(private readonly env: Record<string, string>) {
  }

  extend(_scope: cdk.Construct, webCarverService: WebCarverService): void {
    webCarverService.addEnvVars(this.env);
  }
}

export interface Http2GatewayRouteExtensionProps extends appmesh.HttpGatewayRouteMatch {
}

/**
 * Adds an HTTP2 route to the environment's gateway and allows-in traffic
 * from the gateway.
 */
export class Http2GatewayRouteExtension implements IWebCarverServiceExtension {
  constructor(private readonly props?: Http2GatewayRouteExtensionProps) {
  }

  extend(scope: cdk.Construct, webCarverService: WebCarverService) {
    new appmesh.GatewayRoute(scope, 'Http2GatewayRoute', {
      virtualGateway: webCarverService.environment.defaultGateway.virtualGateway,
      routeSpec: appmesh.GatewayRouteSpec.http2({
        match: this.props,
        routeTarget: webCarverService.virtualService,
      }),
    });

    webCarverService.connections.allowDefaultPortFrom(webCarverService.environment.defaultGateway);
    webCarverService.connections.allowFromAnyIpv4(ec2.Port.allTraffic());
  }
}

export interface HttpGatewayRouteExtensionProps extends appmesh.HttpGatewayRouteMatch {
}

/**
 * Adds an HTTP route to the environment's gateway and allows in traffic from
 * the gateway.
 */
export class HttpGatewayRouteExtension implements IWebCarverServiceExtension {
  constructor(private readonly props?: HttpGatewayRouteExtensionProps) {
  }

  extend(scope: cdk.Construct, webCarverService: WebCarverService) {
    new appmesh.GatewayRoute(scope, 'HttpGatewayRoute', {
      virtualGateway: webCarverService.environment.defaultGateway.virtualGateway,
      routeSpec: appmesh.GatewayRouteSpec.http({
        match: this.props,
        routeTarget: webCarverService.virtualService,
      }),
    });

    webCarverService.connections.allowDefaultPortFrom(webCarverService.environment.defaultGateway);
    webCarverService.connections.allowFromAnyIpv4(ec2.Port.allTraffic());
  }
}

/**
 * Props for `LinkedServiceExtension`
 */
export interface LinkedServiceExtensionProps {
  readonly webCarverService: WebCarverService;
}

/**
 * Links another mesh service to this service so that it can be connected to.
 */
export class LinkedServiceExtension implements IWebCarverServiceExtension {
  private readonly linkedWebCarverService: WebCarverService;

  constructor(props: LinkedServiceExtensionProps) {
    this.linkedWebCarverService = props.webCarverService;
  }

  extend(_scope: cdk.Construct, service: WebCarverService) {
    service.virtualNode.addBackend(this.linkedWebCarverService.virtualService);
    service.addEnvVars({
      BACKEND: this.linkedWebCarverService.virtualService.virtualServiceName,
    });
    this.linkedWebCarverService.connections.allowDefaultPortFrom(service);
  }
}