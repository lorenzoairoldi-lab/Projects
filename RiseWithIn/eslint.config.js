import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['**/node_modules/**', '**/dist/**', '**/.artifacts/**'] },
  {
    ...js.configs.recommended,
    files: ['api-gateway/**/*.js', 'services/**/*.js', 'shared/**/*.js'],
    languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
    rules: { ...js.configs.recommended.rules, 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  },
  {
    files: ['frontend/src/**/*.{js,jsx}', 'frontend/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: globals.browser
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^[A-Z][A-Z0-9_]*$' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  },
  { files: ['**/__tests__/**/*.js', '**/*.{test,spec}.js'], languageOptions: { globals: globals.jest } }
];
