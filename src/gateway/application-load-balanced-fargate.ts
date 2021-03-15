import * as appmesh from '@aws-cdk/aws-appmesh';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as servicediscovery from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';
import { defaultCapacityProviderStrategy, defaultServiceNetworkConfig } from '../preferences';
import { FargateVirtualGatewayService } from '../util-private';
import { IGateway } from './api';

/**
 * Props for `ApplicationLoadBalancedFargateGateway`
 */
export interface ApplicationLoadBalancedFargateGatewayProps {
  readonly cluster: ecs.ICluster;
  readonly mesh: appmesh.IMesh;
  readonly namespace: servicediscovery.INamespace;
  readonly certificates: acm.ICertificate[];
  readonly securityGroups?: ec2.ISecurityGroup[];
}

/**
 * Creates a gateway with an Application Load Balancer and Fargate service.
 */
export class ApplicationLoadBalancedFargateGateway extends appmesh.VirtualGateway implements IGateway {
  public readonly connections: ec2.Connections;

  constructor(scope: cdk.Construct, id: string, props: ApplicationLoadBalancedFargateGatewayProps) {
    // 8080 is the default, but we're going to be explicit to be more robust.
    const virtualGatewayPort = 8080;

    super(scope, id, {
      mesh: props.mesh,
      listeners: [appmesh.VirtualGatewayListener.http2({ port: virtualGatewayPort })],
    });

    const serviceNetworkConfig = defaultServiceNetworkConfig(this.node);

    const serviceSecurityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.cluster.vpc,
    });

    const { service } = new FargateVirtualGatewayService(this, 'Fargate', {
      // Mesh props
      virtualGateway: this,
      virtualGatewayPort: virtualGatewayPort,

      // Capacity props
      cluster: props.cluster,
      cloudMapOptions: { cloudMapNamespace: props.namespace },
      healthCheckGracePeriod: cdk.Duration.minutes(30),
      capacityProviderStrategies: defaultCapacityProviderStrategy(this.node),

      // Networking configuration
      vpcSubnets: serviceNetworkConfig.vpcSubnets,
      assignPublicIp: serviceNetworkConfig.assignPublicIp,
      securityGroups: [serviceSecurityGroup, ...props.securityGroups ?? []],
    });

    this.connections = new ec2.Connections({
      securityGroups: [serviceSecurityGroup],
    });

    const loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'LoadBalancer', {
      vpc: props.cluster.vpc,
      internetFacing: true,
    });

    const listener = createListener(this, {
      certificates: props.certificates ?? [],
      loadBalancer,
    });

    listener.addTargets('Default', {
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [
        service.loadBalancerTarget({
          containerName: service.taskDefinition.defaultContainer!.containerName,
          containerPort: service.taskDefinition.defaultContainer!.containerPort,
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
