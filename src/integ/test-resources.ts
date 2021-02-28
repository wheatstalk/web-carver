import * as appmesh from '@aws-cdk/aws-appmesh';
import * as acm from '@aws-cdk/aws-certificatemanager';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cloudmap from '@aws-cdk/aws-servicediscovery';
import * as cdk from '@aws-cdk/core';

export class TestResources extends cdk.Construct {
  public readonly httpListener: elbv2.ApplicationListener;
  public readonly mesh: appmesh.Mesh;
  public readonly vpc: ec2.Vpc;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly cluster: ecs.Cluster;

  constructor(scope: cdk.Construct, id: string) {
    super(scope, id);

    this.vpc = new ec2.Vpc(this, 'Vpc', {
      subnetConfiguration: [
        {
          name: 'public',
          cidrMask: 22,
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    this.cluster = new ecs.Cluster(this, 'Cluster', {
      vpc: this.vpc,
      defaultCloudMapNamespace: {
        name: cdk.Stack.of(this).stackName,
        type: cloudmap.NamespaceType.DNS_PRIVATE,
      },
    });

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'GatewayLoadBalancer', {
      vpc: this.vpc,
      internetFacing: true,
    });

    new cdk.CfnOutput(this, 'GatewayLoadBalancerUrl', {
      value: cdk.Fn.sub('http://${Domain}/', {
        Domain: this.loadBalancer.loadBalancerDnsName,
      }),
    });

    // this.httpListener = this.loadBalancer.addListener('HTTP', {
    //   protocol: elbv2.ApplicationProtocol.HTTP,
    // });

    this.httpListener = this.loadBalancer.addListener('HTTPS', {
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [
        acm.Certificate.fromCertificateArn(this, 'Cert', 'arn:aws:acm:ca-central-1:845228478509:certificate/c78e6a36-68f4-471d-92ea-440aa0e607cc'),
      ],
    });

    this.mesh = new appmesh.Mesh(this, 'Mesh', {
      egressFilter: appmesh.MeshFilterType.ALLOW_ALL,
    });
  }
}