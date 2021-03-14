import * as cdk from '@aws-cdk/core';
import { IServiceExtensionApi, Service } from '../service';
import { IServiceExtension } from './api';

/**
 * Props for `LinkedServiceExtension`
 */
export interface LinkedServiceExtensionOptions {
  /**
   * Name of the linked service for environment variable choice. The injected
   * environment variable will be, `BACKEND_${name}` if specified. Otherwise,
   * the linked service will be injected as `BACKEND`.
   */
  readonly name?: string;

  /**
   * The Web Carver service to link to.
   */
  readonly service: Service;
}

/**
 * Links another mesh service to this service so that it can be connected to.
 * @internal
 */
export class LinkedServiceExtension implements IServiceExtension {
  private readonly linkedService: Service;
  private readonly name: string | undefined;

  public readonly _extensionTypeName = 'LinkedServiceExtension';

  constructor(props: LinkedServiceExtensionOptions) {
    this.linkedService = props.service;
    this.name = props.name;
  }

  _register(service: IServiceExtensionApi, _privateScope: cdk.Construct) {
    service._onWorkloadReady(workloadOptions => {
      const { virtualNode } = workloadOptions;

      virtualNode.addBackend(this.linkedService.virtualService);

      const envName = this.name ? `BACKEND_${this.name}` : 'BACKEND';
      service._addEnvVars({
        [envName]: this.linkedService.virtualService.virtualServiceName,
      });
    });

    service._onConnectionsReady(connections => {
      this.linkedService.connections.allowDefaultPortFrom(connections);
    });
  }
}