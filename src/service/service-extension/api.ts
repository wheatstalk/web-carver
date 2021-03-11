import * as cdk from '@aws-cdk/core';
import { IServiceExtensionFacade } from '../service';

/**
 * Extends the service with additional features.
 */
export interface IServiceExtension {
  /** @internal */
  readonly _extensionTypeName: string;

  /** @internal */
  _register(service: IServiceExtensionFacade, privateScope: cdk.Construct): void;
}