import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { AddAppMeshEnvoyExtension } from './add-app-mesh-envoy-extension';
import { AddUtilityEnvoyExtension } from './add-utility-envoy-extension';

/**
 * Props for `FargateVirtualGateway`
 */
export interface FargateVirtualGatewayProps extends ecs.BaseServiceOptions {
  /**
   * The service mesh in which to create the virtual gateway.
   */
  readonly mesh: appmesh.IMesh;

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
}

/**
 * Creates an AppMesh Virtual Gateway that can be used for ingress traffic
 */
export class FargateVirtualGateway extends cdk.Construct {
  /**
   * Task definition of the Virtual Gateway
   */
  private readonly taskDefinition: ecs.FargateTaskDefinition;

  /**
   * ECS service of the Virtual Gateway
   */
  public readonly service: ecs.FargateService;

  /**
   * The AppMesh Virtual Gateway
   */
  public readonly virtualGateway: appmesh.VirtualGateway;

  constructor(scope: cdk.Construct, id: string, props: FargateVirtualGatewayProps) {
    super(scope, id);

    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'GatewayTaskDefinition', {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
    });

    // Traffic is handled like this:
    // Ingress traffic -> UtilEnvoy -> VirtualGatewayEnvoy -> Mesh.
    // UtilEnvoy adds the X-Forwarded-Host header so that the mesh can route
    // requests by the original host header.

    const utilEnvoyPort = 8080;
    const utilEnvoyAdminPort = 9902; // virtual gateway uses 9901
    const virtualGatewayEnvoyPort = 8081;

    this.taskDefinition.addExtension(
      new AddUtilityEnvoyExtension({
        containerName: 'UtilEnvoy',
        containerPorts: [utilEnvoyPort],
        envoyAdminPort: utilEnvoyAdminPort,
        envoyConfigFile: 'virtual-gateway-proxy.yaml',
        envoyConfigVars: {
          ENVOY_ADMIN_PORT: utilEnvoyAdminPort.toString(),
          ENVOY_UPSTREAM_PORT: utilEnvoyPort.toString(),
          ENVOY_DOWNSTREAM_PORT: virtualGatewayEnvoyPort.toString(),
        },
        // Give a unique SHM ID so that this envoy can coexist with AppMesh's
        // envoy on the same task.
        baseId: 1,
      }));

    this.virtualGateway = new appmesh.VirtualGateway(this, 'VirtualGateway', {
      mesh: props.mesh,
      listeners: [appmesh.VirtualGatewayListener.http2({ port: virtualGatewayEnvoyPort })],
    });

    this.taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        containerName: 'VirtualGatewayEnvoy',
        endpointArn: this.virtualGateway.virtualGatewayArn,
        image: props.image,
        containerPorts: [virtualGatewayEnvoyPort],
        patchProxyConfiguration: false,
      }));

    this.service = new ecs.FargateService(this, 'GatewayService', {
      taskDefinition: this.taskDefinition,
      circuitBreaker: { rollback: true },
      ...props,
    });
  }
}

