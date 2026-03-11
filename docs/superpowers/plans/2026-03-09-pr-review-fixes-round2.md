# PR Review Fixes Round 2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all critical and important issues identified in the second PR review of `feat/owner-property-view` — covering type safety, auth guard correctness, error handling, and component cleanup.

**Architecture:** Targeted edits only — no new files, no new Supabase flows. Mock implementations (`createOwnerBooking`, `fetchMyBookings`) that require full Supabase integration are out of scope and flagged as TODOs. All other issues are directly fixable.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vuetify 3, Vue Router 4, Vitest

---

## Chunk 1: Type Safety

### Task 1: Fix `src/types/property.ts` — remove index signature, apply `PropertyRecord` pattern

**Files:**
- Modify: `src/types/property.ts`
- Modify: `src/components/smart/owner/HomeOwner.vue` (2 call sites)

The `Property` type has `[key: string]: unknown` that was removed from `Booking` in the prior round but left here. Apply the same `PropertyRecord` alias pattern.

- [ ] **Step 1: Read the file**

Read `src/types/property.ts` in full.

- [ ] **Step 2: Replace index signature with `PropertyRecord` alias**

Delete lines 30–31:
```typescript
  // Add index signature to allow conversion to Record<string, unknown>
  [key: string]: unknown;
```

After the `PropertyFormData` type alias (after line 52), add:
```typescript
/**
 * Use this type at Supabase realtime/modal boundaries that need Record<string, unknown>.
 * Never add [key: string]: unknown to Property itself.
 */
export type PropertyRecord = Property & Record<string, unknown>;
```

- [ ] **Step 3: Update call sites in `HomeOwner.vue`**

Read `src/components/smart/owner/HomeOwner.vue` around lines 534–550.

At the two `openModal` call sites that cast `property as Record<string, unknown>`:
- Add `import type { ... PropertyRecord } from '@/types'` (or update the existing type import to include `PropertyRecord`)
- Replace `property as Record<string, unknown>` with `property as PropertyRecord`

- [ ] **Step 4: Run build**

```bash
pnpm build:fast
```

Expected: No errors. TypeScript will enforce that `Property` no longer allows arbitrary keys — any remaining `property.someNonExistentKey` access will surface as a type error. Fix those at the call site, not by restoring the index signature.

- [ ] **Step 5: Commit**

```bash
git add src/types/property.ts src/components/smart/owner/HomeOwner.vue
git commit -m "fix: remove [key: string]: unknown from Property, add PropertyRecord alias"
```

---

### Task 2: Fix `src/types/user.ts` — strengthen `isCleaner` guard

**Files:**
- Modify: `src/types/user.ts`

The `isCleaner` guard only checks `user.role === 'cleaner'`. A Supabase row with `role='cleaner'` but `null` skills would pass the guard and then crash at `cleaner.skills.includes(...)`.

- [ ] **Step 1: Read the file**

Read `src/types/user.ts` in full.

- [ ] **Step 2: Update `isCleaner`**

Replace the current `isCleaner` function:
```typescript
export function isCleaner(user: User): user is Cleaner {
  return user.role === 'cleaner';
}
```

With:
```typescript
export function isCleaner(user: User): user is Cleaner {
  return (
    user.role === 'cleaner' &&
    Array.isArray(user.skills) &&
    typeof user.max_daily_bookings === 'number'
  );
}
```

- [ ] **Step 3: Run build**

```bash
pnpm build:fast
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/types/user.ts
git commit -m "fix: isCleaner guard validates required subtype fields (skills, max_daily_bookings)"
```

---

## Chunk 2: Auth & Router

### Task 3: Move `authInitialized` into Pinia auth store

**Files:**
- Modify: `src/stores/auth.ts`
- Modify: `src/router/guards.ts`

The module-level `let authInitialized = false` in `guards.ts` is never reset between HMR reloads or test runs, and it won't reset after a logout/login cycle without a page refresh. Moving it to the Pinia store gives it proper lifecycle.

- [ ] **Step 1: Read `src/stores/auth.ts`**

Read the file in full.

- [ ] **Step 2: Add `authChecked` state to the auth store**

Inside `defineStore('auth', () => { ... })`, after the existing reactive refs (around line 38), add:
```typescript
// Tracks whether checkAuth() has been called at least once this session.
// Used by authGuard to avoid redundant Supabase calls on every navigation.
const authChecked = ref(false);
```

Expose it in the store's return object at the bottom of the store definition (wherever the store returns its public API):
```typescript
authChecked,
```

- [ ] **Step 3: Update `guards.ts` to use the store flag**

In `src/router/guards.ts`:

Delete line 6:
```typescript
let authInitialized = false;
```

Replace the `authGuard` init-check block (lines 15–19):
```typescript
  // Only call checkAuth once per app session to avoid redundant calls on redirect
  if (!authInitialized) {
    await authStore.checkAuth();
    authInitialized = true;
  }
```

With:
```typescript
  // Only call checkAuth once per app session (first navigation after load).
  // After logout, the auth store's signOut action must clear authChecked so the
  // next navigation re-checks the session.
  if (!authStore.authChecked) {
    await authStore.checkAuth();
    authStore.authChecked = true;
  }
```

- [ ] **Step 4: Reset `authChecked` on sign-out**

In `src/stores/auth.ts`, find the `signOut` function. After the sign-out completes (after `clearAllRoleSpecificState()`), add:
```typescript
authChecked.value = false;
```

This ensures that after logout, the next navigation re-runs `checkAuth()` to detect the cleared session.

- [ ] **Step 5: Run build and tests**

```bash
pnpm build:fast && pnpm test:run
```

Expected: Build clean, 89 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/stores/auth.ts src/router/guards.ts
git commit -m "fix: move authChecked flag to Pinia store so logout/re-login resets it"
```

---

### Task 4: Clean up misleading guard comments and console.logs

**Files:**
- Modify: `src/router/guards.ts`

Three issues:
1. `loadingGuard` has `// TODO: set loading state here` but immediately below it a `console.log` claims loading state IS being set
2. `afterNavigationGuard` has `// Initialize real-time sync if on protected routes` but only logs — `realtimeSyncGuard` was intentionally deleted in this PR
3. `developmentGuard` has a `console.log` that will appear in production

- [ ] **Step 1: Read the file**

Read `src/router/guards.ts`.

- [ ] **Step 2: Fix `loadingGuard`**

Replace:
```typescript
  // TODO: set loading state here
  if (to.meta.requiresAuth || to.meta.role) {
    console.log('⏳ Loading guard: Setting loading state for protected route');
  }
```

With:
```typescript
  // TODO: set loading state here (e.g. uiStore.setLoading(true))
```

- [ ] **Step 3: Fix `afterNavigationGuard`**

Replace the entire function body:
```typescript
export function afterNavigationGuard(
  to: RouteLocationNormalized
) {
  console.log('📍 Navigation completed to:', to.path);

  // Initialize real-time sync if on protected routes
  if (to.meta.requiresAuth) {
    console.log('🔄 Protected route accessed, ensuring real-time sync is active');
  }
}
```

With:
```typescript
export function afterNavigationGuard(
  _to: RouteLocationNormalized
) {
  // Post-navigation hook — add analytics, page title updates, etc. here
}
```

- [ ] **Step 4: Fix `developmentGuard` console.log**

In `developmentGuard`, remove the `console.log`:
```typescript
    console.log('❌ Development route blocked in production');
```

- [ ] **Step 5: Run build**

```bash
pnpm build:fast
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/router/guards.ts
git commit -m "fix: remove misleading console.logs from guards, fix afterNavigationGuard comment"
```

---

### Task 5: Fix `useAuth.ts` header comment

**Files:**
- Modify: `src/composables/shared/useAuth.ts`

The file header says `// ✅ Called by auth store` — factually wrong. The auth store delegates to `useSupabaseAuth`, not this file. This file is a mock used only by push-notification components.

- [ ] **Step 1: Read lines 1–10 of the file**

Read `src/composables/shared/useAuth.ts` (first 15 lines).

- [ ] **Step 2: Replace the header block**

Replace lines 1–7:
```typescript
// 🔐 AUTHENTICATION LAYER

// src/composables/shared/useAuth.ts - 🔧 AUTH OPERATIONS
// ✅ Contains actual authentication logic
// ✅ Currently mock implementation
// ✅ Called by auth store
// ✅ Future: Will contain real Supabase calls (TODO: TASK-039O) -
```

With:
```typescript
// Mock auth composable — used only by push notification components.
// The auth store delegates to useSupabaseAuth (not this file).
// This file provides a standalone user ref for UI components that
// are not wired to the main auth store.
```

- [ ] **Step 3: Commit**

```bash
git add src/composables/shared/useAuth.ts
git commit -m "fix: correct useAuth.ts header — not called by auth store, is a mock"
```

---

## Chunk 3: Error Handling

### Task 6: Fix `useAdminBookings.ts` — empty `assignCleanerToBooking` catch + `updateBooking` propagation

**Files:**
- Modify: `src/composables/admin/useAdminBookings.ts`

Two issues in the same file:
1. `assignCleanerToBooking` has an empty catch that swallows all errors silently
2. `updateBooking` does not propagate the error — unlike `createBooking` which `throw err`s after setting `error.value`, `updateBooking` only sets `error.value` and returns silently

- [ ] **Step 1: Read the file**

Read the relevant sections around `assignCleanerToBooking` (lines 689–701) and `updateBooking` (lines 264–279).

- [ ] **Step 2: Fix `assignCleanerToBooking` catch**

Replace the entire `assignCleanerToBooking` inline function:
```typescript
assignCleanerToBooking: (bookingId: string, cleanerId: string) => {
  // Synchronous version for test compatibility
  try {
    const booking = bookingStore.bookings.get(bookingId);
    if (booking) {
      bookingStore.updateBooking(bookingId, { assigned_cleaner_id: cleanerId });
      return true;
    }
    return false;
  } catch {
    return false;
  }
},
```

With:
```typescript
assignCleanerToBooking: (bookingId: string, cleanerId: string) => {
  // Synchronous store update — does not persist to Supabase.
  // Use assignCleaner() for the async Supabase version.
  try {
    const booking = bookingStore.bookings.get(bookingId);
    if (booking) {
      bookingStore.updateBooking(bookingId, { assigned_cleaner_id: cleanerId });
      return true;
    }
    return false;
  } catch (err) {
    error.value = `Failed to assign cleaner: ${err instanceof Error ? err.message : String(err)}`;
    console.error('[useAdminBookings] assignCleanerToBooking error:', err);
    return false;
  }
},
```

- [ ] **Step 3: Fix `updateBooking` to propagate the error**

In `updateBooking`'s catch block (around line 273):
```typescript
    } catch (err: unknown) {
      error.value = `Failed to update booking: ${err instanceof Error ? err.message : String(err)}`;
      trackCachePerformance('admin-update-booking', false);
    }
```

Add `throw err` after the `trackCachePerformance` call:
```typescript
    } catch (err: unknown) {
      error.value = `Failed to update booking: ${err instanceof Error ? err.message : String(err)}`;
      trackCachePerformance('admin-update-booking', false);
      throw err;
    }
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```

Expected: All 89 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useAdminBookings.ts
git commit -m "fix: log errors in assignCleanerToBooking catch, propagate updateBooking errors"
```

---

### Task 7: Fix `useAdminUserManagement.ts` — `deleteUser` UI sync + `resetUserPassword` comment

**Files:**
- Modify: `src/composables/admin/useAdminUserManagement.ts`

Two issues:
1. `deleteUser` returns `false` on partial failure (auth deletion fails) but doesn't call `fetchAllUsers()`, so the admin panel shows a ghost entry for a user whose profile is already deleted
2. `resetUserPassword` comment and error messages claim it sends a password reset email — it actually directly sets the password via `supabase.auth.admin.updateUserById`

- [ ] **Step 1: Read the relevant sections**

Read `src/composables/admin/useAdminUserManagement.ts` lines 131–215.

- [ ] **Step 2: Fix `deleteUser` to refresh user list on partial failure**

In the `if (authError)` block (lines 145–150), add `fetchAllUsers()` before returning `false`:
```typescript
    if (authError) {
      // Profile was deleted but auth account remains — user can still log in.
      // Refresh the list so the UI reflects the partial deletion.
      await fetchAllUsers()
      error.value = 'User profile deleted, but the auth account could not be removed. Contact your Supabase admin to delete the auth record manually.'
      loading.value = false
      return false
    }
```

- [ ] **Step 3: Fix `resetUserPassword` comment and error messages**

Replace line 199:
```typescript
    // Supabase admin API does not send password reset emails directly; must use client API
```

With:
```typescript
    // Directly sets a new password via the Supabase admin API — does not send a reset email.
```

Replace the error message on line 209:
```typescript
      error.value = (err as { message?: string }).message || 'Failed to send password reset email'
```

With:
```typescript
      error.value = (err as { message?: string }).message || 'Failed to update password'
```

Also check if there's a second error fallback on line 211 (`'Failed to send password reset email'`) — replace that too with `'Failed to update password'`.

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```

Expected: All 89 tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useAdminUserManagement.ts
git commit -m "fix: refresh user list after deleteUser partial failure, fix resetUserPassword comment"
```

---

## Chunk 4: Component & Template Cleanup

### Task 8: Fix `OwnerPropertyView.vue` — hex colors + section label

**Files:**
- Modify: `src/components/smart/owner/OwnerPropertyView.vue`

Two issues:
1. `background: #f8f9fa` and `border-bottom: 1px solid #e0e0e0` in scoped styles are hardcoded hex values — CLAUDE.md requires semantic Vuetify theme colors
2. The "Cleaning Schedule" section title uses `upcomingSchedule` which filters on `checkin_date` (guest arrival), not on cleaning dates — the label is semantically wrong

- [ ] **Step 1: Read the file**

Read `src/components/smart/owner/OwnerPropertyView.vue` — specifically the `<style scoped>` block (around lines 510–560) and the template section labeled "Cleaning Schedule" (around lines 140–200).

- [ ] **Step 2: Fix scoped styles — replace hex colors with theme-aware CSS**

In the `<style scoped>` block:

Replace:
```css
.property-view-page {
  min-height: 100vh;
  background: #f8f9fa;
}
```

With:
```css
.property-view-page {
  min-height: 100vh;
  background: rgb(var(--v-theme-background));
}
```

Replace:
```css
  border-bottom: 1px solid #e0e0e0;
```

With:
```css
  border-bottom: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
```

- [ ] **Step 3: Rename "Cleaning Schedule" to "Upcoming Arrivals"**

The section filters by `checkin_date >= today` — this shows upcoming guest arrivals, not cleaning dates. In the template, find the two places where "Cleaning Schedule" appears:

Replace the HTML comment:
```html
<!-- Cleaning Schedule -->
```
With:
```html
<!-- Upcoming Arrivals -->
```

Replace the visible card title text:
```html
              Cleaning Schedule
```
With:
```html
              Upcoming Arrivals
```

Also find the `mdi-broom` icon used in this section. Change it to `mdi-calendar-account` (arrival icon is more accurate than a broom icon for guest arrival dates).

- [ ] **Step 4: Run build**

```bash
pnpm build:fast
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/smart/owner/OwnerPropertyView.vue
git commit -m "fix: use theme CSS vars for colors, rename Cleaning Schedule to Upcoming Arrivals"
```

---

## Final Verification

- [ ] **Run full build with type check**

```bash
pnpm build
```

Expected: `vue-tsc --noEmit` passes, Vite build succeeds.

- [ ] **Run full test suite**

```bash
pnpm test:run
```

Expected: All tests pass.

- [ ] **Push to remote**

```bash
git push origin feat/owner-property-view
```

---

## Out of Scope (flagged for future work)

These issues from the PR review require full Supabase integration and cannot be fixed with targeted edits:

- **`createOwnerBooking` mock in production** (`useOwnerBookings.ts:442`) — generates ghost bookings with `Math.random()` IDs. Requires implementing real Supabase `INSERT` for owner booking creation.
- **`fetchMyBookings` fakes success** (`useOwnerBookings.ts:163`) — `setTimeout(300)` with no Supabase call. Requires implementing real `SELECT` with owner filter.
- **`bulkAssignCleaner` / `bulkUpdateStatus` catch blocks** — swallow individual failure details. Would benefit from better logging but is lower priority.
- **`priority` stored vs computed staleness** — `calculateBookingPriority` is time-sensitive but `priority` is persisted. Requires DB migration to either remove the column or add a scheduled recompute.
- **`Booking.priority` DB null risk** — if the `bookings` table column is nullable without a default, existing rows may have null priority that the new required type won't catch at Supabase cast sites. Verify with: `SELECT COUNT(*) FROM bookings WHERE priority IS NULL;`. If any rows exist, add `priority: row.priority ?? 'normal'` at cast sites or run a backfill migration.
