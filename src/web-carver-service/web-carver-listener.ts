import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import { WebCarverService } from './web-carver-service';

export abstract class WebCarverListener {
  /**
   * Provides a listener that supports at most HTTP/1.1. This is probably a
   * little more useful for software that doesn't support HTTP/2 at all,
   * which can happen, but probably isn't happening to you.
   */
  static http1(containerPort: number): IWebCarverListener {
    return {
      bind: () => ({
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
   * @param containerPort
   */
  static http2(containerPort: number): IWebCarverListener {
    return {
      bind: () => ({
        containerPort: containerPort,
        protocol: ecs.Protocol.TCP,
        virtualNodeListener: appmesh.VirtualNodeListener.http2({
          port: containerPort,
        }),
      }),
    };
  }
}

export interface IWebCarverListener {
  bind(service: WebCarverService): WebCarverListenerInfo;
}

export interface WebCarverListenerInfo {
  readonly containerPort: number;
  readonly protocol: ecs.Protocol;
  readonly virtualNodeListener?: appmesh.VirtualNodeListener;
}