# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant property cleaning scheduler with role-based Owner/Admin UI. Core product: guest-stay booking plus cleaning operations. Tech stack: Vue 3 + Vite + Vuetify 4, Pinia for state, Supabase for auth/Postgres/RLS/realtime. FullCalendar for scheduling views.

Two user types: **Property Owners** (30-40 clients with personal property/booking management) and **Business Admin** (1 user with system-wide operations and cleaner management).

## Commands

```bash
# Development
pnpm dev                    # Start dev server (with --host)

# Testing
pnpm test                   # Run tests in watch mode
pnpm test:run               # Run tests once
pnpm test -- path/to/file   # Run single test file
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

- `src/composables/owner/` - Owner-specific data access (useOwnerBookings, useOwnerProperties, etc.)
- `src/composables/admin/` - Admin-specific data access (useAdminBookings, useCleanerManagement, useAdminProperties, useAdminUserManagement, useTimeAwareMode, etc.)
- `src/composables/shared/` - Cross-cutting concerns (useCalendarState, usePerformanceMonitor, usePWA, useResponsiveLayout, useSwipeNavigation, usePushNotifications, etc.)
- `src/composables/supabase/` - Supabase integration (useSupabaseAuth, useSupabaseBookings, useSupabaseProperties, useRealtimeSync)
- Reuse existing composables before adding new Supabase calls
- `useOwnerProperties()` returns `myProperties` (not `properties`): `const { myProperties } = useOwnerProperties()`

### Key Utilities

- `src/utils/businessLogic.ts` - Booking/cleaning rules, priority calculation, conflict detection
- `src/utils/authHelpers.ts` - Auth helpers including `getDefaultRouteForRole`
- `src/utils/constants.ts` - Application constants
- `src/utils/errorMessages.ts` - Centralized error messages
- `src/utils/typeHelpers.ts` - TypeScript type helper utilities (`safeDate`, `safeString`, `safeBookingField`)
- `src/utils/cachedMapFilter.ts` - Reusable TTL-based cache for store Map computeds (`createMapCache`)
- `src/utils/calendarHelpers.ts` - Booking → FullCalendar event conversion (`bookingToCalendarEvent`)
- `src/utils/mobileViewport.ts` - Dynamic viewport height calculations for mobile devices (safe area, available height)

```typescript
// Business logic helpers - use these, never reimplement ad-hoc date math
import { validateBooking, calculateBookingPriority, detectBookingConflicts } from '@utils/businessLogic'

const result = validateBooking(bookingData, property, existingBookings)
// → { valid: boolean, errors: string[], warnings: string[], conflicts?: Booking[] }
if (!result.valid) { /* show result.errors */ }

const priority = calculateBookingPriority(booking)
// → 'low' | 'normal' | 'high' | 'urgent'  (turns are always at least 'high')

const conflicts = detectBookingConflicts(booking, allPropertyBookings)
// → Booking[] of overlapping bookings for same property

// Status transition helpers
import { getAvailableStatusTransitions, canTransitionBookingStatus } from '@utils/businessLogic'
const nextStatuses = getAvailableStatusTransitions(booking)
// → BookingStatus[] of valid next states

// Filtering & querying
import { filterBookingsByDateRange, getRecentBookings, getUrgentTurns, getUpcomingBookings } from '@utils/businessLogic'

// System metrics
import { calculateSystemMetrics } from '@utils/businessLogic'
// → Aggregate metrics across properties and bookings

// Assignment updates
import { buildAssignmentUpdate } from '@utils/businessLogic'
// → Build cleaner assignment update payloads (multiple overloads)

// Property deactivation guard
import { canDeactivateProperty } from '@utils/businessLogic'
// → Check if property has active bookings before deactivating
```

### Path Aliases
Configured in both `vite.config.ts` and `tsconfig.json`:
- `@` → `./src`
- `@components`, `@composables`, `@stores`, `@types`, `@utils`, `@layouts`, `@pages`, `@plugins`, `@assets`

## Domain Rules

### Booking Model
- Guest-stay model: `checkin_date` = guest arrival, `checkout_date` = guest departure
- `checkout_date` must be **on or after** `checkin_date` (same day is valid for turn bookings)
- `booking_type === 'turn'`: Same-day short stays; validated via `validateTurnBooking`
- Priority: Use `calculateBookingPriority` - turn bookings are always at least `high`
- Conflicts: Use `detectBookingConflicts` and `validateBooking` instead of ad-hoc date math
- Adjacent bookings (one checkout == another checkin) do **not** conflict

```typescript
// Turn booking validation
import { validateTurnBooking } from '@utils/businessLogic'
const { valid, errors, warnings } = validateTurnBooking(bookingData, property)
// Turn rules: checkout and checkin must be on the same calendar day;
// checkout_time must be after checkin_time; warns on late checkout (>14:00) or early checkin (<14:00)
```

### Cleaning Tasks
- `getCleaningWindow` / `canScheduleCleaning` in businessLogic.ts are deprecated

### Time Validation
Standard vacation rental defaults used in booking forms; these are currently hardcoded in components (e.g. `AdminBookingForm.vue`) rather than defined as named constants:

```typescript
// Standard vacation rental defaults (hardcoded in form components)
// checkout_time: '11:00'   — 11:00 AM checkout (guests depart)
// checkin_time:  '15:00'   — 3:00 PM checkin (guests arrive)

// Property-specific overrides take precedence when available
// For same-day (turn) bookings: checkout_time must be after checkin_time
// Warn if checkout > 14:00 or checkin < 14:00 (tight cleaning window)
```

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
```

```typescript
// Route definition with guards
{
  path: '/owner/dashboard',
  component: OwnerDashboard,
  meta: { requiresAuth: true, role: 'owner' }
}
// Guards in src/router/guards.ts enforce meta.requiresAuth and meta.role automatically
```

### Auth Source of Truth
- `useAuthStore` in `src/stores/auth.ts` delegates to `useSupabaseAuth` outside test mode
- Derive auth state via store computeds: `isAuthenticated`, `isOwner`, `isAdmin`, `user`, `session`
- Don't create separate refs for auth in components

### Route Protection
- Guards in `src/router/guards.ts` and `src/router/index.ts`
- Use `meta.requiresAuth` / `meta.role` on routes
- `getDefaultRouteForRole` handles post-login redirects
- Layout selection: `App.vue` reads `route.meta.layout` and renders `src/layouts/{name}.vue` — owner routes use `meta: { layout: 'owner' }`, admin routes use `meta: { layout: 'admin' }`, dev/demo routes use `meta: { layout: 'bare' }`

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
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'bookings',
      filter: `owner_id=eq.${user.value?.id}`
    }, (payload) => {
      handleRealtimeUpdate(payload)
    })
    .subscribe()

  onUnmounted(() => {
    supabase.removeChannel(channel)
  })
})
```

## PWA

The app is a Progressive Web App configured via `vite-plugin-pwa` (production builds only):
- **App name**: "Property Cleaning Scheduler" / short name "Claro"
- **Manifest**: `public/manifest.webmanifest` — standalone display, theme color `#1976d2`
- **Service Worker**: Workbox-powered, auto-update with `skipWaiting` + `clientsClaim`
- **Caching strategies**: StaleWhileRevalidate for role-based chunks (50 entries, 30-day), NetworkFirst for API (100 entries, 24h, 3s timeout), CacheFirst for images (60 entries, 30-day)
- **Composables**: `usePWA` (install/update lifecycle), `usePushNotifications` (push notification handling)
- **Components**: `PWANotifications.vue`, `PWANotificationsEnhanced.vue`, `PWAStatusCard.vue` in `src/components/dumb/shared/`
- **Icons**: `public/pwa-icon.svg` source, generated at 192×192 and 512×512 (standard + maskable)
- **PWA-specific scripts**: `pnpm build:pwa`, `pnpm test:pwa`, `pnpm analyze:pwa`

## Performance

- Stores use `Map`-based collections with cached filtered Maps (10s TTL)
- Use computed helpers like `getUpcomingBookings` / `getUrgentTurns` from businessLogic.ts
- Track subscriptions with `usePerformanceMonitor` from `src/composables/shared/usePerformanceMonitor.ts`
- Clean up subscriptions on unmount to keep performance tests green
- Run `pnpm test:performance` after significant data flow changes

## Vuetify UI/UX Patterns

### Setup
- **Version**: Vuetify 4 (`^4.0.1`) with `vite-plugin-vuetify` for auto-imports; components are auto-imported (no manual import needed)
- **Icons**: MDI (`mdi-*`) via `@mdi/font`
- **Config**: `src/plugins/vuetify.ts` - theme colors, component defaults, breakpoints

### Component Defaults (already configured globally)
Don't override these unless necessary:
- `VBtn`: `variant="flat"`, `rounded`, no uppercase
- `VCard`: `elevation="0"`, `rounded` (global `box-shadow: var(--claro-shadow-sm)` in `main.scss` provides baseline shadow)
- `VTextField`, `VSelect`, `VTextarea`, `VAutocomplete`, `VCombobox`: `variant="outlined"`, `density="comfortable"`, `rounded="lg"`, `hideDetails="auto"`
- `VDialog`: `max-width="700px"`, `rounded="lg"`
- `VAlert`: `variant="tonal"`, `rounded="lg"`
- `VChip/VBadge`: `rounded="pill"`

### Elevation = Hierarchy
All `v-card` components receive a baseline `box-shadow: var(--claro-shadow-sm)` via `main.scss` (Materio flat style). This overrides Vuetify's elevation system for cards specifically. For non-card components, use the `elevation` prop (0–24). NEVER add raw CSS `box-shadow` to individual components (except hover effects).

| Role | Elevation | Examples |
|------|-----------|----------|
| Page background | 0 | `v-main`, `v-container` |
| Grouped/nested content | 1–2 | Secondary cards inside a layout |
| Primary content card | 2–4 | Booking cards, property cards |
| Floating action / popover | 6–8 | FABs, menus, popovers |
| Modal / dialog | 12–16 | `v-dialog`, `v-bottom-sheet` |

### v-card Variant Selection
Don't default every card to `elevated` — select by purpose:

| Variant | When to use |
|---------|-------------|
| `elevated` | Primary content — bookings, properties, dashboard widgets |
| `tonal` | Secondary info — stats, role badges, status indicators |
| `outlined` | Form sections, non-interactive containers, settings groups |
| `flat` | Nested inside another card, subtle visual grouping |
| `text` | Inline links, minimal action areas |

### Transitions
Wrap conditional content in Vuetify transition components. Never use raw CSS transitions for show/hide when a Vuetify transition exists:
- `v-fade-transition` — dialogs, overlays, content swaps, loading states
- `v-expand-transition` — collapsible panels, accordion cards, detail reveals
- `v-slide-x-transition` — list insertions, drawer reveals, horizontal navigation
- `v-slide-y-transition` — dropdown menus, vertical reveals
- `v-scale-transition` — FABs appearing, chips being added, badge pops

### Loading, Empty, and Error States
Every data-dependent component MUST handle all three:
- **Loading**: `v-skeleton-loader` with `type` strings (e.g. `type="card, list-item-three-line@3"`). Use existing `SkeletonLoader.vue` if applicable.
- **Empty**: `v-empty-state` (Vuetify 4 native) with icon, title, text, and an action slot
- **Error**: Use existing `ErrorAlert.vue` from `src/components/dumb/shared/`

### Notification Patterns
- `v-snackbar` — transient feedback (saved, deleted, synced) — auto-dismiss 4–6s. Use existing `EnhancedToast.vue`.
- `v-banner` — persistent info (offline notice, trial expiry) — user must dismiss
- `v-bottom-sheet` — contextual action menus on mobile

### Responsive Patterns
Use `useDisplay` from Vuetify for breakpoint-aware layouts. Never use CSS media queries for layout decisions Vuetify can handle reactively.

```ts
import { useDisplay } from 'vuetify'
const { mobile, mdAndUp, lgAndUp, smAndDown } = useDisplay()
```

Key patterns:
- **Nav drawer**: `:permanent="mdAndUp"` / `:temporary="!mdAndUp"`
- **Bottom sheet on mobile, dialog on desktop**: `v-bottom-sheet v-if="mobile"` / `v-dialog v-else`
- **Responsive grid**: `cols="12" sm="6" lg="4"` — never nest `v-row` more than 2 levels deep
- **Data table → card list on mobile**: `v-data-table v-if="!mobile"` / card loop `v-else`

### Design Depth — Forbidden
- No raw CSS `box-shadow` on individual components — cards use global `--claro-shadow-sm`, others use `elevation` prop
- No CSS media queries for layout logic `useDisplay` handles
- No data components without loading/empty/error states
- No hardcoded hex colors — use theme tokens
- No conditional content without a Vuetify transition
- No `v-row` nested more than 2 levels deep
- No new notification components without checking `EnhancedToast.vue` first

### Layout Patterns
```vue
<!-- Standard form layout -->
<v-container>
  <v-row>
    <v-col cols="12" md="6">
      <v-text-field v-model="field" label="Label" :rules="rules" />
    </v-col>
  </v-row>
</v-container>

<!-- Modal with scroll -->
<v-dialog v-model="open" persistent scrollable>
  <v-card class="d-flex flex-column" style="max-height: 90vh">
    <v-card-title>Title</v-card-title>
    <v-divider />
    <v-card-text class="grow overflow-y-auto">Content</v-card-text>
    <v-divider />
    <v-card-actions>
      <v-spacer />
      <v-btn @click="close">Cancel</v-btn>
      <v-btn color="primary" @click="save">Save</v-btn>
    </v-card-actions>
  </v-card>
</v-dialog>
```

### Form Validation
```vue
<script setup lang="ts">
import type { VForm } from 'vuetify/components'

const formRef = ref<VForm | null>(null)
const formValid = ref(false)

const rules = [
  (v: string) => !!v || 'Required',
  (v: string) => v.length >= 3 || 'Min 3 characters'
]

async function submit() {
  const { valid } = await formRef.value!.validate()
  if (!valid) return
  // proceed...
}
</script>

<template>
  <v-form ref="formRef" v-model="formValid" @submit.prevent="submit">
    <v-text-field v-model="name" :rules="rules" />
    <v-btn type="submit" :disabled="!formValid">Submit</v-btn>
  </v-form>
</template>
```

### Theme Colors
Use semantic colors, not hex values:
- `primary`, `secondary`, `accent`, `error`, `warning`, `success`, `info`
- Domain-specific: `turn-urgent`, `turn-standard`, `booking-standard`
- Variants: `primary-darken-1`, `primary-lighten-2`

### Existing Dumb Components
Check `src/components/dumb/{shared,owner,admin}/` before creating new UI — there are 70 existing dumb components (25 shared, 19 owner, 26 admin).
Key shared ones: `ConfirmationDialog.vue`, `LoadingSpinner.vue`, `ErrorAlert.vue`, `SkeletonLoader.vue`, `EnhancedToast.vue`, `BookingForm.vue`, `MaterioDataTable.vue`, `MaterioFormWizard.vue`, `PropertyCard.vue`, `PropertyModal.vue`, `MobileBottomNav.vue`, `QuickActionsFab.vue`, `SmartNavigationPanel.vue`, `TurnPriorityBadge.vue`
Key admin ones: `CleanerAssignmentModal.vue`, `AdminBookingForm.vue`, `UrgentTurnsCard.vue`, `AdminUserWizard.vue`
Smart admin: `PerformanceMetricsDashboard.vue` (owns its own data lifecycle via `usePerformanceMonitor`)
Key owner ones: `OwnerBookingForm.vue`, `OwnerCalendarControls.vue`, `OwnerCleaningStatus.vue`

## Vuetify Reference

### Local Reference Files (check these first)

68 per-component reference files live in `docs/references/vuetify-components/` — one per component (e.g. `v-card.md`, `v-btn.md`). Each covers:
- **Design Props** — which props absorb design intent and whether Claro4 already sets a global default
- **Slot Anatomy** — named slots and what sub-components they accept
- **SASS Hooks** — CSS classes emitted, SASS variables, CSS custom properties
- **Design→Code Cheatsheet** — maps visual intent to specific props/values

Two architecture guides:
- `docs/references/vuetify-sass-architecture.md` — SASS settings layer, component style structure, custom token hookpoints
- `docs/references/vuetify-composition-patterns.md` — `useDefaults` cascade, `useTheme`/`useDisplay`/`useLocale`, slot composition, anti-patterns

Component index (all 68 components by category): `docs/references/vuetify-component-index.md`

**Lookup order for any Vuetify component question:**
1. Read the local `docs/references/vuetify-components/{v-component}.md` — has Claro4-specific context the MCP lacks
2. If the local file is insufficient, call the `vuetify-mcp` server

### Vuetify MCP

For Vuetify 4 API questions not covered by local files, use the `vuetify-mcp` server directly — it has dedicated tools for component API, directives, feature guides, and breaking changes. Do not use Context7 for Vuetify.

## MCP Workflow for UI/UX Development

When working on visual/UI changes, follow this tool workflow automatically:

### Explore Phase (before writing code)
- Take a Chrome DevTools screenshot of the current page state before making changes
- If the user hasn't specified which page, ask

### Research Phase (before writing code)
- **Vuetify components**: Use `vuetify-mcp` to look up component API (props, slots, events) — never guess Vuetify 4 API details
- **FullCalendar**: Use Context7 with library `/fullcalendar/fullcalendar-docs` to look up event props, view config, styling customization
- **Vue 3 patterns**: Use Context7 with `/vuejs/core` for composable patterns, slot syntax, lifecycle questions
- Only look up what's needed for the current task — don't pre-fetch everything

### Code Phase
- Write changes, then proactively take a Chrome DevTools screenshot to verify the result
- If the screenshot reveals issues, fix them before presenting to the user

### Debug Phase (when something looks off)
- Check console messages via Chrome DevTools for runtime errors
- Check network requests if data isn't rendering
- Use Vuetify MCP to verify correct prop usage if a component isn't behaving as expected

### Context7 Library Quick Reference
- **Vuetify 4**: Use `vuetify-mcp` directly (not Context7)
- **FullCalendar**: `/fullcalendar/fullcalendar-docs`
- **Vue 3**: `/vuejs/core`

## Fixing Type Errors

### Common Error Patterns

| Error | Likely Cause | Fix |
|-------|--------------|-----|
| `Property 'x' does not exist on type 'never'` | Uninitialized ref or empty array inference | Add explicit type: `ref<Booking[]>([])` |
| `Type 'X \| undefined' is not assignable to 'X'` | Optional chaining or Map.get() | Add null check or use `!` if guaranteed |
| `Argument of type 'X' is not assignable to parameter of type 'Y'` | Supabase row vs app type mismatch | Cast via `as Booking` or map fields explicitly |
| `Object is possibly 'undefined'` | Accessing computed before data loads | Guard with `v-if` in template or `?.` in script |

### Type Locations may use types from multiple sources:

- **Domain types**: `src/types/` - Booking, Property, User, etc.
- **Supabase rows**: Inferred from `supabase.from('table').select()` - may need casting to domain types
- **Component props**: Define with `defineProps<{ prop: Type }>()` - import types from `@types/*`
- **Store state**: Pinia stores use `Map<string, T>` - use `.get()` with undefined checks

```typescript
// Common type fixes
const bookings = ref<Booking[]>([])            // explicit type avoids 'never' inference
const booking = bookingStore.bookings.get(id)  // Map.get() returns T | undefined
if (!booking) return                           // always guard, or use ! if guaranteed

// Safe helpers from src/utils/typeHelpers.ts
import { safeDate, safeString, safeBookingField } from '@utils/typeHelpers'
const checkoutDate = safeDate(booking.checkout_date)      // always a valid Date
const field = safeString(unknownValue, 'fallback')        // always a string
```

### Supabase to App Type Mapping
Supabase returns snake_case rows; app types match this convention. When types drift:

```typescript
// Cast after null-check
const { data } = await supabase.from('bookings').select('*')
const bookings = (data ?? []) as Booking[]
```

1. Check `supabase/migrations/` for column changes
2. Update corresponding type in `src/types/`
3. Run `pnpm build` to find all affected code

## ESLint Rules
- Extends: `eslint:recommended`, `plugin:@typescript-eslint/recommended`, `plugin:vue/vue3-recommended`
- Parser: `@typescript-eslint/parser` within `vue-eslint-parser` for `<script>` blocks
- Custom rules: none currently configured (relies on extended config defaults)
- Plugins: `@typescript-eslint`, `vue`

## Critical Files

These areas require careful modification - extend existing patterns rather than refactoring:
- `src/components/smart/` - Working role-based components
- `src/composables/` - Performance-optimized logic
- `src/stores/` - Role-based state management with Map caching
- `src/router/` - Authentication and role guards
- `vite.config.ts` - Build optimization and chunking settings

## Gotchas

- Strict TypeScript: `pnpm build` runs `vue-tsc --noEmit`; keep `src/types/` in sync with Supabase migrations
- Property colors are user-selectable: `PROPERTY_COLORS` in `src/utils/constants.ts` (5 hex values: indigo, green, purple, orange, red). Each property stores its `color` field. New properties auto-cycle via `PROPERTY_COLORS[existingPropertyCount % PROPERTY_COLORS.length]` as the default.
- Don't duplicate business rules in components - call helpers in `businessLogic.ts` (validateBooking, calculateBookingPriority, detectBookingConflicts)
- Before finishing changes: run `pnpm test:run` and `pnpm build`
- For auth/routing or subscription changes: also run `pnpm test:performance`
- Build flags `__ENABLE_OWNER_FEATURES__` and `__ENABLE_ADMIN_FEATURES__` control role-specific code inclusion
- Vite chunk strategy splits: `vue-core`, `vuetify`, `calendar`, `supabase`, `vendor` (node_modules), `app-core` (stores/utils/shared composables), `owner-app`, `admin-app`
- CSS custom property `--app-bar-height` (from `src/styles/responsive.scss`) — use `var(--app-bar-height, 64px)` instead of hardcoding `64px`
