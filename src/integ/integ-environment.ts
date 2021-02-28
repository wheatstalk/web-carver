import * as path from 'path';
import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as cdk from '@aws-cdk/core';
import { WebCarverContext } from '../config';
import { WebCarverEnvironment } from '../web-carver-environment';
import { WebCarverListener, WebCarverService, WebCarverServiceExtension } from '../web-carver-service';

export class IntegEnvironment extends cdk.Stack {
  constructor(scope: cdk.Construct) {
    super(scope, 'integ-environment');

    WebCarverContext.set(this.node, {
      usePublicServiceNetworking: true,
      useFargateSpot: true,
    });

    const environment = new WebCarverEnvironment(this, 'Environment');
    // Let me in!!
    environment.defaultGateway.connections.allowFromAnyIpv4(ec2.Port.allTraffic());

    const echo = new WebCarverService(this, 'Echo', {
      environment,
      hostName: 'echo',
      image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
      listeners: [WebCarverListener.http2(80)],
      extensions: [
        WebCarverServiceExtension.envVars({ PORT: '80' }),
        WebCarverServiceExtension.http2GatewayRoute(),
      ],
    });
    echo.connections.allowFromAnyIpv4(ec2.Port.allTraffic());

    new WebCarverService(this, 'EchoV1', {
      environment,
      hostName: 'echo-v1',
      image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
      listeners: [WebCarverListener.http1(80)],
      extensions: [
        WebCarverServiceExtension.envVars({ PORT: '80' }),
        WebCarverServiceExtension.http2GatewayRoute({
          prefixPath: '/v1',
        }),
      ],
    });

    const backend = new WebCarverService(this, 'Backend', {
      environment,
      hostName: 'backend',
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'mesh-app')),
      listeners: [WebCarverListener.http1(80)],
      extensions: [
        WebCarverServiceExtension.envVars({ FLASK_APP: 'backend.py' }),
        WebCarverServiceExtension.http2GatewayRoute({
          prefixPath: '/backend',
        }),
      ],
    });

    new WebCarverService(this, 'Consumer', {
      environment,
      hostName: 'consumer',
      image: ecs.ContainerImage.fromAsset(path.join(__dirname, 'mesh-app')),
      listeners: [WebCarverListener.http1(80)],
      extensions: [
        WebCarverServiceExtension.envVars({ FLASK_APP: 'consumer.py' }),
        WebCarverServiceExtension.http2GatewayRoute({
          prefixPath: '/consumer',
        }),
        WebCarverServiceExtension.linkedService({ webCarverService: backend }),
      ],
    });
  }
}

const app = new cdk.App();
new IntegEnvironment(app);