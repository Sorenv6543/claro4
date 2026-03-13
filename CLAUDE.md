# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Multi-tenant property cleaning scheduler with role-based Owner/Admin UI. Core product: guest-stay booking plus cleaning operations. Tech stack: Vue 3 + Vite + Vuetify 3, Pinia for state, Supabase for auth/Postgres/RLS/realtime. FullCalendar for scheduling views.

Two user types: **Property Owners** (30-40 clients with personal property/booking management) and **Business Admin** (1 user with system-wide operations and cleaner management).

## Commands

```bash
# Development
pnpm dev                    # Start dev server (with --host)
pnpm dev:local              # Start dev server (localhost only)

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
- `src/layouts/{admin,owner,auth,default}.vue`

### State Management

- Domain stores in `src/stores/`: `auth.ts`, `booking.ts`, `property.ts`, `ui.ts`
- Stores use `Map` collections with cached filtered Maps (TTL-based invalidation) for O(1) access
- Optimistic updates with rollback on failure
- Prefer derived computeds over cloning arrays
- Business logic lives in `src/utils/`, not in stores

### Composables Organization

- `src/composables/owner/` - Owner-specific data access (useOwnerBookings, useOwnerProperties, etc.)
- `src/composables/admin/` - Admin-specific data access (useAdminBookings, useCleanerManagement, etc.)
- `src/composables/shared/` - Cross-cutting concerns (useCalendarState, usePerformanceMonitor, etc.)
- `src/composables/supabase/` - Supabase integration (useSupabaseAuth, useRealtimeSync, etc.)
- Reuse existing composables before adding new Supabase calls
- `useOwnerProperties()` returns `myProperties` (not `properties`): `const { myProperties } = useOwnerProperties()`

### Key Utilities

- `src/utils/businessLogic.ts` - Booking/cleaning rules, priority calculation, conflict detection
- `src/utils/authHelpers.ts` - Auth helpers including `getDefaultRouteForRole`
- `src/utils/constants.ts` - Application constants
- `src/utils/errorMessages.ts` - Centralized error messages
- `src/utils/typeHelpers.ts` - TypeScript type helper utilities (`safeDate`, `safeString`, `safeBookingField`)

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
Use system default times for booking forms; don't hard-code time strings in components:

```typescript
// Standard vacation rental defaults
const DEFAULT_CHECKOUT_TIME = '11:00'  // 11:00 AM checkout (guests depart)
const DEFAULT_CHECKIN_TIME  = '15:00'  // 3:00 PM checkin (guests arrive)

// Pre-populate form fields with these defaults; property-specific overrides take precedence
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
// 'owner' → '/owner/dashboard' | 'admin' → '/admin' | else → '/auth/login'
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
- Layout selection: `App.vue` reads `route.meta.layout` and renders `src/layouts/{name}.vue` — all owner routes use `meta: { layout: 'owner' }`

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

## Performance

- Stores use `Map`-based collections with cached filtered Maps (10s TTL)
- Use computed helpers like `getUpcomingBookings` / `getUrgentTurns` from businessLogic.ts
- Track subscriptions with `usePerformanceMonitor` from `src/composables/shared/usePerformanceMonitor.ts`
- Clean up subscriptions on unmount to keep performance tests green
- Run `pnpm test:performance` after significant data flow changes

## Vuetify 3 UI/UX Patterns

### Setup
- **Version**: Vuetify 3.11.8 with `vite-plugin-vuetify` for auto-imports
- **Icons**: MDI (`mdi-*`) via `@mdi/font`
- **Config**: `src/plugins/vuetify.ts` - theme colors, component defaults, breakpoints

### Component Defaults (already configured globally)
Don't override these unless necessary:
- `VBtn`: `variant="flat"`, `rounded`, no uppercase
- `VCard`: `elevation="2"`, `rounded="lg"`, `pa-2`
- `VTextField`, `VSelect`, `VTextarea`, `VAutocomplete`, `VCombobox`: `variant="outlined"`, `density="comfortable"`, `rounded="lg"`, `hideDetails="auto"`
- `VDialog`: `max-width="700px"`, `rounded="lg"`
- `VAlert`: `variant="tonal"`, `rounded="lg"`
- `VChip/VBadge`: `rounded="pill"`

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
Check `src/components/dumb/shared/` before creating new UI:
- `ConfirmationDialog.vue`, `LoadingSpinner.vue`, `ErrorAlert.vue`, `SkeletonLoader.vue`, `EnhancedToast.vue`

## Vuetify MCP

Use `mcp__vuetify-mcp__*` tools instead of guessing at v4 APIs or component props.

| Situation | Tool |
|-----------|------|
| Check props / events / slots for any component | `get_component_api_by_version` — pass `version: "latest"` for v4 |
| Something broke after a Vuetify upgrade | `get_v4_breaking_changes` — filter by category (`v-btn`, `theme`, `v-select`, etc.) |
| Configure theme, SASS vars, icons, i18n, display | `get_feature_guide` — topics: `theme`, `sass-variables`, `icon-fonts`, `display-and-platform`, `global-configuration` |
| Directive API (`v-ripple`, `v-intersect`, etc.) | `get_directive_api_by_version` |
| Release notes for a specific version | `get_release_notes_by_version` |
| Migrate v3 → v4 | `get_upgrade_guide` with `version: "v3"` |
| Create a repro or file a Vuetify bug | `create_vuetify_bin` + `create_bug_report` |

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
- Vue components: `multi-word-component-names` off, `define-props-declaration` type-based, `define-emits-declaration` type-based, `component-definition-name-casing` PascalCase
- TypeScript: strict, unused vars warn with `_` prefix ignore pattern
- Parser: `vue-eslint-parser` with `@typescript-eslint/parser` for `<script>` blocks

## Critical Files

These areas require careful modification - extend existing patterns rather than refactoring:
- `src/components/smart/` - Working role-based components
- `src/composables/` - Performance-optimized logic
- `src/stores/` - Role-based state management with Map caching
- `src/router/` - Authentication and role guards
- `vite.config.ts` - Build optimization and chunking settings

## Gotchas

- Strict TypeScript: `pnpm build` runs `vue-tsc --noEmit`; keep `src/types/` in sync with Supabase migrations
- `src/pages/owner/properties/create.vue` and `edit.vue` exist as files but have **no router entries** — they are unreachable; property CRUD uses in-place modals on the Properties page
- Property card color cycling (consistent across cards, sidebar, calendar): `const COLORS = ['#5c6bc0', '#43a047', '#8e24aa', '#f57c00']` — use `COLORS[index % COLORS.length]`
- Don't duplicate business rules in components - call helpers in `businessLogic.ts` (validateBooking, calculateBookingPriority, detectBookingConflicts)
- Before finishing changes: run `pnpm test:run` and `pnpm build`
- For auth/routing or subscription changes: also run `pnpm test:performance`
- Build flags `__ENABLE_OWNER_FEATURES__` and `__ENABLE_ADMIN_FEATURES__` control role-specific code inclusion
- Vite chunk strategy splits: `vue-core`, `vuetify`, `calendar`, `vendor` (node_modules) and role-based app chunks
