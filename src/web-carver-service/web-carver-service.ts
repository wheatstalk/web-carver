import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { defaultCapacityProviderStrategy, defaultServiceNetworkConfig } from '../config';
import { AddAppMeshEnvoyExtension } from '../util';
import { IWebCarverEnvironment } from '../web-carver-environment';
import { IWebCarverListener } from './web-carver-listener';
import { IWebCarverServiceExtension } from './web-carver-service-extension';

export interface IWebCarverService extends ec2.IConnectable {
}

export interface WebCarverServiceProps {
  /**
   * The Web Carver environment in which to create the service.
   */
  readonly environment: IWebCarverEnvironment;

  /**
   * Suffix the service name with a host name. The resulting service name
   * will be a FQDN to work around the resolvability issue from
   * https://github.com/aws/aws-app-mesh-roadmap/issues/65
   */
  readonly hostName?: string;

  /**
   * Add extensions to your service to add features.
   */
  readonly extensions?: IWebCarverServiceExtension[];

  /**
   * The image of the main container.
   */
  readonly image: ecs.ContainerImage;

  /**
   * Description of the main traffic port of the main container.
   */
  readonly listeners?: IWebCarverListener[];

  /**
   * Use a router to provide connectivity to the service.
   * @default false
   */
  readonly useRouter?: boolean;
}

export class WebCarverService extends cdk.Construct implements IWebCarverService {
  public readonly environment: IWebCarverEnvironment;
  public readonly virtualNode: appmesh.VirtualNode;
  public readonly virtualService: appmesh.VirtualService;
  private readonly fargateService: ecs.FargateService;
  public readonly connections: ec2.Connections;

  private readonly envVars: Record<string, string> = {};

  constructor(scope: cdk.Construct, id: string, props: WebCarverServiceProps) {
    super(scope, id);

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
    const listenerInfos = (props.listeners ?? []).map(l => l.bind(this));

    for (const listenerInfo of listenerInfos) {
      mainContainer.addPortMappings({ containerPort: listenerInfo.containerPort });
    }

    function getMaxHealthyPercent() {
      // Note: For desired count of 2 or 3 use 150, otherwise 125
      return 150;
    }

    const physicalName = props.hostName ?? cdk.Names.uniqueId(this);

    const serviceName = cdk.Fn.join('-', [
      physicalName,
      props.environment.namespace.namespaceName,
      cdk.Names.nodeUniqueId(this.node),
    ]);

    // Get configuration for networking.
    const serviceNetworkConfig = defaultServiceNetworkConfig(this.node);

    this.fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: serviceName,
      circuitBreaker: { rollback: true },
      cloudMapOptions: {
        cloudMapNamespace: props.environment.namespace,
        dnsRecordType: servicediscovery.DnsRecordType.A,
        name: props.hostName,
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

    const virtualNode1 = this.virtualNode;
    taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        containerName: 'Envoy',
        endpointArn: virtualNode1.virtualNodeArn,
        patchProxyConfiguration: true,
      }));

    // Until AppMesh supports hostnames, make sure that the virtual service
    // name is a FQDN. https://github.com/aws/aws-app-mesh-roadmap/issues/65
    const virtualServiceName = cdk.Fn.join('.', [
      physicalName,
      props.environment.namespace.namespaceName,
    ]);

    const useRouter = props.useRouter;

    if (useRouter) {
      const virtualRouter = new appmesh.VirtualRouter(this, 'VirtualRouter', {
        mesh: props.environment.mesh,
        listeners: virtualNodeListeners,
      });

      virtualRouter.addRoute('h2', {
        routeSpec: appmesh.RouteSpec.http2({
          weightedTargets: [{ virtualNode: virtualNode1 }],
        }),
      });

      virtualRouter.addRoute('http', {
        routeSpec: appmesh.RouteSpec.http({
          weightedTargets: [{ virtualNode: virtualNode1 }],
        }),
      });

      this.virtualService = new appmesh.VirtualService(this, 'VirtualService', {
        virtualServiceName: virtualServiceName,
        virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(virtualRouter),
      });
    } else {
      this.virtualService = new appmesh.VirtualService(this, 'VirtualService', {
        virtualServiceName: virtualServiceName,
        virtualServiceProvider: appmesh.VirtualServiceProvider.virtualNode(virtualNode1),
      });
    }

    (props.extensions ?? []).forEach((extension, index) => {
      const privateScope = new cdk.Construct(this, `Extension${index}`);
      extension.extend(privateScope, this);
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
