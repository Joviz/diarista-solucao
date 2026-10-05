import tseslint from 'typescript-eslint';
import reactPlugin from 'eslint-plugin-react';
import securityPlugin from 'eslint-plugin-security';

export default [
  { ignores: ['dist', 'node_modules', '.vite'] },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    settings: {
      react: { version: '18.3' },
    },
    plugins: {
      react: reactPlugin,
      security: securityPlugin,
    },
    rules: {
      'react/jsx-no-target-blank': 'error',
      'security/detect-object-injection': 'off',
      'security/detect-non-literal-regexp': 'off',
      'security/detect-unsafe-regex': 'off',
    },
  },
];
