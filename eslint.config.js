import js from '@eslint/js';
import globals from 'globals';

export default [
  { ignores: ['public/**', 'node_modules/**', '.wrangler/**'] },
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
      },
    },
    rules: {
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
  },
];
