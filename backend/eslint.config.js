// ESLint v9+ Flat Config
// Migrated from .eslintrc.json
const typescriptEslint = require('@typescript-eslint/eslint-plugin');
const typescriptParser = require('@typescript-eslint/parser');

module.exports = [
  {
    // Global ignores (applies to all files)
    ignores: [
      'dist/**',
      'node_modules/**',
      'coverage/**',
      '*.config.js',
      '.eslintrc.js',
      '.eslintrc.json'
    ]
  },
  {
    // Configuration for TypeScript files
    files: ['src/**/*.ts', 'apps/**/*.ts', 'libs/**/*.ts', 'test/**/*.ts'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 'latest'
      },
      globals: {
        node: true,
        jest: true,
        es2021: true
      }
    },
    plugins: {
      '@typescript-eslint': typescriptEslint
    },
    rules: {
      // Migrated from .eslintrc.json
      '@typescript-eslint/interface-name-prefix': 'off',
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': 'off',
      'no-console': 'off'
    }
  }
];
