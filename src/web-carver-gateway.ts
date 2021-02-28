import * as appmesh from '@aws-cdk/aws-appmesh';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { defaultCapacityProviderStrategy, defaultServiceNetworkConfig } from './config';
import { FargateVirtualGateway } from './util';

export interface IWebCarverGateway extends ec2.IConnectable {
  readonly virtualGateway: appmesh.IVirtualGateway;
}

export interface ApplicationLoadBalancedWebCarverGatewayProps {
  readonly cluster: ecs.ICluster;
  readonly mesh: appmesh.IMesh;
  readonly namespace: servicediscovery.INamespace;
  readonly certificates: acm.ICertificate[];
}

export class ApplicationLoadBalancedWebCarverGateway extends cdk.Construct implements IWebCarverGateway {
  public readonly virtualGateway: appmesh.IVirtualGateway;
  public readonly connections: ec2.Connections;

  constructor(scope: cdk.Construct, id: string, props: ApplicationLoadBalancedWebCarverGatewayProps) {
    super(scope, id);

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: props.cluster.vpc,
      internetFacing: true,
    });

    const serviceNetworkConfig = defaultServiceNetworkConfig(this.node);
    const fargateVirtualGateway = new FargateVirtualGateway(this, 'Fargate', {
      mesh: props.mesh,
      cluster: props.cluster,
      cloudMapOptions: {
        cloudMapNamespace: props.namespace,
      },
      healthCheckGracePeriod: cdk.Duration.minutes(30),

      // Reasonable defaults from context for the following:
      vpcSubnets: serviceNetworkConfig.vpcSubnets,
      assignPublicIp: serviceNetworkConfig.assignPublicIp,
      capacityProviderStrategies: defaultCapacityProviderStrategy(this.node),
    });

    this.virtualGateway = fargateVirtualGateway.virtualGateway;
    this.connections = fargateVirtualGateway.service.connections;

    const listener = createListener(this, {
      certificates: props.certificates ?? [],
      loadBalancer,
    });

    listener.addTargets('Default', {
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        fargateVirtualGateway.service.loadBalancerTarget({
          containerName: fargateVirtualGateway.service.taskDefinition.defaultContainer!.containerName,
          containerPort: fargateVirtualGateway.service.taskDefinition.defaultContainer!.containerPort,
        }),
      ],
      deregistrationDelay: cdk.Duration.seconds(10),
      healthCheck: {
        healthyHttpCodes: '200,404',
      },
    });
  }
}

interface CreateListenerOptions {
  readonly certificates: acm.ICertificate[];
  readonly loadBalancer: elbv2.ApplicationLoadBalancer;
}

function createListener(scope: cdk.Construct, options: CreateListenerOptions) {
  const { certificates, loadBalancer } = options;

  if (certificates.length > 0) {
    new cdk.CfnOutput(scope, 'LoadBalancerUrl', {
      value: cdk.Fn.sub('https://${DnsName}/', {
        DnsName: loadBalancer.loadBalancerDnsName,
      }),
    });

    // Upgrade all HTTP traffic to HTTPS
    loadBalancer.addListener('HTTP', {
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        protocol: 'HTTPS',
        port: '443',
      }),
    });

    return loadBalancer.addListener('HTTPS', {
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: certificates,
    });
  } else {
    new cdk.CfnOutput(scope, 'LoadBalancerUrl', {
      value: cdk.Fn.sub('http://${DnsName}/', {
        DnsName: loadBalancer.loadBalancerDnsName,
      }),
    });

    return loadBalancer.addListener('HTTP', {
      protocol: elbv2.ApplicationProtocol.HTTP,
    });
  }
}
