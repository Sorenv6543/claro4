# Project Guidelines

## Overview

Multi-tenant property cleaning scheduler (Vue 3 + TypeScript + Vuetify 3 + Supabase). Two interfaces: **Owner** (30-40 clients, personal property/booking management) and **Admin** (1 user, system-wide operations). Project is ~95% complete — maintenance/finalization mode.

## Code Style

- `<script setup lang="ts">` with **type-based** props and emits (not runtime):
  ```ts
  interface Props { bookingId: string; showDetails?: boolean }
  const props = withDefaults(defineProps<Props>(), { showDetails: false })
  const emit = defineEmits<{ (e: 'select', id: string): void }>()
  ```
- Vuetify components are **auto-imported** — never add manual Vuetify imports
- Use `import type` for type-only imports; Use `@/` path aliases (e.g., `@/types`, `@/stores/booking`)
- ESLint: PascalCase component names, `^_` prefix for unused vars, `pnpm run lint` auto-fixes
- TypeScript strict mode, no unused locals/parameters

## Architecture

**Role-based separation is the core principle — owner vs admin at every layer:**

| Layer | Owner (`owner_id` filtered) | Admin (no filtering, sees all) |
|-------|----------------------------|-------------------------------|
| Composables | `src/composables/owner/` | `src/composables/admin/` |
| Smart components | `src/components/smart/owner/` | `src/components/smart/admin/` |
| Dumb components | `src/components/dumb/owner/` | `src/components/dumb/admin/` |
| Pages | `src/pages/owner/` | `src/pages/admin/` |
| Layouts | `src/layouts/owner.vue` | `src/layouts/admin.vue` |

Shared code lives in `composables/shared/`, `components/dumb/shared/`, `src/utils/`. **Never** create components with role props — create separate role-specific components using shared dumb components.

**Pinia stores** (`src/stores/`) use **Map<string, T>** for O(1) lookups, not arrays. 10-second cache TTL pattern. Convert to arrays only for UI rendering.

**Component organization**: `smart/` = orchestration + store/composable access; `dumb/` = props + emits only, no stores.

**Supabase**: PKCE auth, RLS enforces multi-tenancy, private schema security functions (`private.is_admin()`, `private.is_owner()`). Client in `src/plugins/supabase.ts`.

## Build and Test

```bash
pnpm run dev              # Dev server at localhost:3000
pnpm run build:fast       # Quick build (no type-check)
pnpm run build            # Full build with vue-tsc type-check
pnpm run lint             # ESLint with auto-fix
pnpm run test:run         # Vitest single run (happy-dom)
pnpm run test             # Vitest watch mode
pnpm run test:coverage    # With v8 coverage
```

Test pattern — always `setActivePinia(createPinia())` in `beforeEach`:
```ts
import { setActivePinia, createPinia } from 'pinia'
import { useBookingStore } from '@/stores/booking'
describe('Store', () => {
  beforeEach(() => { setActivePinia(createPinia()) })
  it('works', () => { expect(useBookingStore().bookings.size).toBe(0) })
})
```

Supabase is globally mocked in `src/__tests__/setup/setupTests.ts`. Tests use `vitest` globals (no imports needed for `describe`/`it`/`expect`).

## Project Conventions

**Naming**: Owner prefix (`OwnerSidebar`, `useOwnerBookings`), Admin prefix (`AdminSidebar`, `useAdminBookings`), no prefix for shared.

**Types**: Defined in `src/types/` with barrel export from `index.ts`. Every domain type has a Map alias (`BookingMap = Map<string, Booking>`). String union types for enums (`BookingStatus`, `UserRole`).

**Business logic**: Pure functions in `src/utils/businessLogic.ts` — no store access. "Turns" are same-day turnovers, always high priority.

**Routes**: Lazy-loaded, `meta.layout` selects layout ('auth' | 'owner' | 'admin'), `meta.role` for guards. Route guards exist in `src/router/guards.ts` but are currently commented out.

**Build chunking**: `vite.config.ts` splits by role (`owner-app`, `admin-app`, `app-core`) plus vendor chunks. Feature flags: `__ENABLE_OWNER_FEATURES__`, `__ENABLE_ADMIN_FEATURES__`, `__DEV_DEMOS_ENABLED__`.

**Package manager**: **pnpm** exclusively — never use npm or yarn.

## Safe Modification Zones

- Demo components: `src/dev/demos/`
- Documentation: `docs/`
- Tests: `src/__tests__/`
- Minor TypeScript fixes, performance improvements
- New dumb/shared components

**Avoid modifying** without careful consideration: core stores (`src/stores/`), auth flow, RLS policies, Supabase schema, build chunking config.

## Environment

Supabase credentials in `.env.local` (not committed): `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Vue alias points to `vue/dist/vue.esm-bundler.js` (full build with template compiler).
