import * as appmesh from '@aws-cdk/aws-appmesh';
import * as cdk from '@aws-cdk/core';
import { IGateway } from '../gateway';
import { Service } from './service';

/**
 * Extends the service with additional features.
 */
export interface IServiceExtension {
  /**
   * @internal
   */
  _extend(scope: cdk.Construct, service: Service): void;
}

/**
 * Used to create service extensions.
 */
export abstract class ServiceExtension {
  /**
   * Link a WebCarver service
   */
  static linkedService(options: LinkedServiceExtensionOptions): IServiceExtension {
    return new LinkedServiceExtension(options);
  }

  /**
   * Add environment variables.
   */
  static envVars(env: Record<string, string>): IServiceExtension {
    return new EnvVarsExtension(env);
  }

  /**
   * Add an HTTP gateway route.
   */
  static httpGatewayRoute(options?: HttpGatewayRouteExtensionOptions): IServiceExtension {
    return new HttpGatewayRouteExtension(options);
  }

  /**
   * Add an HTTP/2 gateway route.
   */
  static http2GatewayRoute(options?: Http2GatewayRouteExtensionOptions): IServiceExtension {
    return new Http2GatewayRouteExtension(options);
  }

  /**
   * Add an HTTP route.
   */
  static httpRoute(options: HttpRouteExtensionOptions): IServiceExtension {
    return new HttpRouteExtension(options);
  }
}

/**
 * Adds environment variables to the container.
 * @internal
 */
class EnvVarsExtension implements IServiceExtension {
  constructor(private readonly env: Record<string, string>) {
  }

  _extend(_scope: cdk.Construct, service: Service): void {
    service.addEnvVars(this.env);
  }
}

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
  constructor(private readonly props?: Http2GatewayRouteExtensionOptions) {
  }

  _extend(scope: cdk.Construct, service: Service) {
    const gateway = this.props?.gateway ?? service.environment.defaultGateway;

    new appmesh.GatewayRoute(scope, 'Http2GatewayRoute', {
      virtualGateway: gateway,
      routeSpec: appmesh.GatewayRouteSpec.http2({
        match: this.props,
        routeTarget: service.virtualService,
      }),
    });

    service.connections.allowDefaultPortFrom(gateway);
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
  constructor(private readonly props?: HttpGatewayRouteExtensionOptions) {
  }

  _extend(scope: cdk.Construct, service: Service) {
    const gateway = this.props?.gateway ?? service.environment.defaultGateway;

    new appmesh.GatewayRoute(scope, 'HttpGatewayRoute', {
      virtualGateway: gateway,
      routeSpec: appmesh.GatewayRouteSpec.http({
        match: this.props,
        routeTarget: service.virtualService,
      }),
    });

    service.connections.allowDefaultPortFrom(gateway);
  }
}

/**
 * Props for `LinkedServiceExtension`
 */
export interface LinkedServiceExtensionOptions {
  /**
   * The Web Carver service to link to.
   */
  readonly service: Service;
}

/**
 * Links another mesh service to this service so that it can be connected to.
 * @internal
 */
export class LinkedServiceExtension implements IServiceExtension {
  private readonly linkedService: Service;

  constructor(props: LinkedServiceExtensionOptions) {
    this.linkedService = props.service;
  }

  _extend(_scope: cdk.Construct, service: Service) {
    service.virtualNode.addBackend(this.linkedService.virtualService);
    service.addEnvVars({
      BACKEND: this.linkedService.virtualService.virtualServiceName,
    });
    this.linkedService.connections.allowDefaultPortFrom(service);
  }
}

/**
 * Options for adding Http routes
 */
export interface HttpRouteExtensionOptions {
  /**
   * Path prefix to match. Must begin with a forward slash.
   * @default '/'
   */
  readonly prefixPath?: string;

  /**
   * Match requests with these headers.
   * @default - not used to match requests
   */
  readonly headers?: IHttpRouteHeaderMatch[];

  /**
   * Match based on the request's HTTP method.
   * @default - not used to match requests
   */
  readonly method?: string;
}

/**
 * @internal
 */
export class HttpRouteExtension implements IServiceExtension {
  private readonly match: appmesh.CfnRoute.HttpRouteMatchProperty;

  constructor(private readonly options: HttpRouteExtensionOptions = {}) {
    const prefixPath = options.prefixPath ?? '/';
    if (prefixPath[0] !== '/') {
      throw new Error('Prefix paths must start with forward slash.');
    }

    this.match = {
      prefix: prefixPath,
      headers: !this.options.headers ? undefined : this.options.headers.map(header => header._bind()),
      method: this.options.method,
    };
  }

  _extend(_scope: cdk.Construct, service: Service): void {
    const virtualRouter = service.environment.defaultRouter;

    const httpRouteSpec = {
      action: {
        weightedTargets: [{
          virtualNode: service.virtualNode.virtualNodeName,
          weight: 1,
        }],
      },
      match: this.match,
    };

    new appmesh.Route(_scope, 'HTTP2', {
      mesh: virtualRouter.mesh,
      virtualRouter: virtualRouter,
      routeSpec: {
        bind: () => ({
          http2RouteSpec: httpRouteSpec,
        }),
      },
    });

    new appmesh.Route(_scope, 'HTTP', {
      mesh: virtualRouter.mesh,
      virtualRouter: virtualRouter,
      routeSpec: {
        bind: () => ({
          httpRouteSpec: httpRouteSpec,
        }),
      },
    });

    service.connections.allowDefaultPortFrom(virtualRouter);
  }
}

/**
 * A request header matcher.
 */
export interface IHttpRouteHeaderMatch {
  /**
   * @internal
   */
  _bind(): appmesh.CfnRoute.HttpRouteHeaderProperty;
}

/**
 * Used to generate header matching methods.
 */
export abstract class HttpRouteHeaderMatch {
  /**
   * The value sent by the client must match the specified value exactly.
   */
  static exact(name: string, exactValue: string): IHttpRouteHeaderMatch {
    return {
      _bind: () => ({
        name,
        match: { exact: exactValue },
      }),
    };
  }

  /**
   * The value sent by the client must begin with the specified characters.
   */
  static prefix(name: string, prefix: string): IHttpRouteHeaderMatch {
    return {
      _bind: () => ({
        name,
        match: { prefix },
      }),
    };
  }

  /**
   * The value sent by the client must end with the specified characters.
   */
  static suffix(name: string, suffix: string): IHttpRouteHeaderMatch {
    return {
      _bind: () => ({
        name,
        match: { suffix },
      }),
    };
  }

  /**
   * The value sent by the client must include the specified characters.
   */
  static regex(name: string, regex: string): IHttpRouteHeaderMatch {
    return {
      _bind: () => ({
        name,
        match: { regex },
      }),
    };
  }

  /**
   * Match on a numeric range of values.
   */
  static range(name: string, range: HttpRouteHeaderMatchRangeOptions): IHttpRouteHeaderMatch {
    return {
      _bind: () => ({
        name,
        match: { range },
      }),
    };
  }
}

/**
 * Options for a matching HTTP headers in a range.
 */
export interface HttpRouteHeaderMatchRangeOptions {
  /**
   * Match on values starting at and including this value
   */
  readonly start: number;

  /**
   * Match on values up to but not including this value
   */
  readonly end: number;
}
