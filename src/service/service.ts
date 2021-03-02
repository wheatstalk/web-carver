import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { IEnvironment } from '../environment';
import { defaultCapacityProviderStrategy, defaultServiceNetworkConfig } from '../preferences';
import { AddAppMeshEnvoyExtension } from '../util-private';
import { IServiceExtension } from './service-extension';
import { IServiceListener } from './service-listener';

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
   * The image of the main container.
   */
  readonly image: ecs.ContainerImage;

  /**
   * Description of the main traffic port of the main container.
   */
  readonly listeners?: IServiceListener[];

  /**
   * Use a router to provide connectivity to the service.
   * @default false
   */
  readonly useRouter?: boolean;
}

/**
 * Creates a WebCarver service.
 */
export class Service extends cdk.Construct implements IService {
  public readonly environment: IEnvironment;
  public get virtualService(): appmesh.IVirtualService { return this._virtualService; }
  public readonly virtualNode: appmesh.VirtualNode;
  public readonly connections: ec2.Connections;

  private readonly _virtualService: appmesh.VirtualService;
  private readonly fargateService: ecs.FargateService;
  private readonly envVars: Record<string, string> = {};

  constructor(scope: cdk.Construct, id: string, props: ServiceProps) {
    super(scope, id);

    // Use the user-provided name or create a host name for them.
    const name = props.name ?? ServiceName.hostName(cdk.Names.uniqueId(this));
    const nameContext = {
      namespace: props.environment.namespace,
    };

    this.environment = props.environment;

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDefinition', {
      cpu: 256,
      memoryLimitMiB: 512,
    });

    const mainContainer = taskDefinition.addContainer('Main', {
      image: props.image,
      essential: true,
      environment: this.envVars,
    });

    // Get listener info for all listeners
    const listenerInfos = (props.listeners ?? []).map(l => l._bind(this));

    for (const listenerInfo of listenerInfos) {
      mainContainer.addPortMappings({ containerPort: listenerInfo.containerPort });
    }

    function getMaxHealthyPercent() {
      // TODO: AWS recommends a desired count of 2 or 3 use 150, otherwise 125
      //   but when I tried this, services weren't updating. So I've set it to
      //   200. We probably need to treat `desiredCount === 1` differently.
      return 200;
    }

    // Get configuration for networking.
    const serviceNetworkConfig = defaultServiceNetworkConfig(this.node);

    this.fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: name._serviceName(this, nameContext),
      circuitBreaker: { rollback: true },
      cloudMapOptions: {
        cloudMapNamespace: props.environment.namespace,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        name: name._cloudMapServiceName(this, nameContext),
      },
      cluster: props.environment.cluster,
      minHealthyPercent: 100,
      maxHealthyPercent: getMaxHealthyPercent(),
      taskDefinition,
      // Get some defaults from context.
      assignPublicIp: serviceNetworkConfig.assignPublicIp,
      vpcSubnets: serviceNetworkConfig.vpcSubnets,
      capacityProviderStrategies: defaultCapacityProviderStrategy(this.node),
    });

    const virtualNodeListeners = listenerInfos
      .filter(listenerInfo => Boolean(listenerInfo.virtualNodeListener))
      .map(listenerInfo => listenerInfo.virtualNodeListener!);

    if (virtualNodeListeners.length > 1) {
      throw new Error('Not more than one virtual node listener can be registered in AppMesh');
    }

    this.connections = new ec2.Connections({
      defaultPort: findDefaultSecurityGroupPort(taskDefinition),
      securityGroups: this.fargateService.connections.securityGroups,
    });

    this.virtualNode = new appmesh.VirtualNode(this, 'VirtualNode', {
      serviceDiscovery: appmesh.ServiceDiscovery.cloudMap({
        service: this.fargateService.cloudMapService!,
      }),
      mesh: props.environment.mesh,
      listeners: virtualNodeListeners,
    });

    taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        containerName: 'Envoy',
        endpointArn: this.virtualNode.virtualNodeArn,
        patchProxyConfiguration: true,
      }));

    const virtualServiceName = name._virtualServiceName(this, nameContext);
    const useRouter = props.useRouter;

    if (useRouter) {
      const virtualRouter = new appmesh.VirtualRouter(this, 'VirtualRouter', {
        mesh: props.environment.mesh,
        listeners: virtualNodeListeners,
      });

      virtualRouter.addRoute('h2', {
        routeSpec: appmesh.RouteSpec.http2({
          weightedTargets: [{ virtualNode: this.virtualNode }],
        }),
      });

      virtualRouter.addRoute('http', {
        routeSpec: appmesh.RouteSpec.http({
          weightedTargets: [{ virtualNode: this.virtualNode }],
        }),
      });

      this._virtualService = new appmesh.VirtualService(this, 'VirtualService', {
        virtualServiceName: virtualServiceName,
        virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(virtualRouter),
      });
    } else {
      this._virtualService = new appmesh.VirtualService(this, 'VirtualService', {
        virtualServiceName: virtualServiceName,
        virtualServiceProvider: appmesh.VirtualServiceProvider.virtualNode(this.virtualNode),
      });
    }

    (props.extensions ?? []).forEach((extension, index) => {
      const privateScope = new cdk.Construct(this, `Extension${index}`);
      extension._extend(privateScope, this);
    });
  }

  public addEnvVars(env: Record<string, string>) {
    Object.assign(this.envVars, {
      ...this.envVars,
      ...env,
    });
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