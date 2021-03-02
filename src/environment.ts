import * as appmesh from '@aws-cdk/aws-appmesh';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { ApplicationLoadBalancedFargateGateway, IGateway } from './gateway';
import { PreferencesContext } from './preferences';
import { IRouter, Router } from './router';

/**
 * A WebCarver environment.
 */
export interface IEnvironment {
  /**
   * The environment's service mesh.
   */
  readonly mesh: appmesh.IMesh;

  /**
   * The default ECS cluster.
   */
  readonly cluster: ecs.ICluster;

  /**
   * The default VPC.
   */
  readonly vpc: ec2.IVpc;

  /**
   * The default service discovery namespace.
   */
  readonly namespace: servicediscovery.INamespace;

  /**
   * The default gateway.
   */
  readonly defaultGateway: IGateway;

  /**
   * The default router connected to the default gateway.
   */
  readonly defaultRouter: IRouter;
}

/**
 * Props for `Environment`
 */
export interface EnvironmentProps {
  /**
   * Provide a service discovery namespace
   * @default - we create one for you
   */
  readonly namespace?: servicediscovery.IPrivateDnsNamespace | servicediscovery.IPublicDnsNamespace;

  /**
   * Certificates to install on the gateway load balancer.
   * @default - load balancer is http-only
   */
  readonly certificates?: acm.ICertificate[];

  /**
   * Provide a VPC
   * @default - we create one for you
   */
  readonly vpc?: ec2.IVpc;

  /**
   * Provide an App Mesh
   * @default - we create one for you
   */
  readonly mesh?: appmesh.IMesh;
}

/**
 * Creates a WebCarver environment.
 */
export class Environment extends cdk.Construct implements IEnvironment {
  public readonly mesh: appmesh.IMesh;
  public readonly cluster: ecs.ICluster;
  public readonly vpc: ec2.IVpc;
  public readonly namespace: servicediscovery.INamespace;
  public readonly defaultGateway: IGateway;
  public readonly defaultRouter: IRouter;

  constructor(scope: cdk.Construct, id: string, props: EnvironmentProps = {}) {
    super(scope, id);

    // Use the user's mesh or provide our own.
    this.mesh = props.mesh ?? defaultMesh(this);

    // Use the user's vpc or provide our own.
    this.vpc = props.vpc ?? defaultVpc(this);

    // Provide our own cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      // Use the user's vpc or provide our own.
      vpc: this.vpc,
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
    });

    // Take the user's namespace or provide our own.
    this.namespace = props.namespace ?? defaultNamespace(scope, this.vpc);

    if (props.namespace?.type === servicediscovery.NamespaceType.DNS_PRIVATE && !props.vpc) {
      throw new Error('Please provide a vpc when providing a Private DNS Service Discovery namespace');
    }

    if (!isSupportedNamespaceType(this.namespace.type)) {
      throw new Error('The provided namespace type is not supported. We only support Public and Private DNS service discovery.');
    }

    this.defaultGateway = new ApplicationLoadBalancedFargateGateway(this, 'Gateway', {
      cluster: this.cluster,
      mesh: this.mesh,
      namespace: this.namespace,
      certificates: props.certificates ?? [],
    });

    this.defaultRouter = new Router(this, 'Router', {
      mesh: this.mesh,
      vpc: this.vpc,
    });

    // Register the default router as the default gateway route. This way,
    // the user can opt to register their services on the router or directly
    // on the gateway.
    this.defaultGateway.addGatewayRoute('Router', {
      routeSpec: appmesh.GatewayRouteSpec.http2({
        routeTarget: this.defaultRouter.virtualService,
      }),
    });

    // Connections from the router are literally connections from the gateway,
    // so the gateway's security group must be added to the router's
    // connections.
    this.defaultRouter.connections.addSecurityGroup(...this.defaultGateway.connections.securityGroups);
  }
}

function defaultMesh(scope: cdk.Construct) {
  return new appmesh.Mesh(scope, 'Mesh', {
    egressFilter: appmesh.MeshFilterType.ALLOW_ALL,
  });
}

/**
 * Creates a default VPC. When the user has specified a global preference to
 * use public service networking, we create a single public VPC. Otherwise,
 * we create
 */
function defaultVpc(scope: cdk.Construct) {
  const scopeId = 'Vpc';

  if (PreferencesContext.usePublicServiceNetworking(scope.node)) {
    return new ec2.Vpc(scope, scopeId, {
      subnetConfiguration: [
        {
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 22,
        },
      ],
    });
  } else {
    return new ec2.Vpc(scope, scopeId, {
      subnetConfiguration: [
        {
          name: 'gateway',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'services',
          subnetType: ec2.SubnetType.PRIVATE,
          cidrMask: 22,
        },
      ],
    });
  }
}

/**
 * Creates a default service discovery namespace from the name of the stack.
 */
function defaultNamespace(scope: cdk.Construct, vpc: ec2.IVpc) {
  return new servicediscovery.PrivateDnsNamespace(scope, 'Namespace', {
    vpc: vpc,
    name: cdk.Stack.of(scope).stackName.toLowerCase(),
  });
}

function isSupportedNamespaceType(type: servicediscovery.NamespaceType) {
  switch (type) {
    case servicediscovery.NamespaceType.DNS_PRIVATE:
    case servicediscovery.NamespaceType.DNS_PUBLIC:
      return true;

    default:
      return false;
  }
}
