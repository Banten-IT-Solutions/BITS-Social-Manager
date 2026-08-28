import globals from 'globals';
import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';

export default [
  {
    languageOptions: { globals: globals.browser },
  },
  {
    files: [
      'scripts/**/*.{js,mjs}',
      '*.config.{js,ts}',
      'vite.config.ts',
      'vitest.config.ts',
      'drizzle.config.ts',
    ],
    languageOptions: { globals: globals.node },
  },
  pluginJs.configs.recommended,
  eslintConfigPrettier,
  {
    ignores: ['dist/', '.wrangler/', 'node_modules/', 'wrangler.jsonc'],
  },
];
