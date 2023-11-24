import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
export const format = require('prettier-eslint');