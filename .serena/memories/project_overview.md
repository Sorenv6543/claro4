# Project Overview

**Name**: property-cleaning-scheduler (claro4)
**Purpose**: Multi-tenant property cleaning scheduler with role-based access.

## Two Interfaces
- **Owner** (30-40 clients): Personal property/booking management, mobile-optimized
- **Admin** (1 user): System-wide operations, cleaner management, analytics

## Tech Stack
- Vue 3 + TypeScript + Vite
- Vuetify 3 (auto-imported components)
- Pinia stores (Map-based, not arrays)
- FullCalendar for scheduling
- Supabase (auth, DB, realtime) with PKCE auth flow
- PWA via vite-plugin-pwa
- Package manager: pnpm

## Key Architecture
- Owner vs admin separation at every layer (composables, components, pages, layouts)
- Stores use Map<string, T> for O(1) lookups with 10s TTL cached filtered views
- RLS policies enforce multi-tenant isolation at DB level
- Turns = same-day turnovers with priority calculation and conflict detection
- Build-time feature flags: __ENABLE_OWNER_FEATURES__, __ENABLE_ADMIN_FEATURES__, __DEV_DEMOS_ENABLED__

## Project Structure
src/
  components/smart/{owner,admin}/ - Smart components (have logic)
  components/dumb/{owner,admin,shared}/ - Dumb components (presentational)
  composables/{owner,admin,shared}/ - Role-scoped composables
  composables/supabase/ - Supabase integration
  pages/{owner,admin}/ - Route pages
  layouts/ - admin.vue, owner.vue, auth.vue
  stores/ - Pinia stores (Map-based)
  types/ - TypeScript types
  utils/ - Utilities including businessLogic.ts
  plugins/ - Supabase client config
  router/ - Routes and guards
  dev/ - Demo/testing code (excluded from production)
  __tests__/ - Vitest tests
