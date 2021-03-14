import * as cdk from '@aws-cdk/core';
import { IServiceExtensionApi } from '../service';

/**
 * Extends the service with additional features.
 */
export interface IServiceExtension {
  /** @internal */
  readonly _extensionTypeName: string;

  /** @internal */
  _register(service: IServiceExtensionApi, privateScope: cdk.Construct): void;
}