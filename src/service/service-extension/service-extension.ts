import { IServiceExtension } from './api';
import { TrafficContainerExtension, ContainerExtensionOptions } from './container';
import { EnvVarsExtension } from './env-vars';
import {
  Http2GatewayRouteExtension,
  Http2GatewayRouteExtensionOptions,
  HttpGatewayRouteExtension,
  HttpGatewayRouteExtensionOptions,
} from './http-gateway-route';
import { HttpRouteExtension, HttpRouteExtensionOptions } from './http-route';
import { LinkedServiceExtension, LinkedServiceExtensionOptions } from './linked-service';

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

  static container(props: ContainerExtensionOptions): IServiceExtension {
    return new TrafficContainerExtension(props);
  }
}