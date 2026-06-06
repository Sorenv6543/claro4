# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant property cleaning scheduler with role-based Owner/Admin UI. Core product: guest-stay booking plus cleaning operations. Tech stack: Vue 3 + Vite + Vuetify 4, Pinia for state, Supabase for auth/Postgres/RLS/realtime. FullCalendar for scheduling views.

Three user roles: **Property Owners** (30-40 clients with personal property/booking management), **Business Admin** (1 user with system-wide operations and cleaner management), and **Cleaners** (assigned staff — auto-redirected to `/auth/no-access` on login; no app UI).

## Chrome DevTools Workflow

After `/openchrome` completes, always open two tabs in the debug Chrome:
1. `chrome://inspect` — remote debugging panel
2. `http://localhost:3000/` — the app (start dev server first with `pnpm dev` if not running)

Never open a second Chrome instance after `/openchrome` has already launched one.

## Commands

```bash
# Development
pnpm dev                    # Start dev server (with --host)

# Testing
pnpm test                   # Run tests in watch mode
pnpm test:run               # Run tests once
pnpm test -- path/to/file   # Run single test file
pnpm test:ui                # Open Vitest browser UI
pnpm test:coverage          # Run with coverage
pnpm test:performance       # Performance regression tests

# Building
pnpm build                  # Full production build (runs vue-tsc --noEmit first)
pnpm build:fast             # Skip type checking for quick iteration
pnpm build:owner-only       # Owner-only bundle
pnpm build:admin-only       # Admin-only bundle

# Linting
pnpm lint                   # ESLint with auto-fix

# Analysis
pnpm analyze:bundle         # Bundle size analysis
pnpm check:bundle           # Check bundle against size budgets
pnpm perf:analysis          # Performance analysis (bundle + regression tests)
```

## Architecture

### Smart vs Dumb Components
- **Smart components** (`src/components/smart/`): Data-aware, orchestration logic, depend on stores/composables
- **Dumb components** (`src/components/dumb/`): Pure UI, receive props and emit events only

### Role Separation

Owner and Admin have separate component trees throughout:
- `src/components/smart/{admin,owner,shared}/`
- `src/components/dumb/{admin,owner,shared}/`
- `src/pages/{admin,owner,auth}/`
- `src/composables/{owner,admin,shared,supabase}/`
- `src/layouts/{admin,owner,auth,default,bare}.vue`

### State Management

- Domain stores in `src/stores/`: `auth.ts`, `booking.ts`, `property.ts`, `ui.ts`, `user.ts`
- Stores use `Map` collections with cached filtered Maps (TTL-based invalidation) for O(1) access
- Optimistic updates with rollback on failure
- Prefer derived computeds over cloning arrays
- Business logic lives in `src/utils/`, not in stores

### Composables Organization

- `src/composables/owner/` - Owner-specific: `useOwnerBookings`, `useOwnerProperties`, `useOwnerCalendarState`, `useOwnerErrorHandler`
- `src/composables/admin/` - Admin-specific: `useAdminBookings`, `useCleanerManagement`, `useAdminProperties`, `useAdminUserManagement`, `useAdminCalendarState`, `useAdminErrorHandler`, `useTimeAwareMode`
- `src/composables/shared/` - Cross-cutting: `useAuth`, `useCalendarState`, `useCachedComputed`, `useComponentEventLogger`, `useErrorHandler`, `useLoadingState`, `usePerformanceMonitor`, `usePWA`, `usePushNotifications`, `useResponsiveLayout`, `useSwipeNavigation`, `useToday`
- `src/composables/supabase/` - Supabase integration: `useSupabaseAuth`, `useSupabaseBookings`, `useSupabaseProperties`, `useRealtimeSync`, `useSupabaseCleanerTeams`, `useSupabaseUserProfiles`
- Reuse existing composables before adding new Supabase calls
- `useOwnerProperties()` returns `myProperties` (not `properties`): `const { myProperties } = useOwnerProperties()`
- `useToday()` returns `{ todayStr, weekAhead, fortAhead, todayLabel }` — use instead of `new Date()` in components so date reactively updates at midnight
- `useTimeAwareMode()` returns `isEveningMode` (true after 16:00) — admin overview switches label to "Tomorrow's Prep" after this threshold

### Key Utilities

- `src/utils/businessLogic.ts` - Booking/cleaning rules, priority calculation, conflict detection (see `claro4-business-logic` skill for API reference)
- `src/utils/authHelpers.ts` - Auth helpers including `getDefaultRouteForRole`
- `src/utils/constants.ts` - Application constants
- `src/utils/errorMessages.ts` - Centralized error messages
- `src/utils/typeHelpers.ts` - TypeScript type helpers (`safeDate`, `safeString`, `safeBookingField`)
- `src/utils/cachedMapFilter.ts` - Reusable TTL-based cache for store Map computeds (`createMapCache`)
- `src/utils/calendarHelpers.ts` - Booking → FullCalendar event conversion (`bookingToCalendarEvent`)
- `src/utils/mobileViewport.ts` - Dynamic viewport height calculations for mobile devices
- `src/utils/propertyStatus.ts` - Property status derivation helpers

### Path Aliases
Configured in both `vite.config.ts` and `tsconfig.json`:

- `@` → `./src`
- `@components`, `@composables`, `@stores`, `@types`, `@utils`, `@layouts`, `@pages`, `@plugins`, `@assets`

## Domain Rules

### Booking Model
- Guest-stay model: `checkin_date` = guest arrival, `checkout_date` = guest departure
- `checkout_date` must be **on or after** `checkin_date` (same day is valid for turn bookings)
- `booking_type === 'turn'`: Same-day short stays; validated via `validateTurnBooking`
- Priority: Use `calculateBookingPriority` — turn bookings are always at least `high`
- Conflicts: Use `detectBookingConflicts` and `validateBooking` instead of ad-hoc date math
- Adjacent bookings (one checkout == another checkin) do **not** conflict

### Cleaning Tasks
- `getCleaningWindow` / `canScheduleCleaning` in businessLogic.ts are deprecated

### Time Validation
Standard vacation rental defaults hardcoded in form components (e.g. `AdminBookingForm.vue`):
- `checkout_time: '11:00'` — 11:00 AM checkout; `checkin_time: '15:00'` — 3:00 PM checkin
- Property-specific overrides take precedence; for turn bookings checkout_time must be after checkin_time
- Warn if checkout > 14:00 or checkin < 14:00 (tight cleaning window)

## Auth & Routing

```typescript
// In components - always use store computeds, never create separate auth refs
import { useAuthStore } from '@stores/auth'
const auth = useAuthStore()
const { isAuthenticated, isOwner, isAdmin, user, session } = auth

// Post-login redirect
import { getDefaultRouteForRole } from '@utils/authHelpers'
router.push(getDefaultRouteForRole(user.value?.role))
// 'owner' → '/owner/overview' | 'admin' → '/admin' | else → '/'

// Route definition with guards
{ path: '/owner/dashboard', component: OwnerDashboard, meta: { requiresAuth: true, role: 'owner' } }
// Guards in src/router/guards.ts enforce meta.requiresAuth and meta.role automatically
```

- `useAuthStore` in `src/stores/auth.ts` delegates to `useSupabaseAuth` outside test mode
- Layout selection: `App.vue` reads `route.meta.layout` → owner routes use `meta: { layout: 'owner' }`, admin → `'admin'`, dev/demo → `'bare'`

## Supabase Integration

- Client configured in `src/plugins/supabase.ts`
- Requires `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local`
- Schema and RLS policies in `supabase/migrations/`
- New queries/mutations go in role-aware composables under `src/composables/`

```typescript
// Real-time subscription pattern in composables
onMounted(() => {
  const channel = supabase
    .channel('bookings_changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings',
      filter: `owner_id=eq.${user.value?.id}` }, (payload) => { handleRealtimeUpdate(payload) })
    .subscribe()
  onUnmounted(() => { supabase.removeChannel(channel) })
})
```

## PWA

- **App name**: "Property Cleaning Scheduler" / short name "Claro"; manifest: `public/manifest.webmanifest`
- **Service Worker**: Workbox, auto-update with `skipWaiting` + `clientsClaim`
- **Caching**: StaleWhileRevalidate for role chunks (50/30d), NetworkFirst for API (100/24h/3s), CacheFirst for images (60/30d)
- **Composables**: `usePWA`, `usePushNotifications`; **Component**: `PWANotificationsEnhanced.vue` in `src/components/dumb/shared/`
- **Scripts**: `pnpm build:pwa`, `pnpm test:pwa`, `pnpm analyze:pwa`

## Performance

- Stores use `Map`-based collections with cached filtered Maps (10s TTL)
- Use computed helpers like `getUpcomingBookings` / `getUrgentTurns` from businessLogic.ts
- Track subscriptions with `usePerformanceMonitor` from `src/composables/shared/usePerformanceMonitor.ts`
- Clean up subscriptions on unmount to keep performance tests green
- Run `pnpm test:performance` after significant data flow changes

## Testing

- Test environment: `happy-dom` (configured in `vitest.config.ts`)
- Global Supabase mock is set up in `src/__tests__/setup/setupTests.ts` — `supabase.from()` returns a chainable mock builder; override per-test with `vi.mocked(supabase.from).mockReturnValueOnce(...)`
- CSS imports and browser globals (`ResizeObserver`, `matchMedia`) are also mocked in setup
- Vitest aliases mirror the vite path aliases — use `@/` imports freely in tests

## Design Tokens

Two non-overlapping sources of truth:

| File | Owns |
|------|------|
| `src/plugins/vuetify.ts` | All color hex values (light + dark themes) |
| `src/styles/tokens.css` | Spacing, typography, radii, motion, shadows, layout + CSS aliases for colors |

Color aliases in `tokens.css` use `rgb(var(--v-theme-*))` — edit hex values in `vuetify.ts` only. Components continue using `var(--claro-*)` unchanged; the aliases resolve through Vuetify's theme vars at runtime. Non-color tokens (spacing, radii, motion, shadows) have no Vuetify equivalent and live in `tokens.css` exclusively.

## Vuetify UI/UX

Use the **`claro4-vuetify` skill** for: component defaults, elevation rules, v-card variants, transitions, loading/empty/error states, responsive patterns, form validation, existing component list, and the Vuetify MCP/reference workflow.

**Two critical rules always in effect:**
- Radius rule: all components use `rounded="sm"` (2px) except buttons/chips/badges (pill)
- Never add raw CSS `box-shadow` to individual components — cards use global `--claro-shadow-sm`, others use `elevation` prop

## Fixing Type Errors

Use the **`claro4-typescript` skill** for the full error pattern table, type location reference, and Supabase-to-app type mapping.

## ESLint Rules
- Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:vue/vue3-recommended`
- Parser: `@typescript-eslint/parser` within `vue-eslint-parser` for `<script>` blocks
- Plugins: `@typescript-eslint`, `vue`

## Critical Files

Extend existing patterns rather than refactoring:
- `src/components/smart/` — Working role-based components
- `src/composables/` — Performance-optimized logic
- `src/stores/` — Role-based state management with Map caching
- `src/router/` — Authentication and role guards
- `vite.config.ts` — Build optimization and chunking settings

## Gotchas

- Strict TypeScript: `pnpm build` runs `vue-tsc --noEmit`; keep `src/types/` in sync with Supabase migrations
- Property colors are user-selectable: `PROPERTY_COLORS` in `src/utils/constants.ts` (5 hex values). New properties auto-cycle via `PROPERTY_COLORS[existingPropertyCount % PROPERTY_COLORS.length]`
- Don't duplicate business rules in components — call helpers in `businessLogic.ts`
- Before finishing changes: run `pnpm test:run` and `pnpm build`
- For auth/routing or subscription changes: also run `pnpm test:performance`
- Build flags `__ENABLE_OWNER_FEATURES__` and `__ENABLE_ADMIN_FEATURES__` control role-specific code inclusion
- Vite chunk strategy: `vue-core`, `vuetify`, `calendar`, `supabase`, `vendor`, `app-core`, `owner-app`, `admin-app`
- CSS custom property `--app-bar-height` (from `src/styles/responsive.scss`) — use `var(--app-bar-height, 64px)` instead of hardcoding `64px`
