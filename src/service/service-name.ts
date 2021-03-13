import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';

/**
 * How to name the service.
 */
export interface IServiceName {
  /**
     * @internal
     */
  _serviceName(scope: cdk.Construct, context: ServiceNameContext): string|undefined;

  /**
     * @internal
     */
  _virtualNodeName(scope: cdk.Construct, context: ServiceNameContext): string;

  /**
     * @internal
     */
  _virtualServiceName(scope: cdk.Construct, context: ServiceNameContext): string;

  /**
     * @internal
     */
  _cloudMapServiceName(scope: cdk.Construct, context: ServiceNameContext): string;
}

/**
 * @internal
 */
export interface ServiceNameContext {
  readonly namespace: servicediscovery.INamespace;
}

/**
 * Provides ways to name your services and associated resources.
 */
export abstract class ServiceName implements IServiceName {
  /**
   * Provide a host name within the mesh.
   * @param hostName
   */
  static hostName(hostName: string): IServiceName {
    return new HostNameServiceName(hostName);
  }

  /** @internal */
  abstract _serviceName(scope: cdk.Construct, context: ServiceNameContext): string|undefined;
  /** @internal */
  abstract _virtualNodeName(scope: cdk.Construct, context: ServiceNameContext): string;
  /** @internal */
  abstract _virtualServiceName(scope: cdk.Construct, context: ServiceNameContext): string;
  /** @internal */
  abstract _cloudMapServiceName(scope: cdk.Construct, context: ServiceNameContext): string;
}

class HostNameServiceName extends ServiceName {
  constructor(private readonly hostName: string) {
    super();
  }

  _serviceName(_scope: cdk.Construct, _context: ServiceNameContext) {
    return undefined;
  }

  _virtualNodeName(_scope: cdk.Construct, context: ServiceNameContext) {
    return `${this.hostName}-${context.namespace.namespaceName}`;
  }

  _virtualServiceName(_scope: cdk.Construct, context: ServiceNameContext) {
    return `${this.hostName}.${context.namespace.namespaceName}`;
  }

  _cloudMapServiceName() {
    return this.hostName;
  }
}