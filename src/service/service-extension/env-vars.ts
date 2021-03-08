import { Service } from '../service';
import { IServiceExtension } from './api';

/**
 * Adds environment variables to the container.
 * @internal
 */
export class EnvVarsExtension implements IServiceExtension {
  public readonly _extensionTypeName = 'EnvVarsExtension';

  constructor(private readonly env: Record<string, string>) {
  }

  _register(service: Service) {
    service.addEnvVars(this.env);
  }
}