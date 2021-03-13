import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { IEnvironment } from '../environment';
import { IGateway } from '../gateway';
import { defaultCapacityProviderStrategy, defaultServiceNetworkConfig } from '../preferences';
import { IRouter } from '../router';
import { AddAppMeshEnvoyExtension } from '../util-private';
import { FilterChain } from '../util-private/filter-chain';
import { PubSub } from '../util-private/pub-sub';
import { IServiceExtension } from './service-extension/api';
import { IServiceName, ServiceName } from './service-name';

/**
 * A WebCarver service.
 */
export interface IService extends ec2.IConnectable {
  /**
   * The virtual service representation of the WebCarver service.
   */
  readonly virtualService: appmesh.IVirtualService;
}

/**
 * Props for `Service`
 */
export interface ServiceProps {
  /**
   * The Web Carver environment in which to create the service.
   */
  readonly environment: IEnvironment;

  /**
   * Choose a service name.
   * @default - a name is chosen for you
   */
  readonly name?: IServiceName;

  /**
   * Add extensions to your service to add features.
   */
  readonly extensions?: IServiceExtension[];
}

/** @internal */
export interface WorkloadOptions {
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly service: ecs.FargateService;
  readonly virtualNode: appmesh.VirtualNode;
  readonly virtualService: appmesh.IVirtualService;
}

/**
 * Creates a WebCarver service.
 */
export class Service extends cdk.Construct implements IService {
  public readonly environment: IEnvironment;
  public readonly taskDefinition: ecs.FargateTaskDefinition;
  public get virtualService(): appmesh.IVirtualService { return this._virtualService; }
  public readonly virtualNode: appmesh.VirtualNode;
  public readonly connections: ec2.Connections;

  private readonly _virtualService: appmesh.VirtualService;
  private readonly fargateService: ecs.FargateService;

  /**
   * Filter the Fargate Task Definition props.
   * @internal
   */
  public readonly _filterTaskDefinitionProps = new FilterChain<ecs.FargateTaskDefinitionProps>();

  /**
   * Filter the Fargate Service construct props.
   * @internal
   */
  public readonly _filterServiceProps = new FilterChain<ecs.FargateServiceProps>();

  private readonly serviceFacade: ServiceFacade;

  constructor(scope: cdk.Construct, id: string, props: ServiceProps) {
    super(scope, id);

    this.environment = props.environment;

    this.serviceFacade = new ServiceFacade({
      environment: props.environment,
      defaultGateway: props.environment.defaultGateway,
      defaultRouter: props.environment.defaultRouter,
    });

    // Use the user-provided name or create a host name for them.
    const name = props.name ?? ServiceName.hostName(cdk.Names.uniqueId(this));
    const nameContext = {
      namespace: props.environment.namespace,
    };

    const privateScopeIndecies: Record<string, number> = {};

    for (const extension of props.extensions ?? []) {
      const extensionTypeName: string = extension._extensionTypeName;
      const privateScopeIndex = privateScopeIndecies[extensionTypeName] = (privateScopeIndecies[extensionTypeName] ?? -1) + 1;

      const privateScope = new cdk.Construct(this, `Extension${extensionTypeName}${privateScopeIndex}`);
      extension._register(this.serviceFacade, privateScope);
    }

    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', this._filterTaskDefinitionProps.filter({
      cpu: 256,
      memoryLimitMiB: 512,
    }));

    // Get the default networking configuration for this node.
    const serviceNetworkConfig = defaultServiceNetworkConfig(this.node);

    this.fargateService = new ecs.FargateService(this, 'FargateService', this._filterServiceProps.filter({
      serviceName: name._serviceName(this, nameContext),
      taskDefinition: this.taskDefinition,

      // Register with CloudMap
      cloudMapOptions: {
        cloudMapNamespace: props.environment.namespace,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        dnsTtl: cdk.Duration.seconds(10),
        name: name._cloudMapServiceName(this, nameContext),
      },

      // Cluster configs
      cluster: props.environment.cluster,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      capacityProviderStrategies: defaultCapacityProviderStrategy(this.node),

      // Networking configuration
      assignPublicIp: serviceNetworkConfig.assignPublicIp,
      vpcSubnets: serviceNetworkConfig.vpcSubnets,
    }));

    this.virtualNode = new appmesh.VirtualNode(this, 'VirtualNode', {
      virtualNodeName: name._virtualNodeName(this, nameContext),
      serviceDiscovery: appmesh.ServiceDiscovery.cloudMap({
        service: this.fargateService.cloudMapService!,
      }),
      mesh: props.environment.mesh,
    });

    this._virtualService = new appmesh.VirtualService(this, 'VirtualService', {
      virtualServiceName: name._virtualServiceName(this, nameContext),
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualNode(this.virtualNode),
    });

    this.serviceFacade.workloadReadyEvent.publish({
      service: this.fargateService,
      taskDefinition: this.taskDefinition,
      virtualNode: this.virtualNode,
      virtualService: this.virtualService,
    });

    this.taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        containerName: 'Envoy',
        endpointArn: this.virtualNode.virtualNodeArn,
        patchProxyConfiguration: true,
      }));

    this.connections = new ec2.Connections({
      defaultPort: findDefaultSecurityGroupPort(this.taskDefinition),
      securityGroups: this.fargateService.connections.securityGroups,
    });

    this.serviceFacade.connectionsReadyEvent.publish(this.connections);
  }
}

/**
 * Finds the default port of the container as you'd specify for a security group.
 */
function findDefaultSecurityGroupPort(taskDefinition: ecs.TaskDefinition) {
  if (taskDefinition.defaultContainer!.portMappings.length > 0) {
    const defaultPortMapping = taskDefinition.defaultContainer!.portMappings[0];
    return defaultPortMapping.protocol === ecs.Protocol.UDP
      ? ec2.Port.udp(defaultPortMapping.containerPort)
      : ec2.Port.tcp(defaultPortMapping.containerPort);
  } else {
    return ec2.Port.allTraffic();
  }
}

/**
 * @internal
 */
export interface IServiceExtensionFacade {
  readonly environment: IEnvironment;
  readonly defaultRouter: IRouter;
  readonly defaultGateway: IGateway;

  _addEnvVars(env: Record<string, string>): void;
  _onEnvVars(handler: (env: Record<string, string>) => void): void;
  _onWorkloadReady(handler: (x: WorkloadOptions) => void): void;
  _onConnectionsReady(handler: (x: ec2.Connections) => void): void;
  _onContainerDefinitionPublished(handler: (x: ecs.ContainerDefinition) => void): void;
  _publishContainerDefinition(container: ecs.ContainerDefinition): void;
}

interface ServiceEventsOptions {
  readonly environment: IEnvironment;
  readonly defaultRouter: IRouter;
  readonly defaultGateway: IGateway;
}

class ServiceFacade implements IServiceExtensionFacade {
  public readonly environment: IEnvironment;
  public readonly defaultRouter: IRouter;
  public readonly defaultGateway: IGateway;

  public readonly workloadReadyEvent = PubSub.replayingPubSub<WorkloadOptions>();
  public readonly connectionsReadyEvent = PubSub.replayingPubSub<ec2.Connections>();
  public readonly envVarsAddedEvent = PubSub.replayingPubSub<Record<string, string>>();
  public readonly containerDefinitionPublishedEvent = PubSub.replayingPubSub<ecs.ContainerDefinition>();

  constructor(options: ServiceEventsOptions) {
    this.environment = options.environment;
    this.defaultRouter = options.defaultRouter;
    this.defaultGateway = options.defaultGateway;
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
