import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

const WEB_CARVER_CONTEXT = 'wheatstalk:web-carver:priorities';

export interface WebCarverContextOptions {
  /**
   * Use cheap networking. When enabled, we don't spin up any NAT gateways when
   * we create a VPC and tasks are assigned public IP addresses. By default,
   * the tasks will still have basic protection by way of security groups.
   *
   * @default false
   */
  readonly usePublicServiceNetworking?: boolean;

  /**
   * Use spot capacity for fargate tasks.
   *
   * @default false
   */
  readonly useFargateSpot?: boolean;
}

export abstract class WebCarverContext {
  static set(node: cdk.ConstructNode, context: WebCarverContextOptions) {
    node.setContext(WEB_CARVER_CONTEXT, context);
  }

  static get(node: cdk.ConstructNode): WebCarverContextOptions {
    return node.tryGetContext(WEB_CARVER_CONTEXT) ?? {
      usePublicServiceNetworking: false,
      useFargateSpot: false,
    };
  }

  static usePublicServiceNetworking(node: cdk.ConstructNode): boolean {
    return WebCarverContext.get(node).usePublicServiceNetworking ?? false;
  }

  static useFargateSpot(node: cdk.ConstructNode): boolean {
    return WebCarverContext.get(node).useFargateSpot ?? false;
  }
}

export function defaultServiceNetworkConfig(node: cdk.ConstructNode): ServiceNetworkConfig {
  if (WebCarverContext.usePublicServiceNetworking(node)) {
    return {
      assignPublicIp: true,
    };
  } else {
    return {};
  }
}

export interface ServiceNetworkConfig {
  readonly vpcSubnets?: ec2.SubnetSelection;
  readonly assignPublicIp?: boolean;
}

/**
 * Get the default capacity provider strategy. If context opted for
 * `useFargateSpot`, then we prefer fargate spot over regular fargate capacity.
 * @internal
 */
export function defaultCapacityProviderStrategy(node: cdk.ConstructNode) {
  if (WebCarverContext.useFargateSpot(node)) {
    return [
      {
        capacityProvider: 'FARGATE_SPOT',
        weight: 1000,
      },
      {
        capacityProvider: 'FARGATE',
        weight: 1,
      },
    ];
  } else {
    return [
      {
        capacityProvider: 'FARGATE',
        weight: 1,
      },
    ];
  }
}
