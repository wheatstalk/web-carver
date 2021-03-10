export * from './environment';
export * from './environment-manifest';
export * from './service';
export * from './router';
export * from './gateway';
export * from './preferences';

import * as path from 'path';

/**
 * Used to locate the root directory of the package.
 * @internal
 */
export const PACKAGE_ROOT = path.join(__dirname, '..');