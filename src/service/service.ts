import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { IEnvironment } from '../environment';
import { defaultCapacityProviderStrategy, defaultServiceNetworkConfig } from '../preferences';
import { AddAppMeshEnvoyExtension } from '../util-private';
import { Filter, PubSub } from './events';
import { IServiceExtension } from './service-extension/api';
import { IServiceListener, ServiceListenerConfig } from './service-listener';

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
   * Suffix the service name with a host name. The resulting service name
   * will be a FQDN to work around the resolvability issue from
   * https://github.com/aws/aws-app-mesh-roadmap/issues/65
   */
  readonly hostName?: string;

  /**
   * Choose a service name.
   * @default - one is chosen for you
   */
  readonly name?: IServiceName;

  /**
   * Add extensions to your service to add features.
   */
  readonly extensions?: IServiceExtension[];

  /**
   * Description of the main traffic port of the main container.
   */
  readonly listeners?: IServiceListener[];
}

/** @internal */
export interface WorkloadOptions {
  readonly taskDefinition: ecs.FargateTaskDefinition;
  readonly service: ecs.FargateService;
  readonly serviceListenerConfig: ServiceListenerConfig[];
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
  public readonly _filterTaskDefinitionProps = new Filter<ecs.FargateTaskDefinitionProps>();

  /**
   * Filter the Fargate Service construct props.
   * @internal
   */
  public readonly _filterServiceProps = new Filter<ecs.FargateServiceProps>();

  /**
   * The virtual node is available.
   * @internal
   */
  public readonly _virtualNodeEvent = new PubSub<appmesh.VirtualNode>(true);

  /**
   * The virtual service is available.
   * @internal
   */
  public readonly _virtualServiceEvent = new PubSub<appmesh.VirtualService>(true);

  /**
   * Workloads may add their containers to the task definition now.
   * @internal
   */
  public readonly _workloadReadyEvent = new PubSub<WorkloadOptions>(true);

  /**
   * Fires whenever a set of environment variables is added.
   * @internal
   */
  public readonly _workloadEnvVarsEvent = new PubSub<Record<string, string>>();

  /**
   * A container has been added to the service by extension.
   * @internal
   */
  public readonly _containerDefinitionEvent = new PubSub<ecs.ContainerDefinition>(false);

  constructor(scope: cdk.Construct, id: string, props: ServiceProps) {
    super(scope, id);

    this.environment = props.environment;

    // Use the user-provided name or create a host name for them.
    const name = props.name ?? ServiceName.hostName(cdk.Names.uniqueId(this));
    const nameContext = {
      namespace: props.environment.namespace,
    };

    const privateScopeIndecies: Record<string, number> = {};

    props.extensions?.forEach((extension) => {
      const extensionTypeName: string = extension._extensionTypeName;
      const privateScopeIndex = privateScopeIndecies[extensionTypeName] = (privateScopeIndecies[extensionTypeName] ?? -1) + 1;

      const privateScope = new cdk.Construct(this, `Extension${extensionTypeName}${privateScopeIndex}`);
      extension._register(this, privateScope);
    });

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
        name: name._cloudMapServiceName(this, nameContext),
      },

      // Cluster configs
      cluster: props.environment.cluster,
      circuitBreaker: { rollback: true },
      minHealthyPercent: 100,
      maxHealthyPercent: getMaxHealthyPercent(),
      capacityProviderStrategies: defaultCapacityProviderStrategy(this.node),

      // Networking configuration
      assignPublicIp: serviceNetworkConfig.assignPublicIp,
      vpcSubnets: serviceNetworkConfig.vpcSubnets,
    }));

    // Get listener info for all listeners
    const serviceListenerConfigs = (props.listeners ?? []).map(l => l._bind(this));

    // Publish the workload information
    this._workloadReadyEvent.publish(this, {
      service: this.fargateService,
      taskDefinition: this.taskDefinition,
      serviceListenerConfig: serviceListenerConfigs,
    });

    const virtualNodeListeners = serviceListenerConfigs
      .filter(listenerInfo => Boolean(listenerInfo.virtualNodeListener))
      .map(listenerInfo => listenerInfo.virtualNodeListener!);

    if (virtualNodeListeners.length > 1) {
      throw new Error('Not more than one virtual node listener can be registered in AppMesh');
    }

    this.connections = new ec2.Connections({
      defaultPort: findDefaultSecurityGroupPort(this.taskDefinition),
      securityGroups: this.fargateService.connections.securityGroups,
    });

    this.virtualNode = new appmesh.VirtualNode(this, 'VirtualNode', {
      serviceDiscovery: appmesh.ServiceDiscovery.cloudMap({
        service: this.fargateService.cloudMapService!,
      }),
      mesh: props.environment.mesh,
      listeners: virtualNodeListeners,
    });

    this._virtualNodeEvent.publish(this, this.virtualNode);

    this.taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        containerName: 'Envoy',
        endpointArn: this.virtualNode.virtualNodeArn,
        patchProxyConfiguration: true,
      }));

    const virtualServiceName = name._virtualServiceName(this, nameContext);

    this._virtualService = new appmesh.VirtualService(this, 'VirtualService', {
      virtualServiceName: virtualServiceName,
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualNode(this.virtualNode),
    });

    this._virtualServiceEvent.publish(this, this._virtualService);
  }

  public addEnvVars(env: Record<string, string>) {
    this._workloadEnvVarsEvent.publish(this, env);
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
 * How to name the service.
 */
export interface IServiceName {
  /**
   * @internal
   */
  _serviceName(scope: cdk.Construct, context: ServiceNameContext): string;

  /**
   * @internal
   */
  _virtualServiceName(scope: cdk.Construct, context: ServiceNameContext): string;

  /**
   * @internal
   */
  _cloudMapServiceName(scope: cdk.Construct, context: ServiceNameContext): string;
}

interface ServiceNameContext {
  readonly namespace: servicediscovery.INamespace;
}

/**
 * Provides ways to name your services and associated resources.
 */
export abstract class ServiceName {
  /**
   * Provide a host name within the mesh.
   * @param hostName
   */
  static hostName(hostName: string): IServiceName {
    return {
      _serviceName: (scope, context) => cdk.Fn.join('-', [
        hostName,
        context.namespace.namespaceName,
        cdk.Names.nodeUniqueId(scope.node),
      ]),
      _virtualServiceName: (_scope, context) => cdk.Fn.join('.', [
        hostName,
        context.namespace.namespaceName,
      ]),
      _cloudMapServiceName: () => hostName,
    };
  }
}

function getMaxHealthyPercent() {
  // TODO: AWS recommends a desired count of 2 or 3 use 150, otherwise 125
  //   but when I tried this, services weren't updating. So I've set it to
  //   200. We probably need to treat `desiredCount === 1` differently.
  return 200;
}