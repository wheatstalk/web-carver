import * as ecs from '@aws-cdk/aws-ecs';
import { IServiceExtension } from './api';
import { ContainerExtension, ContainerExtensionOptions } from './container';
import { EnvVarsExtension } from './env-vars';
import {
  Http2GatewayRouteExtension,
  Http2GatewayRouteExtensionOptions,
  HttpGatewayRouteExtension,
  HttpGatewayRouteExtensionOptions,
} from './http-gateway-route';
import { HttpRouteExtension, HttpRouteExtensionOptions } from './http-route';
import { LinkedServiceExtension, LinkedServiceExtensionOptions } from './linked-service';
import { TaskSizeExtension, TaskSizeExtensionOptions } from './task-size';
import { CapacityProviderStrategiesExtension } from './use-spot-capacity';

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

  /**
   * Add a container.
   */
  static container(props: ContainerExtensionOptions): IServiceExtension {
    return new ContainerExtension(props);
  }

  /**
   * Use spot capacity
   */
  static spotCapacity(): IServiceExtension {
    return new CapacityProviderStrategiesExtension([
      { capacityProvider: 'FARGATE_SPOT', weight: 100 },
      { capacityProvider: 'FARGATE', weight: 1 },
    ]);
  }

  /**
   * Use the given capacity provider strategies.
   */
  static capacityProviderStrategies(capacityProviderStrategies: ecs.CapacityProviderStrategy[]): IServiceExtension {
    return new CapacityProviderStrategiesExtension(capacityProviderStrategies);
  }

  /**
   * Choose the amount of CPU and memory to provision.
   */
  static taskSize(options: TaskSizeExtensionOptions): IServiceExtension {
    return new TaskSizeExtension(options);
  }
}