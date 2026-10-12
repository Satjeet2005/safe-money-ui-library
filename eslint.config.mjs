import tseslint from 'typescript-eslint';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import jestPlugin from 'eslint-plugin-jest';
import cypressPlugin from 'eslint-plugin-cypress';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/node_modules/**',
      '**/coverage/**',
      '**/.stryker-tmp/**',
      '**/cypress/videos/**',
      '**/cypress/screenshots/**',
      'docs/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ['*.config.*', '*/*/*.config.*', '*/*.config.*'],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      'react-hooks': reactHooksPlugin,
      'jsx-a11y': jsxA11yPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/ban-ts-comment': 'error',
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      ...jsxA11yPlugin.configs.recommended.rules,
    },
  },
  {
    files: [
      'packages/safe-money-ui/src/**/*.{ts,tsx}',
      'apps/transfer-demo/src/service/**/*.{ts,tsx}',
    ],
    ignores: ['apps/transfer-demo/src/service/clock.ts', 'apps/transfer-demo/src/service/ids.ts'],
    rules: {
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message:
            'Math.random is forbidden in money library and service logic. Inject an ID generator.',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Date.now is forbidden in money library and service logic. Inject a Clock.',
        },
        {
          object: 'performance',
          property: 'now',
          message: 'performance.now is forbidden. Inject a Clock.',
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector: "NewExpression[callee.name='Date']",
          message: 'new Date() is forbidden in money library and service logic. Inject a Clock.',
        },
      ],
    },
  },
  {
    files: ['**/test/**/*.{ts,tsx}', '**/*.test.{ts,tsx}'],
    plugins: {
      jest: jestPlugin,
    },
    rules: {
      'jest/no-focused-tests': 'error',
      'jest/no-disabled-tests': 'error',
    },
  },
  {
    files: ['**/cypress/**/*.{ts,tsx}'],
    plugins: {
      cypress: cypressPlugin,
    },
    rules: {
      'cypress/no-unnecessary-waiting': 'error',
    },
  },
  {
    files: ['**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
);
