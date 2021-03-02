import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

const WEB_CARVER_CONTEXT = 'wheatstalk:web-carver:preferences';

/**
 * Global preferences.
 */
export interface Preferences {
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

/**
 * Get or set preferences by context.
 */
export abstract class PreferencesContext {
  /**
   * Set the preferences.
   */
  static set(node: cdk.ConstructNode, context: Preferences) {
    node.setContext(WEB_CARVER_CONTEXT, context);
  }

  /**
   * Get preferences
   */
  static get(node: cdk.ConstructNode): Preferences {
    return node.tryGetContext(WEB_CARVER_CONTEXT) ?? {
      usePublicServiceNetworking: false,
      useFargateSpot: false,
    };
  }

  /**
   * Get preference for using public service networking.
   */
  static usePublicServiceNetworking(node: cdk.ConstructNode): boolean {
    return PreferencesContext.get(node).usePublicServiceNetworking ?? false;
  }

  /**
   * Get preference for using Fargate spot.
   * @param node
   */
  static useFargateSpot(node: cdk.ConstructNode): boolean {
    return PreferencesContext.get(node).useFargateSpot ?? false;
  }
}

/**
 * @internal
 */
export function defaultServiceNetworkConfig(node: cdk.ConstructNode): ServiceNetworkConfig {
  if (PreferencesContext.usePublicServiceNetworking(node)) {
    return {
      assignPublicIp: true,
    };
  } else {
    return {};
  }
}

/**
 * @internal
 */
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
  if (PreferencesContext.useFargateSpot(node)) {
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