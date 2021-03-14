import * as ecs from '@aws-cdk/aws-ecs';
import { Construct } from '@aws-cdk/core';
import { IServiceExtensionFacade } from '../service';
import { IServiceExtension } from './api';

/** @internal */
export class CapacityProviderStrategiesExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'UseSpot';

  constructor(private readonly capacityProviderStrategies: ecs.CapacityProviderStrategy[]) {

  }

  _register(service: IServiceExtensionFacade, _privateScope: Construct): void {
    service._addServicePropsFilter(props => {
      return {
        ...props,
        capacityProviderStrategies: this.capacityProviderStrategies,
      };
    });
  }
}