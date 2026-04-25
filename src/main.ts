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
    integrations: [
      // Browser tracing instruments page-load and navigation transactions.
      // Passing `router` wires Vue Router's beforeEach/afterEach hooks so
      // each route change creates a transaction with `routing.instrumentation`
      // = vue-router and the route name as the transaction title.
      // Without this, tracesSampleRate above is meaningless — there are
      // no transactions to sample.
      Sentry.browserTracingIntegration({ router }),
      // Session Replay — captures DOM mutations + user interactions in a
      // rolling buffer; on error, the buffer is uploaded so you can replay
      // what the user did right before the crash.
      //
      // Privacy defaults: ALL text is masked (booking notes, owner names,
      // dates rendered as text) and ALL media is blocked (avatars, photos).
      // The replay shows DOM structure, click sequence, and form
      // interactions, but never readable user data. Suitable for B2B SaaS
      // with compliance requirements (GDPR/CCPA).
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Session Replay sample rates — see replayIntegration above.
    // - replaysSessionSampleRate: record N% of all sessions (UX trend visibility)
    // - replaysOnErrorSampleRate: record 100% of error sessions (root-cause debugging)
    // The on-error rate operates on a rolling buffer: the SDK always keeps
    // the last 30s of activity in memory and only uploads when an error fires.
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Distributed tracing: which outgoing fetch URLs receive the
    // `sentry-trace` and `baggage` headers that connect frontend
    // transactions to backend spans. Default behavior would attach
    // them to all same-origin requests, which can leak trace headers
    // to third-party endpoints that don't accept them.
    //
    // Allowlisted: localhost (dev API), Supabase REST + Auth endpoints
    // (since both are first-party for our app's data).
    tracePropagationTargets: [
      'localhost',
      /^https:\/\/[\w-]+\.supabase\.co\/rest\/v1/,
      /^https:\/\/[\w-]+\.supabase\.co\/auth\/v1/,
    ],
    // The `app` parameter above wires Sentry's default Vue integration,
    // which hooks into app.config.errorHandler for unhandled template/render
    // errors. Component-level tracking can be enabled later via
    // `Sentry.vueIntegration({ tracingOptions: { trackComponents: true } })`
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
