import * as ec2 from '@aws-cdk/aws-ec2';
import * as ecs from '@aws-cdk/aws-ecs';
import * as elbv2 from '@aws-cdk/aws-elasticloadbalancingv2';
import * as cdk from '@aws-cdk/core';

export interface AddToListenerProps extends elbv2.AddApplicationTargetsProps {
  readonly vpc: ec2.IVpc;
  readonly service: ecs.BaseService;
  readonly listener: elbv2.IApplicationListener;
}

export class AddToListener extends cdk.Construct {
  constructor(scope: cdk.Construct, id: string, props: AddToListenerProps) {
    super(scope, id);

    const { vpc, listener, service } = props;

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc: vpc,
      targets: [
        service.loadBalancerTarget({
          containerName: service.taskDefinition.defaultContainer!.containerName,
        }),
      ],
      port: service.taskDefinition.defaultContainer!.containerPort,
    });

    listener.addTargetGroups('Default', {
      targetGroups: [targetGroup],
      healthCheck: {
        healthyHttpCodes: '200,404',
      },
      deregistrationDelay: cdk.Duration.seconds(0),
      ...props,
    });
  }
}