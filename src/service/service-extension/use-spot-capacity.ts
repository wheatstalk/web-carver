import * as ecs from '@aws-cdk/aws-ecs';
import { Construct } from '@aws-cdk/core';
import { IServiceExtensionApi } from '../service';
import { IServiceExtension } from './api';

/** @internal */
export class CapacityProviderStrategiesExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'UseSpot';

  constructor(private readonly capacityProviderStrategies: ecs.CapacityProviderStrategy[]) {

  }

  _register(service: IServiceExtensionApi, _privateScope: Construct): void {
    service._addServicePropsFilter(props => {
      return {
        ...props,
        capacityProviderStrategies: this.capacityProviderStrategies,
      };
    });
  }
}