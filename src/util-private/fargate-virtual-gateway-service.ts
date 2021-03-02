import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { AddAppMeshEnvoyExtension } from './add-app-mesh-envoy-extension';
import { AddUtilityEnvoyExtension } from './add-utility-envoy-extension';

/**
 * Props for `FargateVirtualGateway`
 */
export interface FargateVirtualGatewayServiceProps extends ecs.BaseServiceOptions {
  /**
   * Provide a virtual gateway to use.
   */
  readonly virtualGateway: appmesh.IVirtualGateway;

  /**
   * Provide a port for the virtual gateway to listen on.
   */
  readonly virtualGatewayPort?: number;

  /**
   * Envoy container image.
   * @default - Use a recent image from public.ecr.aws/appmesh/aws-appmesh-envoy
   */
  readonly image?: ecs.ContainerImage;

  /**
   * Fargate task vCPUs
   * @default 256
   */
  readonly cpu?: number;

  /**
   * Fargate task memory allocation
   * @default 512
   */
  readonly memoryLimitMiB?: number;

  /**
   * Assign a public IP
   * @default false
   */
  readonly assignPublicIp?: boolean;

  /**
   * Use VPC subnets.
   */
  readonly vpcSubnets?: ec2.SubnetSelection;

  /**
   * Security groups
   */
  readonly securityGroups?: ec2.ISecurityGroup[];
}

/**
 * Creates an AppMesh Virtual Gateway that can be used for ingress traffic
 */
export class FargateVirtualGatewayService extends cdk.Construct {
  /**
   * ECS service of the Virtual Gateway
   */
  public readonly service: ecs.FargateService;

  constructor(scope: cdk.Construct, id: string, props: FargateVirtualGatewayServiceProps) {
    super(scope, id);

    const virtualGatewayPort = props.virtualGatewayPort ?? 8080;
    const utilEnvoyPort = virtualGatewayPort + 8000;
    const utilEnvoyAdminPort = 9902; // virtual gateway uses 9901

    const taskDefinition = new ecs.FargateTaskDefinition(this, 'GatewayTaskDefinition', {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
    });

    // Traffic is handled like this:
    // Ingress traffic -> UtilEnvoy -> VirtualGatewayEnvoy -> Mesh.
    // UtilEnvoy adds the X-Forwarded-Host header so that the mesh can route
    // requests by the original host header.

    taskDefinition.addExtension(
      new AddUtilityEnvoyExtension({
        containerName: 'UtilEnvoy',
        containerPorts: [utilEnvoyPort],
        envoyAdminPort: utilEnvoyAdminPort,
        envoyConfigFile: 'virtual-gateway-proxy.yaml',
        envoyConfigVars: {
          ENVOY_ADMIN_PORT: utilEnvoyAdminPort.toString(),
          ENVOY_UPSTREAM_PORT: utilEnvoyPort.toString(),
          ENVOY_DOWNSTREAM_PORT: virtualGatewayPort.toString(),
        },
        // Give a unique SHM ID so that this envoy can coexist with AppMesh's
        // envoy on the same task.
        baseId: 1,
      }));

    // Fargate does not support CAP_NET_BIND_SERVICE, so to bind low ports,
    // we need to run envoy as root.
    const envoyUser = virtualGatewayPort < 1024 ? 0 : undefined;

    taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        containerName: 'VirtualGatewayEnvoy',
        image: props.image,
        containerPorts: [virtualGatewayPort],
        envoyUser: envoyUser,
        endpointArn: props.virtualGateway.virtualGatewayArn,
        patchProxyConfiguration: false,
      }));

    this.service = new ecs.FargateService(this, 'GatewayService', {
      taskDefinition: taskDefinition,
      circuitBreaker: { rollback: true },
      ...props,
    });
  }
}

