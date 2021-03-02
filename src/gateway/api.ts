import * as appmesh from '@aws-cdk/aws-appmesh';
import * as ec2 from '@aws-cdk/aws-ec2';

/**
 * A WebCarver gateway. It's basically a connectable IVirtualGateway.
 */
export interface IGateway extends appmesh.IVirtualGateway, ec2.IConnectable {
}