import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import { Service } from './service';

/**
 * A service listener.
 */
export interface IServiceListener {
  /**
   * @internal
   */
  _bind(service: Service): ServiceListenerConfig;
}

/**
 * @internal
 */
export interface ServiceListenerConfig {
  readonly containerPort: number;
  readonly protocol: ecs.Protocol;
  readonly virtualNodeListener?: appmesh.VirtualNodeListener;
}

/**
 * Provides service listeners
 */
export abstract class ServiceListener {
  /**
   * Provides a listener that supports at most HTTP/1.1. This is probably a
   * little more useful for software that doesn't support HTTP/2 at all,
   * which can happen, but probably isn't happening to you.
   */
  static http1(containerPort: number): IServiceListener {
    return {
      _bind: () => ({
        containerPort: containerPort,
        protocol: ecs.Protocol.TCP,
        virtualNodeListener: appmesh.VirtualNodeListener.http({
          port: containerPort,
        }),
      }),
    };
  }

  /**
   * Provides a listener that supports HTTP/2 and HTTP/1.1
   */
  static http2(containerPort: number): IServiceListener {
    return {
      _bind: () => ({
        containerPort: containerPort,
        protocol: ecs.Protocol.TCP,
        virtualNodeListener: appmesh.VirtualNodeListener.http2({
          port: containerPort,
        }),
      }),
    };
  }
}
