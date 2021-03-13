import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import * as secrets from '@aws-cdk/aws-secretsmanager';
import * as cdk from '@aws-cdk/core';
import { IServiceExtensionFacade } from './service';

/**
 * A service listener.
 */
export interface IServiceListener {
  /**
   * @internal
   */
  _bind(scope: cdk.Construct, service: IServiceExtensionFacade): ServiceListenerConfig;
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
  static oidcHttpProxy(options: OidcHttpProxyServiceListenerOptions): IServiceListener {
    return new OidcHttpProxyServiceListener(options);
  }

  /** @internal */
  public abstract _bind(scope: cdk.Construct, service: IServiceExtensionFacade): ServiceListenerConfig;
}

class ServiceListenerImpl extends ServiceListener {
  constructor(private readonly serviceListenerConfig: ServiceListenerConfig) {
    super();
  }

  _bind = () => this.serviceListenerConfig;
}

/**
 * Options for an OIDC HTTP Proxy
 */
export interface OidcHttpProxyServiceListenerOptions {
  /**
   * The container image to use as a proxy.
   * @default - 'evry/oidc-proxy:v1.3.0'
   */
  readonly image?: ecs.ContainerImage;

  /**
   * The port to forward traffic to. Note: With the default proxy image, you
   * cannot use port 80 since the listener is baked-into the container. Pick
   * something else like 8080 or 3000 and make sure your container listens
   * on that port as well.
   */
  readonly containerPort: number;

  /**
   * The discovery endpoint.
   * @example 'https://YOUR_DOMAIN/.well-known/openid-configuration'.
   * @example 'https://cognito-idp.{region}.amazonaws.com/{userPoolId}/.well-known/openid-configuration'
   */
  readonly oidcDiscoveryEndpoint: string;

  /**
   * Plaintext credentials
   */
  readonly oidcPlainTextCredentials?: OidcHttpProxyServiceListenerOptionsPlainTextCredentials;

  /**
   * Credentials from an SSM Secret. The secret should be JSON that looks like:
   *
   * ```
   * {
   *   "clientId": "get-this-id-from-your-idp",
   *   "clientSecret": "get-this-secret-from-your-idp"
   * }
   * ```
   */
  readonly oidcSecretCredentials?: secrets.ISecret;
}

/**
 * Plaintext credentials
 */
export interface OidcHttpProxyServiceListenerOptionsPlainTextCredentials {
  /**
   * The OIDC client ID
   */
  readonly clientId: string;

  /**
   * The OIDC client secret
   */
  readonly clientSecret: string;
}

class OidcHttpProxyServiceListener extends ServiceListener {
  private readonly proxyPort = 80;
  private readonly proxyImage: ecs.ContainerImage;
  private readonly proxyEnvironment: Record<string, string> = {};
  private readonly proxySecrets: Record<string, ecs.Secret> = {};

  constructor(private readonly options: OidcHttpProxyServiceListenerOptions) {
    super();

    this.proxyImage = options.image ?? ecs.ContainerImage.fromRegistry('evry/oidc-proxy:v1.3.0');

    if (this.proxyPort === options.containerPort) {
      throw new Error(`Cannot add an OIDC proxy on port ${this.proxyPort} as it conflicts with the container port ${options.containerPort}. Please specify another proxy port.`);
    }

    Object.assign(this.proxyEnvironment, {
      PROXY_HOST: '127.0.0.1',
      PROXY_PORT: options.containerPort.toString(),
      PROXY_PROTOCOL: 'http',
      OID_DISCOVERY: options.oidcDiscoveryEndpoint,
      OIDC_AUTH_METHOD: 'client_secret_post',
      ADD_HOST_HEADER: 'true',
    });

    if (options.oidcPlainTextCredentials && options.oidcSecretCredentials) {
      throw new Error('Cannot add an OIDC proxy. Please provide only one type of credentials.');
    }

    if (options.oidcSecretCredentials) {
      Object.assign(this.proxySecrets, {
        OID_CLIENT_ID: ecs.Secret.fromSecretsManager(options.oidcSecretCredentials, 'clientId'),
        OID_CLIENT_SECRET: ecs.Secret.fromSecretsManager(options.oidcSecretCredentials, 'clientSecret'),
      });
    } else if (options.oidcPlainTextCredentials) {
      Object.assign(this.proxyEnvironment, {
        OID_CLIENT_ID: options.oidcPlainTextCredentials.clientId,
        OID_CLIENT_SECRET: options.oidcPlainTextCredentials.clientSecret,
      });
    } else {
      throw new Error('Cannot add an OIDC proxy. Please provide credentials.');
    }
  }

  _bind(_scope: cdk.Construct, service: IServiceExtensionFacade): ServiceListenerConfig {
    service._onWorkloadReady(workloadOptions => {
      // Add the proxy container as a sidecar.
      workloadOptions.taskDefinition.addContainer('OidcHttpProxy', {
        image: this.proxyImage,
        essential: true,
        portMappings: [{
          containerPort: this.proxyPort,
          protocol: ecs.Protocol.TCP,
        }],
        environment: {
          OID_SESSION_NAME: workloadOptions.virtualNode.virtualNodeName,
          ...this.proxyEnvironment,
        },
        secrets: this.proxySecrets,
        logging: ecs.LogDriver.awsLogs({ streamPrefix: 'Http2Proxy' }),
      });

      workloadOptions.virtualNode.addListener(
        appmesh.VirtualNodeListener.http({ port: this.proxyPort }),
      );
    });

    return {
      containerPort: this.options.containerPort,
      protocol: ecs.Protocol.TCP,
    };
  }
}