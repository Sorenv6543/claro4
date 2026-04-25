import * as Sentry from '@sentry/vue'
import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from '@/App.vue'
import vuetify from '@/plugins/vuetify'
import router from '@/router'

import '@/styles/calendar-tokens.css'
import './styles/main.scss'

// Early preconnect to Supabase for faster API calls
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
if (supabaseUrl && !document.querySelector(`link[rel="preconnect"][href="${supabaseUrl}"]`)) {
  const link = document.createElement('link')
  link.rel = 'preconnect'
  link.href = supabaseUrl
  document.head.append(link)
}

const app = createApp(App)

// Sentry: initialize before other plugins so any init-time errors are captured.
// Graceful degradation — without VITE_SENTRY_DSN set, Sentry init is skipped
// and captureException calls become no-ops. The codebase ships with the wiring
// in place; ops activates by setting the DSN env var.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN
if (sentryDsn) {
  Sentry.init({
    app,
    dsn: sentryDsn,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION,
    // Conservative default — operators can tune via env var later
    tracesSampleRate: Number(import.meta.env.VITE_SENTRY_TRACES_SAMPLE_RATE ?? 0.1),
    // The `app` parameter above wires Sentry's default Vue integration,
    // which hooks into app.config.errorHandler for unhandled template/render
    // errors. Component-level tracking can be enabled later via
    // `integrations: [Sentry.vueIntegration({ tracingOptions: { trackComponents: true } })]`
    // if/when component-name resolution becomes useful in Sentry traces.
  })
} else if (import.meta.env.DEV) {
  // Dev-only one-shot console hint so the operator knows reporting is off.
  // Not logged in production builds — too noisy for users without DSNs configured.
  console.info('[Sentry] VITE_SENTRY_DSN not set — error reporting disabled.')
}

app.use(vuetify)
app.use(createPinia())
app.use(router)

app.mount('#app')
