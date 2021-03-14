import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import * as secrets from '@aws-cdk/aws-secretsmanager';
import * as cdk from '@aws-cdk/core';
import { IServiceExtensionApi, IServiceExtension } from '..';

/**
 * Options for an OIDC HTTP Proxy
 */
export interface OidcHttpProxyExtensionOptions {
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
  readonly oidcPlainTextCredentials?: OidcHttpExtensionPlainTextCredentials;

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
export interface OidcHttpExtensionPlainTextCredentials {
  /**
     * The OIDC client ID
     */
  readonly clientId: string;

  /**
     * The OIDC client secret
     */
  readonly clientSecret: string;
}

/** @internal */
export class OidcHttpProxyExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'OidcHttpProxyExtension';

  private readonly proxyPort = 80;
  private readonly proxyImage: ecs.ContainerImage;
  private readonly proxyEnvironment: Record<string, string> = {};
  private readonly proxySecrets: Record<string, ecs.Secret> = {};

  constructor(options: OidcHttpProxyExtensionOptions) {
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

  _register(service: IServiceExtensionApi, _privateScope: cdk.Construct): void {
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
  }
}