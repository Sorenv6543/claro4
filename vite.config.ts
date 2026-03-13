import type { PluginOption } from 'vite'

import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'

const chunkNames = [
  'admin-components',
  'owner-components',
  'shared-ui',
  'admin-logic',
  'owner-logic',
  'shared-logic',
]

const resolveAlias = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  const plugins: PluginOption[] = [
    vue({
      template: {
        compilerOptions: {
          sourceMap: true,
        },
      },
    }),
    vuetify({
      autoImport: true,
      // NOTE: vuetify plugin's styles.configFile option is currently required to avoid a warning about missing SASS variables, even though the variables are actually being loaded correctly via the main.scss entry point. Tracked as a follow-up task to investigate and eliminate this quirk.
      // The plugin doesn't support an array of config files, so we point it to the main variables file that imports all others.
      // styles.configFile is relative to the project root, and should use forward slashes even on Windows
      styles: {
        configFile: 'src/styles/variables.scss',
      },
    }),
  ]

  if (isDevelopment) {
    plugins.push(devtoolsJson())

    const vueDevToolsPlugin = vueDevTools({
      componentInspector: {
        enabled: false,
        toggleComboKey: 'alt-shift',
        launchEditor: 'code',
      },
    })

    if (vueDevToolsPlugin) {
      plugins.push(vueDevToolsPlugin)
    }
  }

  if (isProduction) {
    plugins.push(
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['pwa-icon.svg'],
        manifest: {
          name: 'Property Cleaning Scheduler',
          short_name: 'CleanSync',
          description: 'Professional property cleaning management for owners and administrators',
          theme_color: '#1976d2',
          background_color: '#ffffff',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          categories: ['productivity', 'cleaning', 'property management'],
          lang: 'en-US',
          orientation: 'portrait',
          icons: [
            {
              src: 'pwa-icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
            },
            {
              src: 'pwa-icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: [
            '**/*.js',
            '**/*.css',
            '**/*.html',
            '**/*.svg',
            '**/*.woff2',
            '**/*.woff',
            '**/*.ttf',
            '**/*.eot',
          ],
          globDirectory: 'dist',
          runtimeCaching: [
            {
              urlPattern: ({ url }) => chunkNames.some(chunk => url.pathname.includes(chunk)),
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'role-based-chunks',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
            {
              urlPattern: ({ url }) => url.pathname.startsWith('/api'),
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 24 * 60 * 60,
                },
                networkTimeoutSeconds: 3,
              },
            },
            {
              urlPattern: ({ request }) => request.destination === 'image',
              handler: 'CacheFirst',
              options: {
                cacheName: 'images',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 30 * 24 * 60 * 60,
                },
              },
            },
          ],
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [/^\/_/, /\/[^/?]+\.[^/]+$/],
          clientsClaim: true,
          skipWaiting: true,
        },
        devOptions: {
          enabled: false,
          type: 'module',
          navigateFallback: '/index.html',
        },
        mode: 'production',
        injectRegister: 'auto',
        includeManifestIcons: false,
        injectManifest: {
          injectionPoint: undefined,
        },
      }),
    )
  }

  return {
    plugins,
    resolve: {
      alias: {
        '@': resolveAlias('./src'),
        '@components': resolveAlias('./src/components'),
        '@composables': resolveAlias('./src/composables'),
        '@stores': resolveAlias('./src/stores'),
        '@types': resolveAlias('./src/types'),
        '@utils': resolveAlias('./src/utils'),
        '@layouts': resolveAlias('./src/layouts'),
        '@pages': resolveAlias('./src/pages'),
        '@plugins': resolveAlias('./src/plugins'),
        '@assets': resolveAlias('./src/assets'),
        // NOTE: Full Vue build (includes runtime template compiler). Normally unnecessary
        // with Vite SFCs — remove and test once FullCalendar runtime compilation is confirmed safe.
        'vue': 'vue/dist/vue.esm-bundler.js',
      },
    },
    define: {
      '__ENABLE_OWNER_FEATURES__': JSON.stringify(true),
      '__ENABLE_ADMIN_FEATURES__': JSON.stringify(true),
      '__DEV_DEMOS_ENABLED__': JSON.stringify(isDevelopment),
      '__BUILD_VERSION__': JSON.stringify(process.env.npm_package_version || '0.1.0'),
      '__BUILD_TIMESTAMP__': JSON.stringify(new Date().toISOString()),
      '__VUE_OPTIONS_API__': JSON.stringify(true),
      '__VUE_PROD_DEVTOOLS__': JSON.stringify(!isProduction),
    },
    css: {
      devSourcemap: true,
      preprocessorOptions: {
        scss: {
          quietDeps: true,
          loadPaths: ['node_modules'],
        },
        // Vuetify's internal .sass source (loaded when styles.configFile is set)
        // also benefits from sass-embedded, which Vite 7 uses by default.
        sass: {},
      },
    },
    server: {
      port: 3000,
      open: true,
      sourcemapIgnoreList: false,
      hmr: {
        overlay: false,
      },
      watch: {
        usePolling: false,
      },
    },
    build: {
      target: 'esnext',
      sourcemap: isDevelopment ? true : 'hidden',
      chunkSizeWarningLimit: 1000,
      rollupOptions: {
        output: {
          manualChunks: id => {
            if (id.includes('node_modules')) {
              if (id.includes('@fullcalendar')) {
                return 'calendar'
              }

              if (id.includes('/vuetify/')) {
                return 'vuetify'
              }

              if (id.includes('@supabase/')) {
                return 'supabase'
              }

              if (id.includes('/vue/') || id.includes('/@vue/') || id.includes('/vue-demi/')) {
                return 'vue-core'
              }

              if (id.includes('/vue-router/')) {
                return 'vue-core'
              }

              if (id.includes('/pinia/')) {
                return 'vue-core'
              }

              return 'vendor'
            }

            if ((id.includes('/src/dev/') || id.includes('\\src\\dev\\')) && isProduction) {
              return undefined
            }

            if (id.includes('/owner/') || id.includes('\\owner\\')) {
              return 'owner-app'
            }

            if (id.includes('/admin/') || id.includes('\\admin\\')) {
              return 'admin-app'
            }

            // NOTE: 3 circular chunk warnings (app→admin-app→app, app→owner-app→app,
            // vuetify→app→owner-app→vuetify) are pre-existing and stem from the router
            // eagerly importing admin/owner pages. Eliminating them requires converting
            // all routes to lazy imports: () => import('./pages/...'). Tracked as a
            // follow-up task.
            if (
              id.includes('/stores/')
              || id.includes('\\stores\\')
              || id.includes('/composables/shared/')
              || id.includes('\\composables\\shared\\')
              || id.includes('/utils/')
              || id.includes('\\utils\\')
            ) {
              return 'app-core'
            }

            return 'app'
          },
        },
      },
      cssCodeSplit: true,
      minify: isProduction,
    },
    optimizeDeps: {
      include: [
        'vue',
        'vue-router',
        'pinia',
        'vuetify',
        '@fullcalendar/vue3',
        '@fullcalendar/core',
        '@fullcalendar/daygrid',
        '@fullcalendar/timegrid',
        '@fullcalendar/interaction',
      ],
    },
    preview: {
      port: 4173,
      open: true,
      cors: true,
    },
  }
})
