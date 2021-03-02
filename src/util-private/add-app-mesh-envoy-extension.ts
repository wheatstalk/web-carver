import * as ecs from '@aws-cdk/aws-ecs';
import * as iam from '@aws-cdk/aws-iam';
import * as cdk from '@aws-cdk/core';

export interface AddEnvoyCommonProps {
  /**
   * Name of the container to add.
   */
  readonly containerName?: string;

  /**
   * Container image to use.
   */
  readonly image?: ecs.ContainerImage;

  /**
   * Ports to map from the envoy container.
   */
  readonly containerPorts?: number[];

  /**
   * ID of the user envoy should run as.
   * @default 1337
   */
  readonly envoyUser?: number;

  /**
   * Patch the proxy configuration.
   * @default true
   */
  readonly patchProxyConfiguration?: boolean;
}

/**
 * Props for `AddEnvoyTaskDefinitionExtension`
 * @internal
 */
export interface AddEnvoyExtensionProps extends AddEnvoyCommonProps {
  /**
   * Provides endpoint information
   */
  readonly endpointArn: string;
}

/**
 * @internal
 */
export class AddAppMeshEnvoyExtension implements ecs.ITaskDefinitionExtension {
  private readonly image: ecs.ContainerImage;
  private readonly envoyContainerName: string;
  private readonly containerPorts: number[];
  private readonly proxyIgnoredGID: number;
  private readonly envoyUser: number;
  private readonly proxyEgressPort: number;
  private readonly proxyIngressPort: number;
  private readonly shouldPatchProxyConfiguration: boolean;
  private readonly endpointArn: string;

  constructor(props: AddEnvoyExtensionProps) {
    this.image = props.image ?? ecs.ContainerImage.fromRegistry('public.ecr.aws/appmesh/aws-appmesh-envoy:v1.16.1.0-prod');
    this.envoyContainerName = props.containerName ?? 'appmesh-envoy';
    this.endpointArn = props.endpointArn;
    this.proxyIngressPort = 15000;
    this.proxyEgressPort = 15001;
    this.envoyUser = props.envoyUser ?? 1337;
    this.proxyIgnoredGID = 1338;
    this.containerPorts = props.containerPorts ?? [];
    this.shouldPatchProxyConfiguration = props.patchProxyConfiguration ?? true;
  }

  /**
   * @inheritDoc
   */
  extend(taskDefinition: ecs.TaskDefinition): void {
    this.addEnvoyContainer(taskDefinition);

    if (this.shouldPatchProxyConfiguration) {
      this.patchProxyConfiguration(taskDefinition);
    }
  }

  private addEnvoyContainer(taskDefinition: ecs.TaskDefinition) {
    const envoy = taskDefinition.addContainer(this.envoyContainerName, {
      image: this.image,
      environment: {
        APPMESH_VIRTUAL_NODE_NAME: this.endpointArn,
        AWS_REGION: cdk.Stack.of(taskDefinition).region,
        ENABLE_ENVOY_STATS_TAGS: '1',
        ENABLE_ENVOY_DOG_STATSD: '1',
      },
      // Run envoy as the UID proxying ignores to prevent recursion
      user: this.envoyUser.toString(),
      logging: ecs.AwsLogDriver.awsLogs({ streamPrefix: 'envoy' }),
      healthCheck: {
        command: [
          'sh', '-c',
          'curl -s http://127.0.0.1:9901/ready | grep -q LIVE',
        ],
        startPeriod: cdk.Duration.seconds(10),
        interval: cdk.Duration.seconds(5),
        timeout: cdk.Duration.seconds(2),
      },
    });

    envoy.addUlimits({
      softLimit: 1024000,
      hardLimit: 1024000,
      name: ecs.UlimitName.NOFILE,
    });

    for (const containerPort of this.containerPorts) {
      envoy.addPortMappings({ containerPort: containerPort });
    }

    taskDefinition.addToTaskRolePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      resources: [this.endpointArn],
      actions: ['appmesh:StreamAggregatedResources'],
    }));
  }

  private patchProxyConfiguration(taskDefinition: ecs.TaskDefinition) {
    const appPorts = taskDefinition.defaultContainer!.portMappings.length > 0
      ? taskDefinition.defaultContainer!.portMappings.map(p => p.containerPort)
      : [];

    const appMeshProxyConfiguration = new ecs.AppMeshProxyConfiguration({
      containerName: this.envoyContainerName,
      properties: {
        appPorts: appPorts,
        proxyEgressPort: this.proxyEgressPort,
        proxyIngressPort: this.proxyIngressPort,
        ignoredUID: this.envoyUser,
        ignoredGID: this.proxyIgnoredGID,
        egressIgnoredIPs: [
          '169.254.170.2', // ECS metadata endpoints
          '169.254.169.254', // EC2 instance endpoint
        ],
        egressIgnoredPorts: [],
      },
    });

    // Hack in the proxy configuration
    const cfnTaskDefinition = taskDefinition.node.findChild('Resource') as ecs.CfnTaskDefinition;
    cfnTaskDefinition.proxyConfiguration = appMeshProxyConfiguration.bind(taskDefinition, taskDefinition);
  }
}