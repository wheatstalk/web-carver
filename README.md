# WebCarver

WebCarver is a micro-framework for building and deploying Fargate tasks to an AWS App Mesh.

## Features

- A Fargate-based Virtual Gateway
- A scheme for host-based, path-based, and header-based routing from the gateway to your services
- Fargate spot support
- Private networking with NAT gateways
- Opt-in support for less-expensive networking that uses only security groups to secure public tasks

## Troubleshooting

**A stack that imports an environment from another stack errors that resources do not exist**

* You may have an out of date cdk.context.json. Delete this file and try again.
* Your environment stack may have drifted. Run stack drift detection.