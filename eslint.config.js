import typescript from '@typescript-eslint/eslint-plugin'
import vuetify from 'eslint-config-vuetify'
// @ts-check
import vue from 'eslint-plugin-vue'

export default vuetify(
  // eslint-config-vuetify auto-detects Vue and TypeScript support
  {},

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
    ],
  },

  // TypeScript overrides — plugin must be declared in the same block
  {
    plugins: { '@typescript-eslint': typescript },
    rules: {
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-unused-vars': 'off',
      // eslint-plugin-unicorn@62 crashes when auto-fixing .substring() in ESLint 10
      'unicorn/prefer-string-slice': 'off',
    },
  },

  // Vue-specific overrides — plugin must be declared in the same block
  {
    files: ['**/*.vue'],
    plugins: { vue },
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
)
