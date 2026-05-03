// @ts-check
import vuetify from 'eslint-config-vuetify'
// Await the vuetify config array so ESLint sees a plain array rather than the
// FlatConfigComposer thenable. This avoids eslint-flat-config-utils@3.1.0's
// strict duplicate-plugin check while still letting us add configs after the
// vuetify-registered plugins (@typescript-eslint is in configs 4/11/15/16).
const vuetifyConfigs = await vuetify()

export default [
  ...vuetifyConfigs,

  // Project-level ignores
  {
    ignores: [
      'dist/**',
      'dev-dist/**',
      'node_modules/**',
      'coverage/**',
      'test-results/**',
      'playwright-report/**',
      '.vscode/**',
      '.nuxt/**',
      '**/*.yaml',
      '**/*.yml',
      'design/**',
    ],
  },

  // TypeScript rule overrides — @typescript-eslint is already registered by vuetify configs
  {
    files: ['**/*.?([cm])ts', '**/*.?([cm])tsx', '**/*.vue'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
      // eslint-plugin-unicorn@62 crashes when auto-fixing .substring() in ESLint 10
      'unicorn/prefer-string-slice': 'off',
    },
  },

  // Script utilities — CLI scripts may call process.exit(), and _-prefixed unused vars are intentional
  {
    files: ['scripts/**'],
    rules: {
      'unicorn/no-process-exit': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    },
  },

  // Vue-specific overrides — vue plugin already registered by vuetify configs
  {
    files: ['**/*.vue'],
    rules: {
      'vue/multi-word-component-names': 'off',
      'vue/no-unused-vars': 'error',
      'vue/component-definition-name-casing': ['error', 'PascalCase'],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/prefer-define-options': 'error',
      'vue/no-v-html': 'warn',
    },
  },
]
