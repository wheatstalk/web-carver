import * as appmesh from '@aws-cdk/aws-appmesh';
import * as cdk from '@aws-cdk/core';
import { IServiceExtensionFacade } from '../service';
import { IServiceExtension } from './api';

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

  public readonly _extensionTypeName = 'HttpRouteExtension';

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

  _register(service: IServiceExtensionFacade, privateScope: cdk.Construct) {
    const virtualRouter = service.environment.defaultRouter;

    service._onWorkloadReady(workloadOptions => {
      const { virtualNode } = workloadOptions;

      const httpRouteSpec = {
        action: {
          weightedTargets: [{
            virtualNode: virtualNode.virtualNodeName,
            weight: 1,
          }],
        },
        match: this.match,
      };

      new appmesh.Route(privateScope, 'HTTP2', {
        mesh: virtualRouter.mesh,
        virtualRouter: virtualRouter,
        routeSpec: {
          bind: () => ({
            http2RouteSpec: httpRouteSpec,
          }),
        },
      });

      new appmesh.Route(privateScope, 'HTTP', {
        mesh: virtualRouter.mesh,
        virtualRouter: virtualRouter,
        routeSpec: {
          bind: () => ({
            httpRouteSpec: httpRouteSpec,
          }),
        },
      });
    });

    service._onConnectionsReady(connections => {
      connections.allowDefaultPortFrom(virtualRouter);
    });
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