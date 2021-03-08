import * as cdk from '@aws-cdk/core';
import { Service } from '../service';

/**
 * Extends the service with additional features.
 */
export interface IServiceExtension {
  /** @internal */
  readonly _extensionTypeName: string;

  /** @internal */
  _register(service: Service, privateScope: cdk.Construct): void;
}