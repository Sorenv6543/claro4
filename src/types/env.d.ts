/// <reference types="vite/client" />

// Declare Vue modules to fix TypeScript import errors
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SENTRY_DSN?: string
  readonly VITE_SENTRY_TRACES_SAMPLE_RATE?: string
  readonly VITE_APP_VERSION?: string
  readonly VITE_DEBUG_AUTH?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
