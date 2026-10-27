import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const expo = require('eslint-config-expo/flat');
export default [
  ...expo,
  {
    settings: {
      'import/resolver': {
        typescript: { project: './apps/mobile/tsconfig.json' },
      },
    },
  },
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.expo/**', '.tools/**'] },
];
