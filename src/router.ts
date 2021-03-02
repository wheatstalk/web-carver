import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as cdk from '@aws-cdk/core';

/**
 * A WebCarver router.
 */
export interface IRouter extends appmesh.IVirtualRouter, ec2.IConnectable {
  /**
   * The virtual service for this router.
   */
  readonly virtualService: appmesh.IVirtualService;
}

/**
 * Props for `Router`
 */
export interface RouterProps {
  /**
   * The mesh to create the router in.
   */
  readonly mesh: appmesh.IMesh;

  /**
   * The VPC to create the router's security group in.
   */
  readonly vpc: ec2.IVpc;
}

/**
 * Creates a WebCarver Router.
 */
export class Router extends appmesh.VirtualRouter implements IRouter {
  readonly virtualService: appmesh.IVirtualService;
  readonly connections: ec2.Connections;

  constructor(scope: cdk.Construct, id: string, props: RouterProps) {
    super(scope, id, {
      mesh: props.mesh,
      listeners: [
        appmesh.VirtualRouterListener.http2(),
      ],
    });

    this.connections = new ec2.Connections({
      securityGroups: [],
    });

    this.virtualService = new appmesh.VirtualService(this, 'Service', {
      virtualServiceProvider: appmesh.VirtualServiceProvider.virtualRouter(this),
    });
  }
}