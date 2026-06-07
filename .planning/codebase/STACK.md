# Technology Stack

**Analysis Date:** 2026-03-09

## Languages

**Primary:**
- TypeScript 6.0.3 - Used for entire application logic, types, and build scripts.

**Secondary:**
- SCSS/SASS - Used for component styling and Vuetify theme customization.
- SQL - Used for Supabase migrations and database logic.

## Runtime

**Environment:**
- Node.js 18+ (inferred from Vite 8 usage)

**Package Manager:**
- pnpm 10.32.1
- Lockfile: `pnpm-lock.yaml` present

## Frameworks

**Core:**
- Vue 3.5.35 - Composition API used for all UI components.
- Vuetify 4.0.7 - Primary UI framework and Material Design component library.

**Testing:**
- Vitest 4.1.7 - Unit and component testing.
- Playwright 1.59.1 - End-to-end testing.

**Build/Dev:**
- Vite 8.0.14 - Build tool and development server.
- Vue TSC 3.2.8 - Type checking for Vue files.

## Key Dependencies

**Critical:**
- @supabase/supabase-js 2.106.2 - Primary backend integration (Auth, DB, Realtime).
- pinia 3.0.4 - State management.
- @fullcalendar/vue3 6.1.20 - Calendar views for bookings.
- vue-router 5.1.0 - Navigation and role-based routing.

**Infrastructure:**
- @sentry/vue 10.55.0 - Error tracking and performance profiling.
- vite-plugin-pwa 1.2.0 - Progressive Web App support.

## Configuration

**Environment:**
- Configured via `.env` files (e.g., `.env`, `.env.local`).
- Key configs: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_SENTRY_DSN`.

**Build:**
- `vite.config.ts` - Main build and plugin configuration.
- `tsconfig.json` - TypeScript configuration.
- `supabase/config.toml` - Supabase local development config.

## Platform Requirements

**Development:**
- Node.js, pnpm, and Supabase CLI.

**Production:**
- Vercel (indicated by `vercel.json` and `.vercel/`).
- Supabase Cloud.

---

*Stack analysis: 2026-03-09*
