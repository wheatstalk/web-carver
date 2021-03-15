import * as appmesh from '@aws-cdk/aws-appmesh';
import * as cdk from '@aws-cdk/core';
import { IServiceExtension, IServiceExtensionApi } from './api';

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

  _register(service: IServiceExtensionApi, privateScope: cdk.Construct) {
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
export abstract class HttpRouteHeaderMatch implements IHttpRouteHeaderMatch {
  /**
   * The value sent by the client must match the specified value exactly.
   */
  static valueIs(headerName: string, exactValue: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, false, {
      exact: exactValue,
    });
  }

  /**
   * The value sent by the client must not match the specified value exactly.
   */
  static valueIsNot(headerName: string, exactValue: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, true, {
      exact: exactValue,
    });
  }

  /**
   * The value sent by the client must begin with the specified characters.
   */
  static valueStartsWith(headerName: string, prefix: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, false, { prefix });
  }

  /**
   * The value sent by the client must not begin with the specified characters.
   */
  static valueDoesNotStartWith(headerName: string, prefix: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, false, { prefix });
  }

  /**
   * The value sent by the client must end with the specified characters.
   */
  static valueEndsWith(headerName: string, suffix: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, false, { suffix });
  }

  /**
   * The value sent by the client must not end with the specified characters.
   */
  static valueDoesNotEndWith(headerName: string, suffix: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, true, { suffix });
  }

  /**
   * The value sent by the client must include the specified characters.
   */
  static valueMatchesRegex(headerName: string, regex: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, false, { regex });
  }

  /**
   * The value sent by the client must include the specified characters.
   */
  static valueDoesNotMatchRegex(headerName: string, regex: string): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, true, { regex });
  }

  /**
   * The value sent by the client must be in the given range.
   */
  static valueIsInRange(headerName: string, range: HttpRouteHeaderMatchRangeOptions): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, false, { range });
  }

  /**
   * The value sent by the client must nto be in the given range
   */
  static valueIsNotInRange(headerName: string, range: HttpRouteHeaderMatchRangeOptions): IHttpRouteHeaderMatch {
    return new HttpRouteHeaderMatchImpl(headerName, true, { range });
  }

  /** @internal */
  abstract _bind(): appmesh.CfnRoute.HttpRouteHeaderProperty;
}

class HttpRouteHeaderMatchImpl extends HttpRouteHeaderMatch {
  constructor(
    private readonly headerName: string,
    private readonly invert: boolean,
    private readonly headerMatchProperty: appmesh.CfnRoute.HeaderMatchMethodProperty,
  ) {
    super();
  }

  _bind(): appmesh.CfnRoute.HttpRouteHeaderProperty {
    return {
      name: this.headerName,
      invert: this.invert,
      match: this.headerMatchProperty,
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