import type { PluginOption } from 'vite'
import { execSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import { sentryVitePlugin } from '@sentry/vite-plugin'
import vue from '@vitejs/plugin-vue'
import { domscribe } from '@domscribe/vue/vite'
import { defineConfig, loadEnv } from 'vite'
import devtoolsJson from 'vite-plugin-devtools-json'
import { VitePWA } from 'vite-plugin-pwa'
import vueDevTools from 'vite-plugin-vue-devtools'
import vuetify from 'vite-plugin-vuetify'

// Documentation-only: role-based chunk names produced by manualChunks below.
// Keep in sync with the inline array in workbox.runtimeCaching urlPattern (search "SYNC").
// Prefixed with _ because this array is not referenced at runtime — it exists
// so grep/search can find all chunk names in one place.
const _chunkNames = [
  'admin-app',
  'owner-app',
  'app-core',
]

const resolveAlias = (relativePath: string) => fileURLToPath(new URL(relativePath, import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production'
  const isDevelopment = mode === 'development'

  // Load .env / .env.local / .env.<mode> into a plain object. Vite injects
  // VITE_*-prefixed vars into the client bundle automatically, but here in
  // the Node-side config we have no such helper — `process.env` only has
  // OS-exported vars, NOT .env.local. Empty prefix means "load all vars
  // regardless of prefix" which is what we need to read the unprefixed
  // SENTRY_AUTH_TOKEN / SENTRY_ORG / SENTRY_PROJECT used by the
  // source-map upload plugin below.
  const env = loadEnv(mode, process.cwd(), '')

  // Release name used by both the runtime SDK (Sentry.init({ release }) in
  // main.ts) and the source-map upload plugin (sentryVitePlugin({ release }))
  // below. Both must agree, or uploaded maps don't apply to captured events.
  //
  // Resolution order (highest precedence first):
  //   1. process.env.VITE_APP_VERSION  — CI shell override (e.g., release tag)
  //   2. env.VITE_APP_VERSION          — .env / .env.local file override
  //   3. <pkg.version>+<gitShortSha>   — derived per-build, unique per commit
  //
  // Format <semver>+<sha> follows SemVer build-metadata convention so Sentry
  // sorts releases by version while keeping each build distinct (enables
  // regression detection, suspect-commits, release health).
  const release = process.env.VITE_APP_VERSION || env.VITE_APP_VERSION || (() => {
    let sha = 'unknown'
    try {
      sha = execSync('git rev-parse --short HEAD', {
        stdio: ['ignore', 'pipe', 'ignore'],
      }).toString().trim()
    } catch {
      // Not a git checkout (e.g., source tarball, sandboxed CI). Fall through
      // to "unknown" — Sentry still accepts the release name, just with less
      // commit-level traceability.
    }
    return `${process.env.npm_package_version ?? '0.0.0'}+${sha}`
  })()

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
    plugins.push(domscribe({ overlay: true }))

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
              // Note: urlPattern callbacks are serialized into sw.js, so they
              // cannot reference variables from vite.config scope. Inline the
              // chunk names directly.
              // SYNC: This list must match the chunkNames array at the top of this file.
              // urlPattern callbacks are serialized into sw.js so they cannot reference
              // outer-scope variables — the names must be inlined.
              urlPattern: ({ url }) => ['admin-app', 'owner-app', 'app-core'].some(chunk => url.pathname.includes(chunk)),
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

    // Sentry source-map upload (must be LAST plugin so it sees all built artifacts).
    // Gated on SENTRY_AUTH_TOKEN being set so contributors without ops credentials
    // can still run `pnpm build` without errors. Mirrors the graceful-degradation
    // pattern in main.ts where Sentry.init is gated on VITE_SENTRY_DSN.
    //
    // We use `env` from loadEnv() above, NOT process.env, because Vite does not
    // auto-inject .env.local into Node's process.env — only into the client
    // bundle's import.meta.env. Without loadEnv, this gate is always false on
    // contributor laptops and source maps silently never upload.
    if (env.SENTRY_AUTH_TOKEN) {
      plugins.push(
        sentryVitePlugin({
          org: env.SENTRY_ORG,
          project: env.SENTRY_PROJECT,
          authToken: env.SENTRY_AUTH_TOKEN,
          // Match the runtime release tag in main.ts's Sentry.init({ release })
          // so uploaded artifacts and captured events resolve to the same release.
          // The shared `release` const (computed above) is the single source of
          // truth — also injected via `define` below so the runtime SDK reads
          // the same value at build time.
          release: {
            name: release,
          },
        }),
      )
    }
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
      // Override `import.meta.env.VITE_APP_VERSION` at build time with the
      // computed `release` so Sentry.init in main.ts picks up the same name
      // the source-map plugin uploaded under. Keeps env-file values from
      // silently shadowing the per-build git-derived release.
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(release),
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
      open: false,

      sourcemapIgnoreList: false,
      headers: {
        // Required for the JS Profiling API used by Sentry browserProfilingIntegration.
        // Without this header the browser silently refuses to start the profiler.
        // Must also be set at the CDN/host level for production builds.
        'Document-Policy': 'js-profiling',
      },
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

            // Role-based composables go into dedicated chunks. Pages and
            // smart/dumb components are left to Rollup's natural code-splitting
            // via the router's lazy () => import(...) calls, which avoids
            // circular chunk issues (app ↔ owner-app ↔ app).
            if (
              id.includes('/composables/owner/')
              || id.includes('\\composables\\owner\\')
            ) {
              return 'owner-app'
            }

            if (
              id.includes('/composables/admin/')
              || id.includes('\\composables\\admin\\')
            ) {
              return 'admin-app'
            }
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

            // Don't force remaining modules into a single 'app' chunk.
            // Rollup splits them naturally, which avoids circular TDZ errors
            // (e.g. _export_sfc referenced before initialization).
            return undefined
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
      headers: {
        'Document-Policy': 'js-profiling',
      },
    },
  }
})
