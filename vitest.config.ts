import path from 'node:path'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({
      // Enable auto-import for Vuetify components
      autoImport: true,

      styles: {
        configFile: 'src/styles/variables.scss',
      },
    }),
  ],
  test: {
    globals: true,
    environment: 'happy-dom',
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,vue}'],
      exclude: [
        'node_modules/',
        'src/assets/',
        'src/**/*.{test,spec}.{ts,js}',
        'src/__tests__/**',
        'src/types/**',
        'src/main.ts',
      ],
    },
    include: ['src/**/*.{test,spec}.{js,ts,jsx,tsx}', 'scripts/**/*.test.{js,ts}'],
    css: true,
    setupFiles: ['./src/__tests__/setup/setupTests.ts'],
    server: {
      deps: {
        inline: ['vuetify'],
      },
    },
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@components': path.resolve(__dirname, './src/components'),
      '@composables': path.resolve(__dirname, './src/composables'),
      '@stores': path.resolve(__dirname, './src/stores'),
      '@types': path.resolve(__dirname, './src/types'),
      '@utils': path.resolve(__dirname, './src/utils'),
      '@layouts': path.resolve(__dirname, './src/layouts'),
      '@pages': path.resolve(__dirname, './src/pages'),
      '@plugins': path.resolve(__dirname, './src/plugins'),
      '@assets': path.resolve(__dirname, './src/assets'),
    },
  },
})
