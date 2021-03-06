import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { IServiceListener } from '../service-listener';
import { IServiceExtension, IServiceExtensionApi } from './api';

/**
 * Container extension options
 */
export interface ContainerExtensionOptions {
  /**
   * Name of the container. Must be unique within the service.
   *
   * @default 'Main'
   */
  readonly name?: string;
  readonly image: ecs.ContainerImage;
  readonly environment?: Record<string, string>;
  readonly secrets?: Record<string, ecs.Secret>;
  readonly listeners?: IServiceListener[];
}

/** @internal */
export class ContainerExtension implements IServiceExtension {
  private readonly name: string;
  private readonly image: ecs.ContainerImage;
  private readonly environment: Record<string, string>;
  private readonly secrets: Record<string, ecs.Secret>;
  private readonly memoryLimitMiB: number;
  private readonly serviceListeners: IServiceListener[];

  public readonly _extensionTypeName = 'ContainerExtension';

  constructor(options: ContainerExtensionOptions) {
    this.name = options.name ?? 'Main';
    this.image = options.image;
    this.environment = options.environment ?? {};
    this.secrets = options.secrets ?? {};
    this.memoryLimitMiB = 512;
    this.serviceListeners = options.listeners ?? [];
  }

  _register(service: IServiceExtensionApi, privateScope: cdk.Construct) {
    const serviceListenerInfos = this.serviceListeners.map(l => l._bind(privateScope, service));

    service._onWorkloadReady(workloadOptions => {
      const { taskDefinition, virtualNode } = workloadOptions;

      const container = taskDefinition.addContainer(this.name, {
        image: this.image,
        environment: this.environment,
        secrets: this.secrets,
        memoryLimitMiB: this.memoryLimitMiB,
        essential: true,
        portMappings: serviceListenerInfos,
      });
      service._publishContainerDefinition(container);

      for (const serviceListenerInfo of serviceListenerInfos) {
        if (serviceListenerInfo.virtualNodeListener) {
          virtualNode.addListener(serviceListenerInfo.virtualNodeListener);
        }
      }
    });

    service._onEnvVars((envVars) => {
      Object.assign(this.environment, envVars);
    });
  }
}