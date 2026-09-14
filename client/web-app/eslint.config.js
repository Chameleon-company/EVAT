import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: { '@stylistic': stylistic },
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // ...pluginImport.configs.recommended.rules,
      ...stylistic.configs['recommended-extends']?.rules,

      camelcase: 'off',
      'no-underscore-dangle': 0,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'prefer-destructuring': ['error', { object: true, array: false }],
      
      // Import Rules
      // 'import/extensions': ['error', 'ignorePackages', { 'js': 'never', 'ts': 'never' }],
      // 'import/order': ['error', {
      //   'groups': ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
      //   'pathGroups': [
      //     { 'pattern': '@/Components/*', 'group': 'object' },
      //     { 'pattern': '@/**/*.vue', 'group': 'object' },
      //     { 'pattern': './**/*.vue', 'group': 'object' },
      //     { 'pattern': 'ziggy-js', 'group': 'external' }
      //   ]
      // }],

      // Stylistic Rules
      '@stylistic/arrow-parens': ['error', 'always'],
      '@stylistic/brace-style': ['error', 'stroustrup', { allowSingleLine: false }],
      '@stylistic/indent': ['error', 2, { SwitchCase: 0 }],
      '@stylistic/function-call-spacing': ['error', 'never'],
      // '@stylistic/max-len': ['error', { 'code': 80 }],
      '@stylistic/member-delimiter-style': ['error', {
        multiline: { delimiter: 'semi', requireLast: true },
        singleline: { delimiter: 'semi', requireLast: false }
      }],
      '@stylistic/no-extra-parents': 0,
      '@stylistic/object-curly-newline': ['error', { multiline: true }],
      '@stylistic/quote-props': ['error', 'as-needed'],
      '@stylistic/semi': ['error', 'always']
    },
  },
]);