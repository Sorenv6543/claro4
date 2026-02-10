# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant property cleaning scheduler with role-based access. Two distinct interfaces:
- **Owner** (30-40 clients): Personal property/booking management, mobile-optimized
- **Admin** (1 user): System-wide operations, cleaner management, analytics

## Commands

```bash
# Development (http://localhost:3000)
pnpm run dev

# Build
pnpm run build:fast          # Quick build, no type-check
pnpm run build:production    # Full production build
pnpm run build:owner-only    # Owner interface only
pnpm run build:admin-only    # Admin interface only

# Lint (auto-fixes by default via --fix)
pnpm run lint

# Tests
pnpm run test                # Vitest watch mode
pnpm run test:run            # Single run
pnpm run test:coverage       # With coverage
pnpm run test:performance    # Performance regression tests
vitest run src/__tests__/path/to/file.spec.ts  # Run a single test file

# Type checking (part of full build)
vue-tsc --noEmit

# Preview production build
pnpm run preview

# Bundle analysis
pnpm run analyze:bundle
```

## Tech Stack

Vue 3 + TypeScript + Vite, Vuetify 3 (auto-imported), Pinia stores, FullCalendar, Supabase (auth, DB, realtime), PWA via vite-plugin-pwa. Package manager is **pnpm**.

## Environment Variables

Supabase credentials are configured in `.env.local` (not committed). Required vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.

## Architecture

### Role-Based Separation

The core architectural principle is **owner vs. admin separation at every layer**:

- **Composables**: `src/composables/owner/` filters by `owner_id`, `src/composables/admin/` has NO filtering (sees all data). Shared base composables in `src/composables/shared/`.
- **Components**: Smart components (have logic) in `src/components/smart/{owner,admin}/`. Dumb components (props-only, presentational) in `src/components/dumb/{owner,admin,shared}/`.
- **Pages**: `src/pages/owner/` and `src/pages/admin/` with separate layouts.
- **Layouts**: `src/layouts/admin.vue` (sidebar + data loading), `src/layouts/owner.vue` (minimal wrapper), `src/layouts/auth.vue`.

Do NOT create generic components with role props. Create separate role-specific components that use shared dumb components with different data scopes.

### State Management (Map-Based)

All Pinia stores (`src/stores/`) use `Map<string, T>` instead of arrays for O(1) lookups. Filtered views are cached with a 10-second TTL. Use Map methods (`.has()`, `.get()`, `.set()`, `.delete()`) and only convert to arrays when the UI requires it.

### Supabase Integration

- Client configured in `src/plugins/supabase.ts` using PKCE auth flow
- Auth composable: `src/composables/supabase/useSupabaseAuth.ts` (retry logic, fallback profile creation)
- Real-time sync: `src/composables/supabase/useRealtimeSync.ts` (optimistic update deduplication, offline queue)
- RLS policies enforce multi-tenant isolation at the database level (`supabase/migrations/`)
- Private schema functions (`private.is_admin()`, `private.is_owner()`) are SECURITY DEFINER for RLS performance

### Auth Flow

`useSupabaseAuth` composable → wrapped by `src/stores/auth.ts`. The store exposes `isAdmin`, `isOwner`, `isCleaner` computed properties. Route guards exist in `src/router/guards.ts` but are **currently commented out** in the router. Auth initialization uses timeouts (500ms-1000ms) to handle race conditions.

### Turn Booking System

"Turns" are same-day turnovers requiring urgent attention. Business logic in `src/utils/businessLogic.ts` handles priority calculation, cleaning window computation, conflict detection, and status transition rules. Multiple dedicated UI components exist for turn alerts and priority display.

### Build Chunking & Feature Flags

Vite's `manualChunks` in `vite.config.ts` splits output by role: `owner-app`, `admin-app`, `app-core`, plus vendor chunks (`vue-core`, `vuetify`, `calendar`, `vendor`).

Build-time feature flags: `__ENABLE_OWNER_FEATURES__`, `__ENABLE_ADMIN_FEATURES__`, `__DEV_DEMOS_ENABLED__` (true only in dev). The `vue` alias points to `vue/dist/vue.esm-bundler.js` (full build with template compiler).

## Path Aliases

`@` → `src/`, `@components`, `@composables`, `@stores`, `@types`, `@utils`, `@layouts`, `@pages`, `@plugins`, `@assets` — all resolve to their respective `src/` subdirectories. Configured in both `vite.config.ts` and `tsconfig.json`.

## Naming Conventions

- **Owner components**: `Owner` prefix (`OwnerSidebar.vue`, `OwnerCalendar.vue`)
- **Admin components**: `Admin` prefix (`AdminSidebar.vue`, `AdminCalendar.vue`)
- **Shared components**: No prefix (`PropertyCard.vue`, `TurnAlerts.vue`)
- **Owner composables**: `useOwner` prefix (`useOwnerBookings.ts`)
- **Admin composables**: `useAdmin` prefix (`useAdminBookings.ts`)
- **Stores/types/utils**: camelCase filenames

## Testing

- **Framework**: Vitest with happy-dom environment
- **Setup file**: `src/__tests__/setup/setupTests.ts`
- **Test location**: `src/__tests__/` (excluded from TypeScript compilation)
- Tests are excluded from `tsconfig.json` — they have their own config via `vitest.config.ts`

## Routing

Routes use `meta.layout` (`auth`, `owner`, `admin`) and `meta.role` for access control. Navigation guards in `src/router/guards.ts` are **currently commented out** in `src/router/index.ts`. Dev demo routes are under `/dev/admin/*` and only load from `src/dev/demos/`.

Owner routes: `/owner/dashboard`, `/owner/calendar`, `/owner/bookings`, `/owner/properties`, `/owner/profile`
Admin routes: `/admin`, `/admin/schedule`, `/admin/properties`, `/admin/bookings`, `/admin/cleaners`, `/admin/users`, `/admin/reports`, `/admin/property-owners`

## Key Constraints

- Stores use Map collections — do not convert to array-based state
- Owner composables MUST filter by `owner_id`; admin composables MUST NOT filter
- Vuetify components are auto-imported (no manual imports needed)
- PWA plugin only activates in production builds
- `src/dev/` contains demo/testing code excluded from production builds
