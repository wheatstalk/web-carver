# WebCarver

[![Release](https://github.com/wheatstalk/web-carver/actions/workflows/release.yml/badge.svg)](https://github.com/wheatstalk/web-carver/actions/workflows/release.yml)
[![npm](https://img.shields.io/npm/v/@wheatstalk/web-carver)](https://www.npmjs.com/package/@wheatstalk/web-carver)
[![codecov](https://codecov.io/gh/wheatstalk/web-carver/branch/master/graph/badge.svg?token=5SOOzoDZDQ)](https://codecov.io/gh/wheatstalk/web-carver)

WebCarver is a micro-framework for building and deploying Fargate tasks to an AWS App Mesh.

## Features

- A Fargate-based Virtual Gateway
- A scheme for host-based, path-based, and header-based routing from the gateway to your services
- Fargate spot support
- Private networking with NAT gateways
- Opt-in support for less-expensive networking that uses only security groups to secure public tasks

## Example

```ts
// Spin up an environment. It will create a VPC, ECS Cluster, App Mesh,
// Virtual Gateway, Load Balancer, and Fargate tasks that operate as
// the virtual gateway.
const environment = new webcarver.Environment(this, 'Environment');

// Create a new service
new webcarver.Service(this, 'GatewayEcho', {
  environment,
  // Name your service
  name: webcarver.ServiceName.hostName('gateway-echo'),
  // Add functionality to the service by extending it.
  extensions: [
    // Extend the service with a container. This one repeats back the request
    // it receives.
    webcarver.ServiceExtension.container({
      image: ecs.ContainerImage.fromRegistry('jmalloc/echo-server'),
      environment: { PORT: '80' },
      listeners: [
        // Port 80 on the container speaks HTTP/2
        webcarver.ServiceListener.http2(80),
      ],
    }),
    // Receive requests sent to routed-echo.example.com and received by the
    // environment's virtual gateway.
    webcarver.ServiceExtension.httpRoute({
      headers: [
        webcarver.HttpRouteHeaderMatch.valueIs('x-forwarded-host', 'routed-echo.example.com'),
      ],
    }),
  ],
});
```

## Troubleshooting

**A stack that imports an environment from another stack errors that resources do not exist**

* You may have an out of date cdk.context.json. Delete this file and try again.
* Your environment stack may have drifted. Run stack drift detection.