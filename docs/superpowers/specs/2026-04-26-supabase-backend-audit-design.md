# Supabase Backend Audit — Design Spec
**Date:** 2026-04-26
**Branch:** chore/observability-sentry-wire
**Scope:** Full audit of CRUD, realtime sync, composables, RLS, performance, and architecture

---

## 1. Problem Statement

Three distinct problem areas identified through codebase review and live Supabase advisor data:

1. **Race conditions** between layout initialization and child page mounting — pages read from empty Pinia stores because Vue fires `onMounted` bottom-up (child before parent).
2. **Security gaps** — two ad-hoc tables with fully open RLS policies, `auth.admin` calls in browser code requiring service_role key, and implicit (not explicit) anonymous-user protection on core tables.
3. **Architecture and performance gaps** — missing CRUD composable layer for `cleaner_teams`, dual access paths for `user_profiles`, dead placeholder code, unused index bloat, and N+1 round-trip patterns in bulk operations.

---

## 2. Surface Area Mapped

### Supabase Composables (`src/composables/supabase/`)

| Composable | Tables | Realtime | Optimistic | CRUD |
|---|---|---|---|---|
| `useSupabaseBookings` | `bookings` | ✅ singleton channel, role-scoped | ✅ + rollback | Full + `bulkAssignCleaner` |
| `useSupabaseProperties` | `properties` | ✅ singleton channel, no filter | ✅ + rollback | Full (soft-delete) |
| `useSupabaseAuth` | `user_profiles`, `auth.users` | ❌ | ❌ | Auth lifecycle + leaking admin ops |
| `useSupabaseUserProfiles` | `user_profiles` | ❌ | ✅ partial | Full + `bulkUpdateRole` |
| `useSupabaseCleanerTeams` | `cleaner_teams` | ❌ | ❌ | **Read-only only** |
| `useRealtimeSync` | orchestrator | ✅ profiles channel | n/a | init / teardown |

### Schema (6 tables in migrations)
`user_profiles`, `properties`, `bookings`, `cleaner_teams` — plus ad-hoc `calendar_events` and `test_table` with no migration files.

### RLS Layer
`private` schema helpers: `is_owner()`, `is_admin()`, `is_cleaner()`, `current_user_id()` — all `STABLE`, all wrapped in `(SELECT ...)` for InitPlan hoisting (925 ms → 5.8 ms at 10k rows, documented in migration `20260425194826`).

### Test Coverage
28 spec files exist. **Missing:** `useSupabaseCleanerTeams`, `useSupabaseUserProfiles`.

---

## 3. Domain 1 — Initialization Race Conditions

### Root Cause
Vue 3 fires `onMounted` **bottom-up**: child components inside `<router-view>` mount and execute their `onMounted` before the parent layout's `onMounted` runs. Both layouts call `initRealtimeSync()` (and for admin, `fetchAllUsers()` + `fetchCleaners()`) inside `onMounted`. Pages that read from `bookingStore` or `propertyStore` in their own `onMounted` see empty Maps.

### Evidence

| Location | Issue |
|---|---|
| `src/layouts/admin.vue:243` | `onMounted` calls `Promise.all([fetchAllUsers, fetchCleaners, initRealtimeSync])` — after child pages have already mounted |
| `src/layouts/owner.vue:183` | `initRealtimeSync()` fire-and-forget (not awaited); pages mount into empty stores |
| Both layouts | No `provide/inject` to share loading/ready state with child pages |
| Both layouts | `initRealtimeSync()` failure swallowed into `console.error`; pages silently render empty |

### Secondary Race
`useRealtimeSync` registers `window.addEventListener('online', onOnline)` inside its own `onMounted`. If the composable instance is created but somehow not mounted before navigation occurs, the reconnect listener may not attach.

### Fix Design

**Part A — Reactive pages only.** Pages must never read from stores in `onMounted` and assume data is there. All data access should be via reactive `computed` properties or `watchEffect`. When the layout's fetch resolves and stores populate, Vue's reactivity propagates automatically.

**Part B — Shared AppStatus via `provide/inject`.** Both layouts provide:
```ts
interface AppStatus {
  isReady: Ref<boolean>      // true once initRealtimeSync resolves
  initError: Ref<Error | null> // non-null if init threw
}
provide('appStatus', reactive({ isReady, initError }))
```
Pages and components `inject('appStatus')` to:
- Gate `v-skeleton-loader` on `!isReady`
- Show a persistent `v-banner` when `initError` is set

**Part C — Admin layout loading state.** The existing `loading` ref in `admin.vue` should be unified with `isReady` rather than maintained separately.

---

## 4. Domain 2 — Security

### 4.1 Critical: Ad-hoc tables with open policies

**Tables:** `public.calendar_events`, `public.test_table`
**Status:** No migration file. Created ad-hoc in Supabase dashboard.
**Risk:** `calendar_events` allows INSERT, UPDATE, DELETE with `USING (true)` / `WITH CHECK (true)` for any user (including anonymous). `test_table` allows UPDATE with `USING (true)`.
**Confirmed by:** Supabase security advisor (live MCP query, 2026-04-26).

**Fix:** Drop both tables via a new migration. Neither has any client-side code referencing them. If `calendar_events` becomes a real feature it gets a proper migration with scoped policies.

```sql
-- new migration: drop dev artifact tables
DROP TABLE IF EXISTS public.calendar_events;
DROP TABLE IF EXISTS public.test_table;
```

### 4.2 Critical: `auth.admin` calls in browser code

**Location:** `useSupabaseAuth.ts:390`, `useSupabaseAuth.ts:411`
**Issue:** `supabase.auth.admin.deleteUser(userId)` and `supabase.auth.admin.createUser(...)` require the `service_role` key. The browser uses the anon key. These calls 401 silently. User deletion currently removes the `user_profiles` row but leaves the `auth.users` record orphaned.

**Fix:** Remove both methods from `useSupabaseAuth`. Implement a Supabase Edge Function `admin-user-ops` that accepts `{ action: 'delete' | 'create', ... }` and runs with `service_role`. The browser composable calls the Edge Function via a signed request.

### 4.3 Hardening: `cleaner_teams` uses `TO public` (includes `anon` role)

**Current:** Both `cleaner_teams` policies use `TO public` — the PostgreSQL `public` role includes `anon` (unauthenticated requests). Supabase advisor confirms anonymous access + multiple permissive policies for SELECT (evaluated separately and OR'd per query).

**Fix:** Merge both policies into one, change to `TO authenticated`, wrap all helpers in `(SELECT ...)`:

```sql
DROP POLICY IF EXISTS "Admins can manage all teams" ON public.cleaner_teams;
DROP POLICY IF EXISTS "Cleaners can view own teams" ON public.cleaner_teams;

CREATE POLICY "Authenticated can view permitted teams"
  ON public.cleaner_teams FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin())
    OR (
      (SELECT private.is_cleaner())
      AND (SELECT private.current_user_id()) = ANY(member_ids)
    )
  );

CREATE POLICY "Admins can manage teams"
  ON public.cleaner_teams FOR ALL TO authenticated
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));
```

This resolves both the anonymous access warning and the multiple permissive policies performance warning.

### 4.4 Hardening: Anonymous users on core tables

**Context:** Supabase has anonymous sign-ins enabled. Anonymous users assume the `authenticated` role, so `TO authenticated` policies apply to them. The `is_owner()` / `is_admin()` / `is_cleaner()` helpers implicitly protect data (anonymous users have no profile row → helpers return false). But this is implicit — a change to helper logic could silently remove the protection.

**Fix:** Add a `RESTRICTIVE` policy (AND'd with all others, not OR'd) on `bookings`, `properties`, and `user_profiles` that explicitly blocks anonymous JWTs from mutating data:

```sql
-- Per Supabase docs: https://supabase.com/docs/guides/auth/auth-anonymous#access-control
CREATE POLICY "Block anonymous writes"
  ON public.bookings AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

-- Repeat for public.properties, public.user_profiles
```

**Reference:** [Supabase Anonymous Sign-In docs](https://supabase.com/docs/guides/auth/auth-anonymous#access-control)

---

## 5. Domain 3 — Performance

### 5.1 Fix: `bulkUpdateStatus` uses N round-trips

**Location:** `useAdminBookings.ts:551`
**Issue:** `Promise.allSettled(bookingIds.map(id => supabase.from('bookings').update({status}).eq('id', id)))` — one HTTP request per booking ID. `bulkAssignCleaner` in the same file uses a single `.update().in('id', eligibleIds)` call.

**Fix:** Port the `bulkAssignCleaner` pattern to `bulkUpdateStatus`:
- Pre-filter in JS: exclude bookings where `canTransitionBookingStatus(existing, status)` returns false → `skipped` list
- Optimistic-update all eligible IDs
- Single `.update({status, updated_at}).in('id', eligibleIds)` call
- Rollback all on SQL failure

### 5.2 Fix: `updateProfile` in `useSupabaseUserProfiles` does two round-trips

**Location:** `useSupabaseUserProfiles.ts:83–99`
**Issue:** UPDATE → then SELECT to get server state. PostgREST supports returning the updated row in the same call.

**Fix:**
```ts
const { data, error } = await supabase
  .from('user_profiles')
  .update({ ...updates, updated_at: new Date().toISOString() })
  .eq('id', userId)
  .select()
  .single()
```
One round-trip, no stale-read window.

### 5.3 Fix: Profile realtime fires full `checkAuth()` on every UPDATE

**Location:** `useRealtimeSync.ts:47`
**Issue:** Any UPDATE to `user_profiles` triggers `authStore.checkAuth()` → `getSession()` + profile reload = 2 network calls. Session validity is unaffected by preference changes.

**Fix:** Expose `loadUserProfile(userId)` from `useSupabaseAuth` and call it directly from the realtime handler instead of `checkAuth()`.

### 5.4 Fix: `cleaner_teams` multiple permissive SELECT policies (perf + security)

Covered in Section 4.3. Merging the two policies into one eliminates the double-evaluation on every SELECT.

### 5.5 Defer: 17 unused indexes

**Affected indexes:** `idx_bookings_assigned_cleaner_id`, `idx_bookings_status_created_id_desc`, `idx_bookings_owner_id`, `idx_bookings_property_id`, `idx_bookings_status`, `idx_bookings_owner_status_created_desc`, `idx_bookings_cleaner_status_created_asc`, `idx_bookings_owner_status_created_id_desc`, `idx_bookings_cleaner_status_created_id_asc`, `idx_bookings_assigned_team`, `idx_properties_owner_created`, `idx_properties_owner_id`, `idx_properties_active`, `idx_properties_owner_active`, `idx_user_profiles_role`, `idx_user_profiles_email`, `idx_cleaner_teams_active`

**Action:** Do not drop based on dev-environment stats. Re-run Supabase performance advisor after 4 weeks of production traffic. Drop only indexes that remain zero-use in production.

### 5.6 Defer: Auth DB connection cap

Supabase advisor flags absolute 10 connection cap on Auth. Revisit when approaching an instance size upgrade.

### 5.7 Observe: `useSupabaseProperties` missing owner-scoped subscription filter

`useSupabaseBookings` scopes its channel with `filter: owner_id=eq.${userId}` for owner role. `useSupabaseProperties` uses no filter — relies on RLS post-hoc. Both approaches are correct but inconsistent. Document and align in a follow-on PR.

---

## 6. Domain 4 — Architecture & Code Quality

### 6.1 `useSupabaseCleanerTeams` is read-only; CRUD lives as raw Supabase calls in `useCleanerManagement`

**Issue:** `useCleanerManagement.ts` imports `supabase` directly and calls `.from('cleaner_teams').insert/update/delete` inline. This bypasses the composable layer: no optimistic updates, no rollback, no singleton channel guard, no test coverage.

**Fix:** Add to `useSupabaseCleanerTeams`:
- Module-level `channel: RealtimeChannel | null` + `optimisticIds: Set<string>` + `connectionStatus` (matching the pattern in `useSupabaseBookings`)
- `createTeam(formData)` — optimistic insert + rollback
- `updateTeam(id, updates)` — optimistic update + rollback
- `deleteTeam(id)` — soft-delete (`active = false`) or hard-delete based on business rule + rollback
- `subscribe()` / `unsubscribe()`

`useCleanerManagement` delegates to `useSupabaseCleanerTeams` exactly as `useAdminBookings` delegates to `useSupabaseBookings`.

### 6.2 Dual access paths for `user_profiles`

**Issue:** `useSupabaseAuth.getAllUsers()` and `useSupabaseUserProfiles.fetchAll()` both query `user_profiles.*`. `getAllUsers()` returns raw data without populating `userProfileStore` — callers get a one-shot snapshot with no reactivity.

**Fix:** Remove `getAllUsers()`, `updateUserRole()`, `deleteUser()`, and `createAdminUser()` from `useSupabaseAuth`. Callers use `useSupabaseUserProfiles` instead. `useSupabaseAuth` owns only: sign-in, sign-up, sign-out, token refresh, and current-user profile load.

### 6.3 `useAdminBookings.fetchAllProperties` is a dead no-op

**Location:** `useAdminBookings.ts:857`
**Issue:** `fetchAllProperties: () => Promise.resolve()` — added to satisfy test expectations, never implemented. Callers that await it get no data.

**Fix:** Remove from the return object. Properties are loaded by `useRealtimeSync` via `useSupabaseProperties`. Callers read `propertyStore` directly.

### 6.4 No layout-level error state shared with child pages

**Issue:** Both layouts swallow `initRealtimeSync()` failures. Pages render with empty stores and no user-visible error.

**Fix:** Covered in Domain 1 fix (Part B): layouts `provide('appStatus', { isReady, initError })`; pages `inject` and surface `initError` via `v-banner`.

### 6.5 Test coverage gaps

| Gap | Risk |
|---|---|
| `useSupabaseCleanerTeams` — no spec file | Team CRUD has zero test surface |
| `useSupabaseUserProfiles` — no spec file | Bulk role update, optimistic rollback untested |
| Admin methods in `useSupabaseAuth` (`createAdminUser`, `deleteUser`) | Broken `auth.admin` call is untested and silently fails in production |

**Fix:** After moving admin methods to their correct homes (6.2), add:
- `src/__tests__/composables/supabase/useSupabaseCleanerTeams.spec.ts`
- `src/__tests__/composables/supabase/useSupabaseUserProfiles.spec.ts`

Follow the mock structure in `useSupabaseBookings.spec.ts`.

---

## 7. Implementation Sequence

### Phase 0 — Security (ship before any new feature work)

| # | Task | Touches |
|---|---|---|
| 0.1 | Drop `calendar_events` + `test_table` via migration | new migration |
| 0.2 | Add `RESTRICTIVE` anonymous-block policies to `bookings`, `properties`, `user_profiles` | new migration |
| 0.3 | Fix `cleaner_teams`: `TO authenticated` + merge SELECT policies | new migration |
| 0.4 | Remove `auth.admin` calls from `useSupabaseAuth`; add Edge Function stub | `useSupabaseAuth.ts`, new edge fn |

### Phase 1 — Race Condition Fix

| # | Task | Touches |
|---|---|---|
| 1.1 | Both layouts `provide('appStatus', { isReady, initError })` | `layouts/admin.vue`, `layouts/owner.vue` |
| 1.2 | Audit pages for `onMounted` store reads; convert to `computed` / `watchEffect` | `src/pages/**` |
| 1.3 | Pages `inject('appStatus')` and render skeleton / error banner accordingly | affected pages |

### Phase 2 — Performance Quick Wins

| # | Task | Touches |
|---|---|---|
| 2.1 | `bulkUpdateStatus` → single `.update().in()` with pre-filter + rollback | `useAdminBookings.ts` |
| 2.2 | `updateProfile` → single `.update().select()` call | `useSupabaseUserProfiles.ts` |
| 2.3 | Profile realtime → `loadUserProfile()` instead of `checkAuth()` | `useRealtimeSync.ts` |

### Phase 3 — Architecture Cleanup

| # | Task | Touches |
|---|---|---|
| 3.1 | Add full CRUD + realtime to `useSupabaseCleanerTeams` | `useSupabaseCleanerTeams.ts` |
| 3.2 | `useCleanerManagement` delegates team mutations to `useSupabaseCleanerTeams` | `useCleanerManagement.ts` |
| 3.3 | Move admin user ops out of `useSupabaseAuth` → `useSupabaseUserProfiles` | both composables |
| 3.4 | Remove `fetchAllProperties` no-op from `useAdminBookings` | `useAdminBookings.ts` |
| 3.5 | Add spec files: `useSupabaseCleanerTeams.spec.ts`, `useSupabaseUserProfiles.spec.ts` | `src/__tests__/composables/supabase/` |

### Phase 4 — Deferred / Observe

| # | Item | Action |
|---|---|---|
| 4.1 | 17 unused indexes | Re-run advisor after 4 weeks of production traffic; drop zero-use indexes then |
| 4.2 | Auth DB connection cap (absolute 10) | Revisit at instance size upgrade |
| 4.3 | `useSupabaseProperties` missing owner-scoped subscription filter | Document inconsistency; align in follow-on PR |

---

## 8. Key Supabase Documentation References

- [Anonymous Sign-In & RLS access control](https://supabase.com/docs/guides/auth/auth-anonymous#access-control)
- [Row Level Security performance recommendations](https://supabase.com/docs/guides/database/postgres/row-level-security#rls-performance-recommendations)
- [Database linter: permissive RLS policy](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)
- [Database linter: multiple permissive policies](https://supabase.com/docs/guides/database/database-linter?lint=0006_multiple_permissive_policies)
- [Database advisor: anonymous sign-ins](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0012_auth_allow_anonymous_sign_ins)
- [Going to production checklist](https://supabase.com/docs/guides/deployment/going-into-prod)
