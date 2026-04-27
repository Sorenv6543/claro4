# Supabase Backend Audit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix security holes, initialization race conditions, N+1 performance patterns, and architecture gaps discovered in the 2026-04-26 Supabase backend audit.

**Architecture:** Four sequential phases — security first (migrations), then runtime race conditions (provide/inject), then performance quick-wins (single round-trip CRUD), then architecture cleanup (composable CRUD gaps and dead code). Each phase is independently shippable. Phases 0–2 are safe to execute in order without review gates. Phase 3 requires running the full test suite after each task.

**Tech Stack:** Vue 3, Pinia, Supabase JS v2, Vitest, TypeScript, PostgREST

---

## File Map

**Create:**
- `supabase/migrations/20260426000001_drop_dev_artifact_tables.sql`
- `supabase/migrations/20260426000002_rls_security_hardening.sql`
- `src/__tests__/composables/supabase/useSupabaseCleanerTeams.spec.ts`
- `src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts`

**Modify:**
- `src/composables/supabase/useSupabaseBookings.ts` — add `bulkChangeStatus`
- `src/composables/supabase/useSupabaseCleanerTeams.ts` — add full CRUD + realtime
- `src/composables/supabase/useSupabaseUserProfiles.ts` — fix `updateProfile` to single round-trip
- `src/composables/supabase/useSupabaseAuth.ts` — remove admin methods, expose `refreshProfile`
- `src/composables/supabase/useRealtimeSync.ts` — fix profile realtime handler
- `src/composables/admin/useAdminBookings.ts` — rewrite `bulkUpdateStatus`, remove `fetchAllProperties`
- `src/stores/auth.ts` — remove `getAllUsers`/`updateUserRole`, add `refreshProfile`
- `src/layouts/admin.vue` — provide `AppStatus`
- `src/layouts/owner.vue` — provide `AppStatus`

---

## Phase 0 — Security

### Task 0.1: Drop ad-hoc dev tables

`public.calendar_events` and `public.test_table` exist only in the Supabase dashboard with fully open RLS policies (`USING (true)` for INSERT/UPDATE/DELETE). Neither has any client-side references. Drop them via migration.

**Files:**
- Create: `supabase/migrations/20260426000001_drop_dev_artifact_tables.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260426000001_drop_dev_artifact_tables.sql
-- Drop dev-only tables that have fully-open RLS policies (USING true for
-- INSERT/UPDATE/DELETE) and no migration source. Confirmed by Supabase
-- security advisor 2026-04-26. Neither table has client-side references.
-- If calendar_events becomes a real feature it gets a new migration with
-- scoped policies.

DROP TABLE IF EXISTS public.calendar_events;
DROP TABLE IF EXISTS public.test_table;
```

- [ ] **Step 2: Apply the migration via Supabase MCP**

Use the `mcp__claude_ai_Supabase__apply_migration` tool with:
- `project_id`: `aejkrsvemqnftivzkkxd`
- `name`: `drop_dev_artifact_tables`
- `query`: contents of the file above

- [ ] **Step 3: Verify via Supabase advisor**

Use `mcp__claude_ai_Supabase__get_advisors` with `type: "security"`. Confirm the `rls_policy_always_true` warnings for `calendar_events` and `test_table` are gone.

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260426000001_drop_dev_artifact_tables.sql
git commit -m "fix(security): drop calendar_events and test_table dev artifacts with open RLS policies"
```

---

### Task 0.2: RLS security hardening

Three things in one migration: (1) add `RESTRICTIVE` anonymous-block policies to `bookings`, `properties`, `user_profiles`; (2) fix `cleaner_teams` from `TO public` to `TO authenticated`; (3) merge the two separate `cleaner_teams` SELECT policies into one to eliminate the multiple-permissive-policies perf warning.

**Files:**
- Create: `supabase/migrations/20260426000002_rls_security_hardening.sql`

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260426000002_rls_security_hardening.sql
-- Two security fixes:
-- 1. RESTRICTIVE anonymous-block policies on bookings, properties, user_profiles.
--    Anonymous users assume the `authenticated` role (Supabase anonymous sign-ins
--    are enabled). The is_owner/is_admin/is_cleaner helpers implicitly protect data
--    (anon users have no profile row), but a RESTRICTIVE policy makes this
--    explicit and durable against future helper changes.
--    Ref: https://supabase.com/docs/guides/auth/auth-anonymous#access-control
-- 2. cleaner_teams: TO public -> TO authenticated, merge two SELECT policies into
--    one. Fixes anonymous access warning + multiple-permissive-policies perf warning.

BEGIN;

-- ============================================================================
-- 1. Anonymous-block RESTRICTIVE policies
-- ============================================================================

CREATE POLICY "Block anonymous mutations"
  ON public.bookings AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

CREATE POLICY "Block anonymous mutations"
  ON public.properties AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

CREATE POLICY "Block anonymous mutations"
  ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

-- ============================================================================
-- 2. cleaner_teams: merge policies, switch TO authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all teams"  ON public.cleaner_teams;
DROP POLICY IF EXISTS "Cleaners can view own teams"  ON public.cleaner_teams;

-- Single merged SELECT policy replaces two permissive policies that were
-- evaluated separately and OR'd per query (doubles the evaluation cost).
CREATE POLICY "Authenticated can view permitted teams"
  ON public.cleaner_teams FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin())
    OR (
      (SELECT private.is_cleaner())
      AND (SELECT private.current_user_id()) = ANY(member_ids)
    )
  );

-- Separate ALL policy for admin writes
CREATE POLICY "Admins can manage teams"
  ON public.cleaner_teams FOR ALL TO authenticated
  USING    ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ============================================================================
-- Assertion: cleaner_teams has no remaining TO public policies
-- ============================================================================
DO $$
DECLARE
  public_count INT;
BEGIN
  SELECT COUNT(*)
    INTO public_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename  = 'cleaner_teams'
     AND roles @> ARRAY['public']::name[];

  IF public_count > 0 THEN
    RAISE EXCEPTION
      'Migration assertion failed: % cleaner_teams policies still use TO public',
      public_count;
  END IF;
END $$;

COMMIT;
```

- [ ] **Step 2: Apply via Supabase MCP**

Use `mcp__claude_ai_Supabase__apply_migration` with:
- `project_id`: `aejkrsvemqnftivzkkxd`
- `name`: `rls_security_hardening`
- `query`: contents above

- [ ] **Step 3: Verify via Supabase advisor**

Run `mcp__claude_ai_Supabase__get_advisors` with `type: "security"`. Confirm:
- `auth_allow_anonymous_sign_ins` warnings are gone for `cleaner_teams`
- `multiple_permissive_policies` warning for `cleaner_teams` is gone
- Anonymous-block policies appear for `bookings`, `properties`, `user_profiles`

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```
Expected: all existing tests pass (no RLS logic is tested in unit tests — this is a DB-only change).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260426000002_rls_security_hardening.sql
git commit -m "fix(security): harden RLS — block anon mutations, fix cleaner_teams TO public"
```

---

## Phase 1 — Race Condition Fix

### Task 1.1: Add AppStatus provide/inject to both layouts

Vue 3 fires `onMounted` bottom-up: child pages mount before the parent layout's `onMounted` runs. Both layouts call `initRealtimeSync()` in `onMounted`, so pages see empty stores. Fix: layouts provide a shared `AppStatus` object. Pages inject it to gate skeletons on `isReady` and show a banner on `initError`.

**Files:**
- Modify: `src/layouts/admin.vue`
- Modify: `src/layouts/owner.vue`

- [ ] **Step 1: Update `src/layouts/admin.vue`**

In the `<script setup>` block, replace the existing `onMounted` and `loading` ref with the following. Keep all other code unchanged.

```ts
// Replace this block (lines ~143–256):
//   const loading = ref<boolean>(false)
//   onMounted(async () => { ... })
//
// With:

import { provide, ref, onMounted } from 'vue'

// AppStatus — shared with all child pages via provide/inject
const isReady = ref(false)
const initError = ref<Error | null>(null)
provide('appStatus', { isReady, initError })

// Keep sidebar loading separate (controls sidebar skeleton only)
const loading = ref<boolean>(false)

onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([
      fetchAllUsers(),
      fetchCleaners(),
      initRealtimeSync(),
    ])
    isReady.value = true
  } catch (error) {
    initError.value = error instanceof Error ? error : new Error(String(error))
    console.error('[AdminLayout] Failed to initialize:', error)
  } finally {
    loading.value = false
  }
})
```

Also add to the template, inside `<v-main>` before `<router-view />`:

```html
<v-banner
  v-if="initError"
  color="error"
  icon="mdi-alert-circle-outline"
  lines="one"
  class="mb-0"
>
  <v-banner-text>
    Failed to load data. Please refresh the page.
  </v-banner-text>
</v-banner>
<router-view />
```

- [ ] **Step 2: Update `src/layouts/owner.vue`**

In the `<script setup>` block, add after existing imports:

```ts
import { provide, ref } from 'vue'

const isReady = ref(false)
const initError = ref<Error | null>(null)
provide('appStatus', { isReady, initError })
```

Replace the existing `onMounted`:

```ts
onMounted(() => {
  initRealtimeSync()
    .then(() => { isReady.value = true })
    .catch((error: unknown) => {
      initError.value = error instanceof Error ? error : new Error(String(error))
      console.error('[OwnerLayout] Failed to initialize realtime sync:', error)
    })
})
```

Also add inside `<v-main>` before `<router-view />`:

```html
<v-banner
  v-if="initError"
  color="error"
  icon="mdi-alert-circle-outline"
  lines="one"
  class="mb-0"
>
  <v-banner-text>
    Failed to load data. Please refresh the page.
  </v-banner-text>
</v-banner>
<router-view />
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:run
```
Expected: all existing layout tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/layouts/admin.vue src/layouts/owner.vue
git commit -m "fix(race): layouts provide AppStatus (isReady, initError) to child pages"
```

---

### Task 1.2: Audit pages for `onMounted` store reads

Pages that read from `bookingStore` or `propertyStore` inside `onMounted` see empty data because their `onMounted` fires before the layout's. The fix is to remove imperative store reads in `onMounted` and use reactive `computed` properties instead. Also add `inject('appStatus')` to show a skeleton while `!isReady`.

**Files:**
- Modify: `src/pages/admin/bookings/index.vue`
- Modify: `src/pages/admin/properties/index.vue`
- Modify: `src/pages/admin/calendar/index.vue`
- Modify: `src/pages/owner/bookings/index.vue`
- Modify: `src/pages/owner/properties/index.vue`
- Modify: `src/pages/owner/overview.vue`
- Modify: `src/pages/owner/charts.vue`
- Modify: `src/pages/owner/calendar/index.vue` (if exists)

- [ ] **Step 1: Audit each page**

For each file above, search for patterns like:
```ts
onMounted(async () => {
  bookings.value = Array.from(bookingStore.bookings.values())
  // OR
  await someComposable.fetchAll()
  // OR
  data.value = store.someMap.get(id)
})
```

If a page reads from a store in `onMounted` and assigns to a local `ref`, convert it to `computed`:

```ts
// BEFORE
const bookings = ref<Booking[]>([])
onMounted(() => {
  bookings.value = Array.from(bookingStore.bookings.values())
})

// AFTER
import { computed } from 'vue'
const bookings = computed(() => Array.from(bookingStore.bookings.values()))
```

- [ ] **Step 2: Add AppStatus inject + skeleton gate to each affected page**

Add to each page's `<script setup>`:

```ts
import { inject } from 'vue'
const appStatus = inject<{ isReady: Ref<boolean>, initError: Ref<Error | null> }>('appStatus')
```

Wrap the page's primary data area in the template with:

```html
<v-skeleton-loader
  v-if="appStatus && !appStatus.isReady.value"
  type="table-tbody"
/>
<template v-else>
  <!-- existing page content -->
</template>
```

- [ ] **Step 3: Run tests**

```bash
pnpm test:run
```
Expected: all tests pass. If a component test breaks because it doesn't provide `appStatus`, add a `provide` in the test's `mountOptions`:
```ts
global: {
  provide: {
    appStatus: { isReady: ref(true), initError: ref(null) }
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/pages/
git commit -m "fix(race): convert onMounted store reads to computed; inject AppStatus in pages"
```

---

## Phase 2 — Performance Quick Wins

### Task 2.1: Rewrite `bulkUpdateStatus` to use a single `.in()` round-trip

Currently `bulkUpdateStatus` in `useAdminBookings.ts` fires N parallel `.update().eq()` calls (one per booking). The same pattern that `bulkAssignCleaner` uses — pre-filter in JS, optimistic update, single `.update().in()`, rollback on failure — should be applied here too.

**Files:**
- Modify: `src/composables/supabase/useSupabaseBookings.ts` — add `bulkChangeStatus`
- Modify: `src/composables/admin/useAdminBookings.ts` — wire `bulkUpdateStatus` to new function

- [ ] **Step 1: Write the failing test in `useSupabaseBookings.spec.ts`**

Add to the existing `describe('useSupabaseBookings')` block, after the `bulkAssignCleaner` suite:

```ts
describe('bulkChangeStatus', () => {
  function wireBulkStatusChain(result: { data: unknown, error: unknown }) {
    const inMock = vi.fn().mockResolvedValue(result)
    const updateMock = vi.fn().mockReturnValue({ in: inMock })
    supabaseMock.from.mockReturnValue({
      select: vi.fn().mockReturnValue({ gte: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }) }),
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      update: updateMock,
      delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
    })
    supabaseMock.channel = vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    })
    supabaseMock.removeChannel = vi.fn()
    return { updateMock, inMock }
  }

  it('sends a single .in() query for all eligible bookings', async () => {
    const { updateMock, inMock } = wireBulkStatusChain({ data: null, error: null })
    const composable = await getComposable()
    const store = await getBookingStore()

    store.setBooking('b1', makeBooking({ id: 'b1', status: 'pending' }))
    store.setBooking('b2', makeBooking({ id: 'b2', status: 'pending' }))

    const result = await composable.bulkChangeStatus(['b1', 'b2'], 'scheduled')

    expect(result.updated).toHaveLength(2)
    expect(result.skipped).toHaveLength(0)
    expect(updateMock).toHaveBeenCalledWith(expect.objectContaining({ status: 'scheduled' }))
    expect(inMock).toHaveBeenCalledWith('id', ['b1', 'b2'])
  })

  it('skips bookings with invalid status transitions', async () => {
    const { inMock } = wireBulkStatusChain({ data: null, error: null })
    const composable = await getComposable()
    const store = await getBookingStore()

    // completed -> in_progress is not a valid transition
    store.setBooking('done', makeBooking({ id: 'done', status: 'completed' }))
    store.setBooking('ok',   makeBooking({ id: 'ok',   status: 'pending' }))

    const result = await composable.bulkChangeStatus(['done', 'ok'], 'scheduled')

    expect(result.skipped).toEqual([
      { id: 'done', reason: 'cannot transition from completed to scheduled' },
    ])
    expect(result.updated).toHaveLength(1)
    expect(inMock).toHaveBeenCalledWith('id', ['ok'])
  })

  it('rolls back all optimistic updates on SQL failure', async () => {
    wireBulkStatusChain({ data: null, error: { message: 'SQL failed' } })
    const composable = await getComposable()
    const store = await getBookingStore()

    store.setBooking('r1', makeBooking({ id: 'r1', status: 'pending' }))
    store.setBooking('r2', makeBooking({ id: 'r2', status: 'pending' }))

    await expect(composable.bulkChangeStatus(['r1', 'r2'], 'scheduled')).rejects.toThrow()

    expect(store.bookings.get('r1')?.status).toBe('pending')
    expect(store.bookings.get('r2')?.status).toBe('pending')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/__tests__/composables/useSupabaseBookings.spec.ts
```
Expected: FAIL with "composable.bulkChangeStatus is not a function"

- [ ] **Step 3: Add `bulkChangeStatus` to `useSupabaseBookings.ts`**

Add this function inside `useSupabaseBookings()`, after `bulkAssignCleaner`:

```ts
async function bulkChangeStatus(
  bookingIds: string[],
  status: Booking['status'],
): Promise<{ updated: Booking[], skipped: { id: string, reason: string }[] }> {
  const snapshots = new Map<string, Booking>()
  const eligibleIds: string[] = []
  const skipped: { id: string, reason: string }[] = []

  for (const id of bookingIds) {
    const existing = bookingStore.bookings.get(id)
    if (!existing) {
      skipped.push({ id, reason: 'not found in local store' })
      continue
    }
    if (!canTransitionBookingStatus(existing, status)) {
      skipped.push({ id, reason: `cannot transition from ${existing.status} to ${status}` })
      continue
    }
    snapshots.set(id, existing)
    eligibleIds.push(id)
  }

  if (eligibleIds.length === 0) {
    return { updated: [], skipped }
  }

  const updateTime = new Date().toISOString()
  const updated: Booking[] = []
  for (const id of eligibleIds) {
    const existing = snapshots.get(id)!
    const next: Booking = { ...existing, status, updated_at: updateTime }
    bookingStore.setBooking(id, next)
    trackOptimistic(id)
    updated.push(next)
  }

  try {
    const { error } = await supabase
      .from('bookings')
      .update({ status, updated_at: updateTime })
      .in('id', eligibleIds)
    if (error) throw error
    return { updated, skipped }
  } catch (error) {
    for (const [id, existing] of snapshots) {
      bookingStore.setBooking(id, existing)
    }
    throw error
  } finally {
    for (const id of eligibleIds) {
      clearOptimistic(id)
    }
  }
}
```

Add `bulkChangeStatus` to the return object of `useSupabaseBookings`.

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- src/__tests__/composables/useSupabaseBookings.spec.ts
```
Expected: all tests PASS

- [ ] **Step 5: Rewrite `bulkUpdateStatus` in `useAdminBookings.ts`**

First, add `bulkChangeStatus` to the destructure from `useSupabaseBookings()`:

```ts
const {
  createBooking: supaCreate,
  updateBooking: supaUpdate,
  deleteBooking: supaDelete,
  changeBookingStatus: supaChangeStatus,
  assignCleaner: supaAssignCleaner,
  bulkAssignCleaner: supaBulkAssignCleaner,
  bulkChangeStatus: supaBulkChangeStatus,   // ← add this
} = useSupabaseBookings()
```

Replace the entire `bulkUpdateStatus` function (lines ~537–590) with:

```ts
async function bulkUpdateStatus(
  bookingIds: string[],
  status: BookingStatus,
): Promise<{ success: string[], failed: string[] }> {
  if (!currentAdminId.value) {
    error.value = 'Admin authentication required for bulk operations'
    return { success: [], failed: bookingIds }
  }

  if (bookingIds.length === 0) {
    return { success: [], failed: [] }
  }

  loading.value = true
  error.value = null
  success.value = null

  try {
    const { updated, skipped } = await supaBulkChangeStatus(bookingIds, status)
    const successIds = updated.map(b => b.id)
    const skippedIds = skipped.map(s => s.id)

    if (skipped.length > 0) {
      const counts = new Map<string, number>()
      for (const { reason } of skipped) {
        counts.set(reason, (counts.get(reason) ?? 0) + 1)
      }
      const skipSummary = [...counts].map(([r, n]) => `${n} ${r}`).join(', ')

      success.value = successIds.length > 0
        ? `Bulk status update completed: ${successIds.length} successful, ${skippedIds.length} skipped (${skipSummary})`
        : `No bookings eligible: ${skipSummary}`
    } else {
      success.value = `Bulk status update completed: ${successIds.length} successful`
    }

    return { success: successIds, failed: skippedIds }
  } catch (error_) {
    void errorHandler.handleError(error_ as Error, {
      component: 'useAdminBookings',
      operation: 'bulkUpdateStatus',
    }, { showToUser: false, reportToService: true })
    error.value = `Bulk status update failed: ${error_ instanceof Error ? error_.message : 'System error'}`
    return { success: [], failed: bookingIds }
  } finally {
    loading.value = false
  }
}
```

- [ ] **Step 6: Run full test suite**

```bash
pnpm test:run
```
Expected: all tests PASS

- [ ] **Step 7: Commit**

```bash
git add src/composables/supabase/useSupabaseBookings.ts src/composables/admin/useAdminBookings.ts src/__tests__/composables/useSupabaseBookings.spec.ts
git commit -m "perf(supabase): bulkUpdateStatus — single .in() round-trip with pre-filter + rollback"
```

---

### Task 2.2: Fix `updateProfile` to single round-trip

`useSupabaseUserProfiles.updateProfile` runs UPDATE then immediately SELECT to get server state — two round-trips. PostgREST supports `.update().eq().select().single()` which returns the updated row via `RETURNING *` in one call.

**Files:**
- Modify: `src/composables/supabase/useSupabaseUserProfiles.ts`

- [ ] **Step 1: Write the failing test in `useSupabaseUserProfiles.spec.ts`**

Create `src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts` with just this test for now (the full file is written in Task 3.4):

```ts
import type { User } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'owner',
    company_name: '',
    notifications_enabled: true,
    timezone: 'America/Los_Angeles',
    theme: 'light',
    language: 'en',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useSupabaseUserProfiles', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function getComposable() {
    const mod = await import('@/composables/supabase/useSupabaseUserProfiles')
    return mod.useSupabaseUserProfiles()
  }

  async function getStore() {
    const mod = await import('@/stores/userProfile')
    return mod.useUserProfileStore()
  }

  describe('updateProfile', () => {
    it('uses a single round-trip (update + select) without a separate fetch', async () => {
      const updatedUser = makeUser({ id: 'u1', name: 'Updated Name' })

      const singleMock = vi.fn().mockResolvedValue({ data: updatedUser, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const eqMock = vi.fn().mockReturnValue({ select: selectMock })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })

      supabaseMock.from.mockReturnValue({ update: updateMock })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', name: 'Old Name' }))

      const result = await composable.updateProfile('u1', { name: 'Updated Name' })

      expect(result.name).toBe('Updated Name')
      // select() called on the same chain — not a second .from() call
      expect(supabaseMock.from).toHaveBeenCalledTimes(1)
      expect(selectMock).toHaveBeenCalled()
    })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pnpm test -- src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts
```
Expected: FAIL (currently `from` is called twice — once for update, once for select)

- [ ] **Step 3: Fix `updateProfile` in `useSupabaseUserProfiles.ts`**

Replace the `updateProfile` function (lines 71–112) with:

```ts
async function updateProfile(userId: string, updates: Partial<User>): Promise<User> {
  const existing = userProfileStore.userProfiles.get(userId)

  const optimistic = existing
    ? { ...existing, ...updates, updated_at: new Date().toISOString() }
    : null
  if (optimistic) {
    userProfileStore.setUserProfile(userId, optimistic)
  }

  try {
    const { data, error: updateError } = await supabase
      .from('user_profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()

    if (updateError) throw updateError

    const updated = data as User
    userProfileStore.setUserProfile(userId, updated)
    return updated
  } catch (error) {
    if (existing) {
      userProfileStore.setUserProfile(userId, existing)
    }
    console.error('[useSupabaseUserProfiles] updateProfile error:', error)
    throw error
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pnpm test -- src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts
```
Expected: PASS

- [ ] **Step 5: Run full suite**

```bash
pnpm test:run
```
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/composables/supabase/useSupabaseUserProfiles.ts src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts
git commit -m "perf(supabase): updateProfile — single .update().select() round-trip via RETURNING"
```

---

### Task 2.3: Fix profile realtime to call `refreshProfile` instead of `checkAuth`

`useRealtimeSync` calls `authStore.checkAuth()` on every `user_profiles` UPDATE — that's `getSession()` + profile reload (two round-trips). Session validity is unaffected by profile preference changes. Fix: expose a lighter `refreshProfile()` from `useSupabaseAuth` and wire it through `authStore`.

**Files:**
- Modify: `src/composables/supabase/useSupabaseAuth.ts`
- Modify: `src/stores/auth.ts`
- Modify: `src/composables/supabase/useRealtimeSync.ts`

- [ ] **Step 1: Expose `refreshProfile` from `useSupabaseAuth`**

At the end of `useSupabaseAuth()`, add `refreshProfile` to the return object:

```ts
// Add this function inside useSupabaseAuth(), before the return:
async function refreshProfile(): Promise<void> {
  if (!currentUserId.value) return
  await loadUserProfileSafe(currentUserId.value)
}

// Add to return object:
return {
  // ... existing exports ...
  refreshProfile,
}
```

- [ ] **Step 2: Expose `refreshProfile` from `src/stores/auth.ts`**

In the destructure from `useSupabaseAuth()`:

```ts
const {
  // ... existing ...
  checkAuth,
  clearError: supabaseClearError,
  getAllUsers,        // will be removed in Task 3.2 — leave for now
  updateUserRole,    // will be removed in Task 3.2 — leave for now
  refreshProfile,    // ← add
} = useSupabaseAuth()
```

Add `refreshProfile` to the store's return object:

```ts
return {
  // ... existing exports ...
  refreshProfile,
}
```

- [ ] **Step 3: Update `useRealtimeSync.ts` to call `refreshProfile`**

Replace lines 46–50 in `subscribeToProfileChanges()`:

```ts
// BEFORE:
() => {
  authStore.checkAuth().catch((error: unknown) =>
    console.error('[useRealtimeSync] profile checkAuth failed:', error),
  )
}

// AFTER:
() => {
  authStore.refreshProfile().catch((error: unknown) =>
    console.error('[useRealtimeSync] profile refresh failed:', error),
  )
}
```

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/composables/supabase/useSupabaseAuth.ts src/stores/auth.ts src/composables/supabase/useRealtimeSync.ts
git commit -m "perf(supabase): profile realtime fires refreshProfile() not checkAuth() — saves 1 round-trip"
```

---

## Phase 3 — Architecture Cleanup

### Task 3.1: Add full CRUD + realtime to `useSupabaseCleanerTeams`

Team mutations currently don't exist at the composable layer — they're simply absent. Add `createTeam`, `updateTeam`, `deleteTeam`, `subscribe`, and `unsubscribe` following the same module-level singleton pattern as `useSupabaseBookings`.

**Files:**
- Modify: `src/composables/supabase/useSupabaseCleanerTeams.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/__tests__/composables/supabase/useSupabaseCleanerTeams.spec.ts`:

```ts
import type { CleanerTeam, CleanerTeamFormData } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function makeTeam(overrides: Partial<CleanerTeam> = {}): CleanerTeam {
  return {
    id: 'team-1',
    name: 'Team Alpha',
    member_ids: ['cleaner-1', 'cleaner-2'],
    active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

function makeFormData(overrides: Partial<CleanerTeamFormData> = {}): CleanerTeamFormData {
  return {
    name: 'Team Beta',
    member_ids: ['cleaner-3'],
    active: true,
    ...overrides,
  }
}

describe('useSupabaseCleanerTeams', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function getComposable() {
    const mod = await import('@/composables/supabase/useSupabaseCleanerTeams')
    return mod.useSupabaseCleanerTeams()
  }

  async function getStore() {
    const mod = await import('@/stores/cleanerTeam')
    return mod.useCleanerTeamStore()
  }

  describe('createTeam', () => {
    it('optimistically adds team to store and resolves', async () => {
      let resolveInsert!: (v: any) => void
      const insertPromise = new Promise(res => { resolveInsert = res })

      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockReturnValue(insertPromise),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      const createPromise = composable.createTeam(makeFormData())

      // Optimistic: store has the team before Supabase resolves
      expect(store.teams.size).toBe(1)

      resolveInsert({ data: null, error: null })
      const result = await createPromise

      expect(result.name).toBe('Team Beta')
      expect(store.teams.size).toBe(1)
    })

    it('rolls back on Supabase error', async () => {
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
        update: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      await expect(composable.createTeam(makeFormData())).rejects.toThrow()
      expect(store.teams.size).toBe(0)
    })
  })

  describe('updateTeam', () => {
    it('optimistically updates and rolls back on failure', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      const existing = makeTeam({ id: 't1', name: 'Original' })
      store.setTeam('t1', existing)

      await expect(composable.updateTeam('t1', { name: 'Changed' })).rejects.toThrow()
      expect(store.teams.get('t1')?.name).toBe('Original')
    })
  })

  describe('deleteTeam', () => {
    it('soft-deletes optimistically and rolls back on failure', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
      supabaseMock.from.mockReturnValue({
        select: vi.fn().mockReturnValue({ order: vi.fn().mockResolvedValue({ data: [], error: null }) }),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
        update: updateMock,
        delete: vi.fn().mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }),
      })
      supabaseMock.channel = vi.fn().mockReturnValue({ on: vi.fn().mockReturnThis(), subscribe: vi.fn().mockReturnThis() })
      supabaseMock.removeChannel = vi.fn()

      const composable = await getComposable()
      const store = await getStore()

      const existing = makeTeam({ id: 't2' })
      store.setTeam('t2', existing)

      await expect(composable.deleteTeam('t2')).rejects.toThrow()
      // Rolled back — team is back
      expect(store.teams.get('t2')).toEqual(existing)
    })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pnpm test -- src/__tests__/composables/supabase/useSupabaseCleanerTeams.spec.ts
```
Expected: FAIL — `createTeam`, `updateTeam`, `deleteTeam` do not exist

- [ ] **Step 3: Rewrite `useSupabaseCleanerTeams.ts` with full CRUD + realtime**

Replace the entire file contents:

```ts
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CleanerTeam, CleanerTeamFormData } from '@/types'
import { v4 as uuidv4 } from 'uuid'
import { ref } from 'vue'
import { supabase } from '@/plugins/supabase'
import { useCleanerTeamStore } from '@/stores/cleanerTeam'

// Module-level singleton state — matches useSupabaseBookings / useSupabaseProperties pattern
let channel: RealtimeChannel | null = null
const optimisticIds = new Set<string>()
const connectionStatus = ref<'connecting' | 'connected' | 'disconnected'>('disconnected')
const OPTIMISTIC_SAFETY_TIMEOUT = 30_000

export function useSupabaseCleanerTeams() {
  const cleanerTeamStore = useCleanerTeamStore()

  async function fetchAll(): Promise<void> {
    cleanerTeamStore.loading = true
    cleanerTeamStore.error = null
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      cleanerTeamStore.setTeams((data ?? []) as CleanerTeam[])
    } catch (error) {
      cleanerTeamStore.error = error instanceof Error ? error.message : 'Failed to fetch cleaner teams'
      console.error('[useSupabaseCleanerTeams] fetchAll error:', error)
      throw error
    } finally {
      cleanerTeamStore.loading = false
    }
  }

  async function fetchActive(): Promise<void> {
    cleanerTeamStore.loading = true
    cleanerTeamStore.error = null
    try {
      const { data, error: fetchError } = await supabase
        .from('cleaner_teams')
        .select('*')
        .eq('active', true)
        .order('name', { ascending: true })
      if (fetchError) throw fetchError
      cleanerTeamStore.setTeams((data ?? []) as CleanerTeam[])
    } catch (error) {
      cleanerTeamStore.error = error instanceof Error ? error.message : 'Failed to fetch active teams'
      console.error('[useSupabaseCleanerTeams] fetchActive error:', error)
      throw error
    } finally {
      cleanerTeamStore.loading = false
    }
  }

  function subscribe(): void {
    if (channel) return
    connectionStatus.value = 'connecting'
    channel = supabase
      .channel('cleaner-teams-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'cleaner_teams' },
        payload => handleRealtimeEvent(payload))
      .subscribe(status => {
        if (status === 'SUBSCRIBED') connectionStatus.value = 'connected'
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') connectionStatus.value = 'disconnected'
      })
  }

  function unsubscribe(): void {
    if (channel) {
      supabase.removeChannel(channel)
      channel = null
    }
    connectionStatus.value = 'disconnected'
    optimisticIds.clear()
  }

  function handleRealtimeEvent(payload: any): void {
    try {
      const { eventType, new: newRecord, old: oldRecord } = payload
      const id = (newRecord || oldRecord)?.id
      if (!id) return
      switch (eventType) {
        case 'INSERT':
        case 'UPDATE': {
          if (optimisticIds.has(id)) return
          if (newRecord.active === false) {
            cleanerTeamStore.removeTeam(id)
          } else {
            cleanerTeamStore.setTeam(id, newRecord as CleanerTeam)
          }
          break
        }
        case 'DELETE': {
          optimisticIds.delete(id)
          cleanerTeamStore.removeTeam(oldRecord.id)
          break
        }
      }
    } catch (error) {
      console.error('[useSupabaseCleanerTeams] realtime event error:', error, payload)
    }
  }

  function trackOptimistic(id: string): void {
    optimisticIds.add(id)
    setTimeout(() => optimisticIds.delete(id), OPTIMISTIC_SAFETY_TIMEOUT)
  }

  function clearOptimistic(id: string): void {
    optimisticIds.delete(id)
  }

  async function createTeam(formData: CleanerTeamFormData): Promise<CleanerTeam> {
    const id = uuidv4()
    const now = new Date().toISOString()
    const team: CleanerTeam = { id, ...formData, created_at: now, updated_at: now }

    cleanerTeamStore.setTeam(id, team)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('cleaner_teams').insert(team)
      if (error) throw error
      return team
    } catch (error) {
      cleanerTeamStore.removeTeam(id)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  async function updateTeam(id: string, updates: Partial<CleanerTeam>): Promise<CleanerTeam> {
    const existing = cleanerTeamStore.teams.get(id)
    if (!existing) throw new Error('Team not found')

    const updated: CleanerTeam = { ...existing, ...updates, updated_at: new Date().toISOString() }
    cleanerTeamStore.setTeam(id, updated)
    trackOptimistic(id)

    try {
      const { error } = await supabase.from('cleaner_teams').update(updates).eq('id', id)
      if (error) throw error
      return updated
    } catch (error) {
      cleanerTeamStore.setTeam(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  // Soft-delete: sets active = false, removes from store
  async function deleteTeam(id: string): Promise<void> {
    const existing = cleanerTeamStore.teams.get(id)
    if (!existing) throw new Error('Team not found')

    cleanerTeamStore.removeTeam(id)
    trackOptimistic(id)

    try {
      const { error } = await supabase
        .from('cleaner_teams')
        .update({ active: false, updated_at: new Date().toISOString() })
        .eq('id', id)
      if (error) throw error
    } catch (error) {
      cleanerTeamStore.setTeam(id, existing)
      throw error
    } finally {
      clearOptimistic(id)
    }
  }

  return {
    fetchAll,
    fetchActive,
    subscribe,
    unsubscribe,
    createTeam,
    updateTeam,
    deleteTeam,
    connectionStatus,
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pnpm test -- src/__tests__/composables/supabase/useSupabaseCleanerTeams.spec.ts
```
Expected: all PASS

- [ ] **Step 5: Run full suite**

```bash
pnpm test:run
```
Expected: all tests PASS

- [ ] **Step 6: Commit**

```bash
git add src/composables/supabase/useSupabaseCleanerTeams.ts src/__tests__/composables/supabase/useSupabaseCleanerTeams.spec.ts
git commit -m "feat(supabase): add full CRUD + realtime to useSupabaseCleanerTeams"
```

---

### Task 3.2: Remove admin methods from `useSupabaseAuth` and auth store

`useSupabaseAuth` has `getAllUsers`, `updateUserRole`, `deleteUser`, and `createAdminUser` — admin operations that don't belong in the auth composable. `useAdminUserManagement` already delegates to `useSupabaseUserProfiles` and the `admin-users` Edge Function. Remove the duplicates.

**Files:**
- Modify: `src/composables/supabase/useSupabaseAuth.ts`
- Modify: `src/stores/auth.ts`

- [ ] **Step 1: Remove from `useSupabaseAuth.ts`**

Delete these four functions entirely from `useSupabaseAuth.ts`:
- `getAllUsers()` (lines ~344–356)
- `updateUserRole()` (lines ~358–377)
- `deleteUser()` (lines ~379–401)
- `createAdminUser()` (lines ~403–447)

Remove them from the return object too.

- [ ] **Step 2: Update `src/stores/auth.ts`**

Remove `getAllUsers` and `updateUserRole` from the destructure of `useSupabaseAuth()`:

```ts
// Remove these two lines from the destructure:
//   getAllUsers,
//   updateUserRole,
```

Remove them from the store's return object if present.

- [ ] **Step 3: Search for callers**

```bash
grep -rn "getAllUsers\|updateUserRole\|deleteUser\|createAdminUser" src/ --include="*.ts" --include="*.vue"
```

Any remaining references to these methods must be updated to use `useSupabaseUserProfiles` or `useAdminUserManagement` instead. `useAdminUserManagement` already has the correct implementations.

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```
Expected: all tests PASS. If `useSupabaseAuth.spec.ts` tests the removed methods, delete those test cases.

- [ ] **Step 5: Build check**

```bash
pnpm build:fast
```
Expected: no TypeScript errors related to removed methods.

- [ ] **Step 6: Commit**

```bash
git add src/composables/supabase/useSupabaseAuth.ts src/stores/auth.ts
git commit -m "refactor(supabase): remove admin user ops from useSupabaseAuth — callers use useAdminUserManagement"
```

---

### Task 3.3: Remove `fetchAllProperties` no-op from `useAdminBookings`

`fetchAllProperties: () => Promise.resolve()` was added to satisfy a test expectation and was never implemented. Callers that await it silently get nothing.

**Files:**
- Modify: `src/composables/admin/useAdminBookings.ts`
- Modify: `src/__tests__/composables/admin/useAdminBookings.spec.ts` (if it references the no-op)

- [ ] **Step 1: Remove from return object**

Find line ~857 in `useAdminBookings.ts`:
```ts
fetchAllProperties: () => Promise.resolve(),
```
Delete it.

- [ ] **Step 2: Search for callers**

```bash
grep -rn "fetchAllProperties" src/ --include="*.ts" --include="*.vue"
```

For any caller that awaits `fetchAllProperties()`, remove the call. Properties are loaded by `useRealtimeSync` via `useSupabaseProperties` — no explicit fetch is needed.

- [ ] **Step 3: Update test if needed**

If `useAdminBookings.spec.ts` tests `fetchAllProperties`, remove those test cases.

- [ ] **Step 4: Run tests**

```bash
pnpm test:run
```
Expected: all tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useAdminBookings.ts
git commit -m "refactor(admin): remove fetchAllProperties no-op from useAdminBookings"
```

---

### Task 3.4: Complete test files for `useSupabaseCleanerTeams` and `useSupabaseUserProfiles`

Task 2.2 created a stub spec for `useSupabaseUserProfiles`. Task 3.1 created the full spec for `useSupabaseCleanerTeams`. This task completes the `useSupabaseUserProfiles` spec with full coverage.

**Files:**
- Modify: `src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts`

- [ ] **Step 1: Expand `useSupabaseUserProfiles.spec.ts` with full coverage**

Replace the file with:

```ts
import type { User, UserRole } from '@/types'
import { createPinia, setActivePinia } from 'pinia'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    email: 'user@test.com',
    name: 'Test User',
    role: 'owner' as UserRole,
    company_name: '',
    notifications_enabled: true,
    timezone: 'America/Los_Angeles',
    theme: 'light',
    language: 'en',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  }
}

describe('useSupabaseUserProfiles', () => {
  let supabaseMock: any

  beforeEach(async () => {
    vi.resetModules()
    setActivePinia(createPinia())
    const supabaseModule = await import('@/plugins/supabase')
    supabaseMock = supabaseModule.supabase
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  async function getComposable() {
    const mod = await import('@/composables/supabase/useSupabaseUserProfiles')
    return mod.useSupabaseUserProfiles()
  }

  async function getStore() {
    const mod = await import('@/stores/userProfile')
    return mod.useUserProfileStore()
  }

  describe('fetchAll', () => {
    it('populates the store with fetched users', async () => {
      const users = [makeUser({ id: 'u1' }), makeUser({ id: 'u2' })]
      const limitMock = vi.fn().mockResolvedValue({ data: users, error: null })
      const orderMock = vi.fn().mockReturnValue({ limit: limitMock })
      const selectMock = vi.fn().mockReturnValue({ order: orderMock })
      supabaseMock.from.mockReturnValue({ select: selectMock })

      const composable = await getComposable()
      const store = await getStore()
      await composable.fetchAll()

      expect(store.userProfiles.size).toBe(2)
    })
  })

  describe('updateProfile', () => {
    it('uses a single round-trip (update + select)', async () => {
      const updatedUser = makeUser({ id: 'u1', name: 'Updated' })
      const singleMock = vi.fn().mockResolvedValue({ data: updatedUser, error: null })
      const selectMock = vi.fn().mockReturnValue({ single: singleMock })
      const eqMock = vi.fn().mockReturnValue({ select: selectMock })
      const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
      supabaseMock.from.mockReturnValue({ update: updateMock })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', name: 'Old' }))

      const result = await composable.updateProfile('u1', { name: 'Updated' })

      expect(result.name).toBe('Updated')
      expect(supabaseMock.from).toHaveBeenCalledTimes(1)
    })

    it('rolls back optimistic update on failure', async () => {
      const eqMock = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } }),
        }),
      })
      supabaseMock.from.mockReturnValue({ update: vi.fn().mockReturnValue({ eq: eqMock }) })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', name: 'Original' }))

      await expect(composable.updateProfile('u1', { name: 'Changed' })).rejects.toThrow()
      expect(store.userProfiles.get('u1')?.name).toBe('Original')
    })
  })

  describe('bulkUpdateRole', () => {
    it('optimistically updates all users and succeeds', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: null })
      supabaseMock.from.mockReturnValue({
        update: vi.fn().mockReturnValue({ eq: eqMock }),
      })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', role: 'owner' }))
      store.setUserProfile('u2', makeUser({ id: 'u2', role: 'owner' }))

      await composable.bulkUpdateRole(['u1', 'u2'], 'cleaner')

      expect(store.userProfiles.get('u1')?.role).toBe('cleaner')
      expect(store.userProfiles.get('u2')?.role).toBe('cleaner')
    })

    it('rolls back all optimistic updates on failure', async () => {
      supabaseMock.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockRejectedValue(new Error('SQL failed')),
        }),
      })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1', role: 'owner' }))
      store.setUserProfile('u2', makeUser({ id: 'u2', role: 'owner' }))

      await expect(composable.bulkUpdateRole(['u1', 'u2'], 'cleaner')).rejects.toThrow()

      expect(store.userProfiles.get('u1')?.role).toBe('owner')
      expect(store.userProfiles.get('u2')?.role).toBe('owner')
    })
  })

  describe('deleteProfile', () => {
    it('optimistically removes and rolls back on failure', async () => {
      const eqMock = vi.fn().mockResolvedValue({ data: null, error: { message: 'fail' } })
      supabaseMock.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: eqMock }),
      })

      const composable = await getComposable()
      const store = await getStore()
      store.setUserProfile('u1', makeUser({ id: 'u1' }))

      await expect(composable.deleteProfile('u1')).rejects.toThrow()
      expect(store.userProfiles.get('u1')).toBeDefined()
    })
  })
})
```

- [ ] **Step 2: Run tests**

```bash
pnpm test -- src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts
```
Expected: all PASS

- [ ] **Step 3: Run full suite + build**

```bash
pnpm test:run && pnpm build
```
Expected: all tests PASS, build succeeds with no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts
git commit -m "test(supabase): add full coverage for useSupabaseUserProfiles — updateProfile, bulkUpdateRole, deleteProfile"
```

---

## Verification Checklist

After all tasks, re-run the Supabase security and performance advisors to confirm the advisor warnings are resolved:

```
mcp__claude_ai_Supabase__get_advisors: { project_id: "aejkrsvemqnftivzkkxd", type: "security" }
mcp__claude_ai_Supabase__get_advisors: { project_id: "aejkrsvemqnftivzkkxd", type: "performance" }
```

Expected remaining warnings after completion:
- **Security:** Zero critical warnings. Anonymous-access warnings on `bookings`/`properties`/`user_profiles` reduced (RESTRICTIVE policies now block mutations).
- **Performance:** `multiple_permissive_policies` on `cleaner_teams` resolved. 17 unused indexes remain (deferred per spec — revisit after 4 weeks of production traffic).
