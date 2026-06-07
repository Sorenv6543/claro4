# External Integrations

**Analysis Date:** 2026-03-09

## APIs & External Services

**Backend as a Service:**
- Supabase - Authentication, PostgreSQL database, Realtime subscriptions, and Edge Functions.
  - SDK/Client: `@supabase/supabase-js`
  - Auth: `VITE_SUPABASE_ANON_KEY`

**Monitoring:**
- Sentry - Error tracking, session replay, and performance profiling.
  - SDK/Client: `@sentry/vue`
  - Auth: `SENTRY_AUTH_TOKEN` (build-time)

## Data Storage

**Databases:**
- PostgreSQL (via Supabase)
  - Connection: `VITE_SUPABASE_URL`
  - Client: `@supabase/supabase-js`

**File Storage:**
- Supabase Storage (likely used for property photos/avatars, though not explicitly detailed in `main.ts`).

**Caching:**
- Browser LocalStorage (via Pinia persistence or custom logic).
- Service Worker (Workbox) for asset and API response caching.

## Authentication & Identity

**Auth Provider:**
- Supabase Auth
  - Implementation: Role-based access control (Admin/Owner) managed via Supabase user metadata and RLS (Row Level Security).

## Monitoring & Observability

**Error Tracking:**
- Sentry integration in `src/main.ts`.

**Logs:**
- Sentry Console Logging integration for warnings and errors.
- Supabase Edge Function logs.

## CI/CD & Deployment

**Hosting:**
- Vercel (Production/Preview)
- Supabase (Database/Auth/Functions)

**CI Pipeline:**
- GitHub Actions (defined in `.github/workflows/`).

## Environment Configuration

**Required env vars:**
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SENTRY_DSN`

**Secrets location:**
- GitHub Actions Secrets and Vercel Environment Variables.

## Webhooks & Callbacks

**Incoming:**
- Supabase Realtime - Listens for database changes to update the UI (e.g., new bookings).

**Outgoing:**
- Sentry event ingestion.
- Push Notifications (via Service Worker / `usePushNotifications.ts`).

---

*Integration audit: 2026-03-09*
