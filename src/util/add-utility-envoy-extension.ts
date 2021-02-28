import * as path from 'path';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { PACKAGE_ROOT } from '../index';

/** @internal */
export interface AddUtilityEnvoyExtensionProps {
  /**
   * Choose a base id other than 1 to allow multiple envoy to run on a task.
   * @default 0
   */
  readonly baseId?: number;

  /**
   * Name of the container to add
   * @default 'util-envoy'
   */
  readonly containerName?: string;

  /**
   * Port for envoy to listen on.
   */
  readonly containerPorts: number[];

  /**
   * The admin port. When provided, the extension will map the port and add a
   * health check.
   */
  readonly envoyAdminPort?: number;

  /**
   * Which envoy configuration to use.
   * */
  readonly envoyConfigFile: string;

  /**
   * Variables to substitute in the configuration.
   */
  readonly envoyConfigVars?: Record<string, string>;
}

function renderHealthCheck(envoyAdminPort: number) {
  return {
    command: [
      'bash', '-c',
      `curl -s http://127.0.0.1:${envoyAdminPort}/ready | grep -q LIVE`,
    ],
    startPeriod: cdk.Duration.seconds(10),
    interval: cdk.Duration.seconds(5),
    timeout: cdk.Duration.seconds(2),
  };
}

/** @internal */
export class AddUtilityEnvoyExtension implements ecs.ITaskDefinitionExtension {
  private readonly containerPorts: number[];
  private readonly containerName: string;
  private readonly envoyAdminPort?: number;
  private readonly envoyConfigFile: string;
  private readonly envoyConfigVars: Record<string, string>;
  private readonly baseId: number;
  private readonly logging: ecs.LogDriver;

  constructor(props: AddUtilityEnvoyExtensionProps) {
    this.containerPorts = props.containerPorts;
    this.containerName = props.containerName ?? 'util-envoy';
    this.envoyAdminPort = props.envoyAdminPort;
    this.envoyConfigFile = props.envoyConfigFile;
    this.envoyConfigVars = props.envoyConfigVars ?? {};
    this.baseId = props.baseId ?? 1;
    this.logging = ecs.LogDriver.awsLogs({ streamPrefix: 'util-envoy' });
  }

  extend(taskDefinition: ecs.TaskDefinition) {
    const buildArgs: Record<string, string> = {
      ENVOY_CONFIG: this.envoyConfigFile,
      ENVOY_CONFIG_VARS: Object.entries(this.envoyConfigVars)
        .map(([k, v]) => `export ${k}=${v}`)
        .join('\n'),
    };

    if (this.envoyAdminPort) {
      buildArgs.ENVOY_ADMIN_PORT = this.envoyAdminPort.toString();
    }

    const envoyAdminPort = this.envoyAdminPort;
    const container = taskDefinition.addContainer(this.containerName, {
      essential: true,
      image: ecs.ContainerImage.fromAsset(path.join(PACKAGE_ROOT, 'resources', 'util-envoy'), {
        buildArgs,
      }),
      logging: this.logging,
      command: [
        'envoy',
        '-c', '/etc/envoy/envoy.yaml',
        '--base-id', this.baseId.toString(),
      ],
      healthCheck: envoyAdminPort
        ? renderHealthCheck(envoyAdminPort)
        : undefined,
    });

    for (const listenerPort of this.containerPorts) {
      container.addPortMappings({ containerPort: listenerPort });
    }

    if (this.envoyAdminPort) {
      container.addPortMappings({ containerPort: this.envoyAdminPort });
    }

    container.addUlimits({
      softLimit: 1024000,
      hardLimit: 1024000,
      name: ecs.UlimitName.NOFILE,
    });
  }
}