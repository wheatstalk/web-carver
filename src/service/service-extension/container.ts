import * as ecs from '@aws-cdk/aws-ecs';
import { Service } from '../service';
import { IServiceExtension } from './api';

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
  readonly secret?: Record<string, ecs.Secret>;
}

/** @internal */
export class Container implements IServiceExtension {
  private readonly name: string;
  private readonly image: ecs.ContainerImage;
  private readonly environment: Record<string, string>;
  private readonly secrets: Record<string, ecs.Secret>;
  private readonly memoryLimitMiB: number;

  public readonly _extensionTypeName = 'ContainerExtension';

  constructor(options: ContainerExtensionOptions) {
    this.name = options.name ?? 'Main';
    this.image = options.image;
    this.environment = options.environment ?? {};
    this.secrets = options.secret ?? {};
    this.memoryLimitMiB = 512;
  }

  _register(service: Service) {
    service._workloadReadyEvent.subscribe((scope, workloadOptions) => {
      const { taskDefinition } = workloadOptions;

      const container = taskDefinition.addContainer(this.name, {
        image: this.image,
        environment: this.environment,
        secrets: this.secrets,
        memoryLimitMiB: this.memoryLimitMiB,
        essential: true,
      });

      for (const listener of workloadOptions.serviceListenerConfig) {
        container.addPortMappings({
          containerPort: listener.containerPort,
          protocol: listener.protocol,
        });
      }

      service._containerDefinitionEvent.publish(scope, container);
    });

    service._workloadEnvVarsEvent.subscribe((_scope, envVars) => {
      Object.assign(this.environment, envVars);
    });
  }
}