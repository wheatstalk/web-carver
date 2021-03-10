import * as cloudmap from '@aws-cdk/aws-servicediscovery';

export interface EnvironmentManifestV1 {
  readonly version: '1.0.0';

  /**
   * The name of the exported output that a manifest user should import to
   * prevent the origin stack from being deleted
   */
  readonly crossStackDependencyExportName?: string;

  /**
   * The environment's VPC ID
   */
  readonly vpcId: string;

  /**
   * The environment's App Mesh arn
   */
  readonly meshArn: string;

  /**
   * The environment's service discovery namespace
   */
  readonly namespaceAttributes: EnvironmentManifestV1Namespace;

  /**
   * The environment's ecs cluster
   */
  readonly clusterAttributes: EnvironmentManifestV1Cluster;

  /**
   * The default gateway's info
   */
  readonly defaultGatewayAttributes: EnvironmentManifestV1Gateway;

  /**
   * The default router's info
   */
  readonly defaultRouterAttributes: EnvironmentManifestV1Router;
}

export interface EnvironmentManifestV1Namespace {
  readonly namespaceType: cloudmap.NamespaceType;
  readonly namespaceName: string;
  readonly namespaceId: string;
  readonly namespaceArn: string;
}

export interface EnvironmentManifestV1Cluster {
  readonly clusterName: string;
  readonly clusterArn?: string;
  readonly hasEc2Capacity?: boolean;
  readonly securityGroupIds: string[];
}

export interface EnvironmentManifestV1Gateway {
  readonly virtualGatewayArn: string;
  readonly securityGroupIds: string[];
}

export interface EnvironmentManifestV1Router {
  readonly virtualRouterArn: string;
  readonly virtualServiceArn: string;
  readonly securityGroupIds: string[];
}
