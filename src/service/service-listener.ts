import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { IServiceExtensionApi } from './service';
import { OidcHttpProxyExtension, OidcHttpProxyExtensionOptions } from './service-extension/oidc-http-proxy';

/**
 * A service listener.
 */
export interface IServiceListener {
  /**
   * @internal
   */
  _bind(scope: cdk.Construct, service: IServiceExtensionApi): ServiceListenerConfig;
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
export abstract class ServiceListener implements IServiceListener {
  /**
   * Provides a listener that supports at most HTTP/1.1. This is probably a
   * little more useful for software that doesn't support HTTP/2 at all,
   * which can happen, but probably isn't happening to you.
   */
  static http1(containerPort: number = 80): IServiceListener {
    return new ServiceListenerImpl({
      containerPort: containerPort,
      protocol: ecs.Protocol.TCP,
      virtualNodeListener: appmesh.VirtualNodeListener.http({
        port: containerPort,
      }),
    });
  }

  /**
   * Provides a listener that supports HTTP/2 and HTTP/1.1
   */
  static http2(containerPort: number = 80): IServiceListener {
    return new ServiceListenerImpl({
      containerPort: containerPort,
      protocol: ecs.Protocol.TCP,
      virtualNodeListener: appmesh.VirtualNodeListener.http2({
        port: containerPort,
      }),
    });
  }

  /**
   * Provides a listener that supports gRPC
   */
  static grpc(containerPort: number = 80): IServiceListener {
    return new ServiceListenerImpl({
      containerPort,
      protocol: ecs.Protocol.TCP,
      virtualNodeListener: appmesh.VirtualNodeListener.grpc({
        port: containerPort,
      }),
    });
  }

  /**
   * Provides a listener that supports basic TCP connections.
   */
  static tcp(containerPort: number): IServiceListener {
    return new ServiceListenerImpl({
      containerPort,
      protocol: ecs.Protocol.TCP,
      virtualNodeListener: appmesh.VirtualNodeListener.tcp({
        port: containerPort,
      }),
    });
  }

  /**
   * Maps a TCP port without producing a virtual node listener.
   */
  static tcpPortMapping(containerPort: number): IServiceListener {
    return new ServiceListenerImpl({
      containerPort: containerPort,
      protocol: ecs.Protocol.TCP,
    });
  };

  /**
   * Maps a UDP port without producing a virtual node listener.
   */
  static udpPortMapping(containerPort: number): IServiceListener {
    return new ServiceListenerImpl({
      containerPort: containerPort,
      protocol: ecs.Protocol.UDP,
    });
  };

  /**
   * Creates an HTTP listener that is made available through a reverse proxy
   * that first requires OIDC authentication.
   */
  static oidcHttpProxy(options: OidcHttpProxyExtensionOptions): IServiceListener {
    return new OidcHttpProxyServiceListener(options);
  }

  /** @internal */
  public abstract _bind(scope: cdk.Construct, service: IServiceExtensionApi): ServiceListenerConfig;
}

class ServiceListenerImpl extends ServiceListener {
  constructor(private readonly serviceListenerConfig: ServiceListenerConfig) {
    super();
  }

  _bind = () => this.serviceListenerConfig;
}

class OidcHttpProxyServiceListener extends ServiceListener {
  constructor(private readonly options: OidcHttpProxyExtensionOptions) {
    super();
  }

  _bind(_scope: cdk.Construct, service: IServiceExtensionApi): ServiceListenerConfig {
    service._addServiceExtension(new OidcHttpProxyExtension(this.options));

    return {
      containerPort: this.options.containerPort,
      protocol: ecs.Protocol.TCP,
    };
  }
}