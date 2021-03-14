import { Construct } from '@aws-cdk/core';
import { IServiceExtension, IServiceExtensionApi } from './api';

/**
 * Task size options
 */
export interface TaskSizeExtensionOptions {
  /**
   * Fargate CPU size
   */
  readonly cpu: number;

  /**
   * Fargate memory size
   */
  readonly memoryLimitMiB: number;
}

/** @internal */
export class TaskSizeExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'TaskSizeExtension';

  constructor(private readonly options: TaskSizeExtensionOptions) {}

  _register(service: IServiceExtensionApi, _privateScope: Construct): void {
    service._addTaskDefinitionPropsFilter(props => ({
      ...props,
      cpu: this.options.cpu,
      memoryLimitMiB: this.options.memoryLimitMiB,
    }));
  }
}