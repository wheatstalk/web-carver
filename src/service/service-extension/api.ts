import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { IEnvironment } from '../../environment';
import { IGateway } from '../../gateway';
import { IRouter } from '../../router';
import { FilterChain } from '../../util-private/filter-chain';
import { PubSub } from '../../util-private/pub-sub';

/**
 * Extends the service with additional features.
 */
export interface IServiceExtension {
  /** @internal */
  readonly _extensionTypeName: string;

  /** @internal */
  _register(service: IServiceExtensionApi, privateScope: cdk.Construct): void;
}

/**
 * @internal
 */
export interface IServiceExtensionApi {
  readonly environment: IEnvironment;
  readonly defaultRouter: IRouter;
  readonly defaultGateway: IGateway;

  _addTaskDefinitionPropsFilter(filter: (props: ecs.FargateTaskDefinitionProps) => ecs.FargateTaskDefinitionProps): void;
  _addServicePropsFilter(filter: (props: ecs.FargateServiceProps) => ecs.FargateServiceProps): void;
  _addEnvVars(env: Record<string, string>): void;
  _onEnvVars(handler: (env: Record<string, string>) => void): void;
  _addServiceExtension(extension: IServiceExtension): void;
  _onServiceExtensionAdded(handler: (x: IServiceExtension) => void): void;
  _onWorkloadReady(handler: (x: WorkloadOptions) => void): void;
  _onConnectionsReady(handler: (x: ec2.Connections) => void): void;
  _onContainerDefinitionPublished(handler: (x: ecs.ContainerDefinition) => void): void;
  _publishContainerDefinition(container: ecs.ContainerDefinition): void;
}

/** @internal */
export interface WorkloadOptions {
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly service: ecs.FargateService;
  readonly virtualNode: appmesh.VirtualNode;
  readonly virtualService: appmesh.IVirtualService;
}

/** @internal */
export abstract class ServiceExtensionApiBase implements IServiceExtensionApi {
  public abstract readonly environment: IEnvironment;
  public abstract readonly defaultRouter: IRouter;
  public abstract readonly defaultGateway: IGateway;

  public readonly taskDefinitionPropsFilter = new FilterChain<ecs.FargateTaskDefinitionProps>();
  public readonly servicePropsFilter = new FilterChain<ecs.FargateServiceProps>();

  public readonly workloadReadyEvent = PubSub.replayingPubSub<WorkloadOptions>();
  public readonly connectionsReadyEvent = PubSub.replayingPubSub<ec2.Connections>();
  public readonly envVarsAddedEvent = PubSub.replayingPubSub<Record<string, string>>();
  public readonly containerDefinitionPublishedEvent = PubSub.replayingPubSub<ecs.ContainerDefinition>();
  public readonly serviceExtensionAddedEvent = PubSub.replayingPubSub<IServiceExtension>();

  public _addTaskDefinitionPropsFilter(filter: (props: ecs.FargateTaskDefinitionProps) => ecs.FargateTaskDefinitionProps): void {
    this.taskDefinitionPropsFilter.add(filter);
  }

  public _addServicePropsFilter(filter: (props: ecs.FargateServiceProps) => ecs.FargateServiceProps): void {
    this.servicePropsFilter.add(filter);
  }

  public _addServiceExtension(extension: IServiceExtension): void {
    this.serviceExtensionAddedEvent.publish(extension);
  }

  public _onServiceExtensionAdded(handler: (x: IServiceExtension) => void): void {
    this.serviceExtensionAddedEvent.subscribe(handler);
  }

  public _onContainerDefinitionPublished(handler: (x: ecs.ContainerDefinition) => void): void {
    this.containerDefinitionPublishedEvent.subscribe(handler);
  }

  public _publishContainerDefinition(container: ecs.ContainerDefinition) {
    this.containerDefinitionPublishedEvent.publish(container);
  }

  public _addEnvVars(env: Record<string, string>) {
    this.envVarsAddedEvent.publish(env);
  }

  public _onEnvVars(handler: (env: Record<string, string>) => void) {
    this.envVarsAddedEvent.subscribe(handler);
  }

  public _onWorkloadReady(handler: (x: WorkloadOptions) => void) {
    this.workloadReadyEvent.subscribe(handler);
  }

  public _onConnectionsReady(handler: (x: ec2.Connections) => void) {
    this.connectionsReadyEvent.subscribe(handler);
  }
}

/** @internal */
interface ServiceExtensionApiOptions {
  readonly environment: IEnvironment;
  readonly defaultRouter: IRouter;
  readonly defaultGateway: IGateway;
}

/** @internal */
export class ServiceExtensionApi extends ServiceExtensionApiBase {
  public readonly environment: IEnvironment;
  public readonly defaultRouter: IRouter;
  public readonly defaultGateway: IGateway;

  constructor(options: ServiceExtensionApiOptions) {
    super();

    this.environment = options.environment;
    this.defaultRouter = options.defaultRouter;
    this.defaultGateway = options.defaultGateway;
  }
}
