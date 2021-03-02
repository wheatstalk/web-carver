export * from './environment';
export * from './service';
export * from './environment';
export * from './router';
export * from './gateway';

import * as path from 'path';

/**
 * Used to locate the root directory of the package.
 * @internal
 */
export const PACKAGE_ROOT = path.join(__dirname, '..');