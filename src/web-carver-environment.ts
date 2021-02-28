import * as appmesh from '@aws-cdk/aws-appmesh';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { WebCarverContext } from './config';
import { ApplicationLoadBalancedWebCarverGateway, IWebCarverGateway } from './web-carver-gateway';

export interface IWebCarverEnvironment {
  readonly cluster: ecs.ICluster;
  readonly mesh: appmesh.IMesh;
  readonly namespace: servicediscovery.INamespace;
  readonly defaultGateway: IWebCarverGateway;
}

export interface WebCarverEnvironmentProps {
  readonly namespace?: servicediscovery.IPrivateDnsNamespace | servicediscovery.IPublicDnsNamespace;
  readonly cloudMapNamespace?: servicediscovery.INamespace;
  readonly certificates?: acm.ICertificate[];
  readonly vpc?: ec2.IVpc;
  readonly mesh?: appmesh.IMesh;
}

export class WebCarverEnvironment extends cdk.Construct implements IWebCarverEnvironment {
  public readonly mesh: appmesh.IMesh;
  public readonly cluster: ecs.ICluster;
  public readonly namespace: servicediscovery.INamespace;
  public readonly defaultGateway: IWebCarverGateway;

  constructor(scope: cdk.Construct, id: string, props: WebCarverEnvironmentProps = {}) {
    super(scope, id);

    if (props.namespace?.type === servicediscovery.NamespaceType.DNS_PRIVATE && !props.vpc) {
      throw new Error('Please provide a vpc when providing a Private DNS Service Discovery namespace');
    }

    // Use the user's mesh or provide our own.
    this.mesh = props.mesh ?? defaultMesh(this);

    // Provide our own cluster
    this.cluster = new ecs.Cluster(this, 'Cluster', {
      // Use the user's vpc or provide our own.
      vpc: props.vpc ?? defaultVpc(scope),
      capacityProviders: ['FARGATE', 'FARGATE_SPOT'],
    });

    // Take the user's namespace or provide our own.
    this.namespace = props.namespace ?? defaultNamespace(scope, this.cluster.vpc);

    if (!isSupportedNamespaceType(this.namespace.type)) {
      throw new Error('The provided namespace type is not supported. We only support Public and Private DNS service discovery.');
    }

    this.defaultGateway = new ApplicationLoadBalancedWebCarverGateway(this, 'Gateway', {
      cluster: this.cluster,
      mesh: this.mesh,
      namespace: this.namespace,
      certificates: props.certificates ?? [],
    });
  }
}

function defaultMesh(scope: cdk.Construct) {
  return new appmesh.Mesh(scope, 'Mesh', {
    egressFilter: appmesh.MeshFilterType.ALLOW_ALL,
  });
}

function defaultVpc(scope: cdk.Construct) {
  const scopeId = 'Vpc';

  if (WebCarverContext.usePublicServiceNetworking(scope.node)) {
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
