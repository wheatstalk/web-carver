import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { AddEnvoyCommonProps, AddAppMeshEnvoyExtension } from './add-app-mesh-envoy-extension';

export interface EcsServiceVirtualNodeProps extends AddEnvoyCommonProps {
  readonly mesh: appmesh.IMesh;
  readonly service: ecs.FargateService;
  readonly protocol?: appmesh.Protocol;
  // readonly virtualServiceName?:
}

export class EcsVirtualNode extends cdk.Construct {
  public readonly virtualNode: appmesh.IVirtualNode;
  private virtualServiceName?: string;

  constructor(scope: cdk.Construct, id: string, props: EcsServiceVirtualNodeProps) {
    super(scope, id);

    const taskDefinition = props.service.taskDefinition;
    const port = taskDefinition.defaultContainer!.containerPort;

    function getVirtualNodeListener() {
      const protocol = props.protocol;
      if (protocol === appmesh.Protocol.HTTP) {
        return appmesh.VirtualNodeListener.http({ port });
      } else {
        return appmesh.VirtualNodeListener.http2({ port });
      }
    }

    const virtualNodeListener = getVirtualNodeListener();

    this.virtualNode = new appmesh.VirtualNode(this, 'VirtualNode', {
      mesh: props.mesh,
      serviceDiscovery: appmesh.ServiceDiscovery.cloudMap({ service: props.service.cloudMapService! }),
      listeners: [virtualNodeListener],
    });

    taskDefinition.addExtension(
      new AddAppMeshEnvoyExtension({
        ...props,
        endpointArn: this.virtualNode.virtualNodeArn,
        patchProxyConfiguration: true,
      }));
  }

  public addVirtualService(id: string): appmesh.VirtualService {
    return this.node.tryFindChild(id) as appmesh.VirtualService
      ?? new appmesh.VirtualService(this, id, {
        virtualServiceName: this.virtualServiceName,
        virtualServiceProvider: appmesh.VirtualServiceProvider.virtualNode(this.virtualNode),
      });
  }
}