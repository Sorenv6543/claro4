# PR Review Fixes — Design Spec

**Date:** 2026-03-09
**Branch:** feat/owner-property-view
**Scope:** All findings from the comprehensive PR review (critical, important, suggestions)
**Strategy:** Fix everything on the current branch before merging (Option A)

---

## Decisions

| Question | Decision |
|----------|----------|
| Settings representation | Flat fields only — remove `settings?: UserSettings` from all types |
| Error propagation | Re-throw for programming/store errors; `error.value` + return `false` for known partial failures |
| Approach | Fix all issues on current branch in one pass |

---

## Section 1: Types

### `src/types/booking.ts`
- Remove `[key: string]: any` index signature from `Booking`. This masked the `cleaning_duration` regression. Callers needing `Record<string, unknown>` use the existing `BookingRecord` alias.
- Keep `priority` required (correct change from the PR).
- Add `priority` validation to the `isBooking` type guard: `['low','normal','high','urgent'].includes(b.priority)`.
- Remove the redundant `priority` re-declaration from `BookingWithMetadata` — it already inherits from `Booking`.

### `src/types/user.ts`
- Remove `settings?: UserSettings` from `User`, `PropertyOwner`, `Admin`, and `Cleaner`. Flat fields (`notifications_enabled`, `timezone`, `theme`, `language`) are the single source of truth.
- The `UserSettings` interface can be removed or kept as a utility type for `updateUserSettings` call signatures — keep it only if used.

### `src/composables/shared/useAuth.ts` — mock users
- Add required flat fields to both mock users: `notifications_enabled: true, timezone: 'America/New_York', theme: 'light', language: 'en'`.
- Remove `settings: { ... }` objects from both mock users.

### `src/utils/authHelpers.ts`
- `createUserWithSettings`: remove nested `settings` object from returned user. Write only the 4 flat fields. Update JSDoc to reflect this accurately — no "compatibility with both patterns" claim.
- `createCleaner`: once `settings?` is removed from `Cleaner` type, remove the nested `settings` block from this function as well. Update the "backward compatibility" label accordingly.

---

## Section 2: Router & Layout

### `src/layouts/default.vue`
- Uncomment the `<v-main>` block containing `<router-view />`. Single-line fix for the blank-page bug.

### `src/router/guards.ts`
- **Auth guard**: restore initialization check. Only call `checkAuth()` when `authStore.initializing` is true or no session exists. For already-initialized navigations, use cached store state. Eliminates per-navigation Supabase round-trip and auth state race condition.
- **`realtimeSyncGuard`**: delete entirely — exported but never registered in the router, and its inner comment contradicts its existence.
- **Stale comments**: remove "Enhanced with Supabase Authentication" file banner; remove "Check auth state" comment (restates method name); update `loadingGuard` comment to `// TODO: set loading state here` (honest about what it doesn't yet do).

### `src/router/index.ts`
- Revert `owner-calendar` route: component back to `@/pages/owner/calendar.vue`, name back to `'owner-calendar'`. Restores the page wrapper layer per architecture conventions (CLAUDE.md).
- Delete ~140 lines of commented-out dev demo routes. Git history is the correct archive.

---

## Section 3: Error Handling

### `src/composables/owner/useOwnerBookings.ts`
- Remove the `try/catch { // ignore }` block at lines 458–462. Let `bookingStore.addBooking` throw naturally; caller is responsible for handling.

### `src/composables/shared/useAuth.ts` — `updateUserSettings`
- Replace `...settings` spread with an explicit field-by-field merge of only the 4 flat settings fields onto the user object. Map `UserSettings` key names to flat field names explicitly. No unconstrained spread onto the root user object.

### `src/composables/admin/useAdminBookings.ts` — `createBooking`
- Re-throw caught errors instead of silently setting `error.value` and returning void.
- Fix the unsafe cast: replace `err as Error` with `err instanceof Error ? err.message : String(err)`.

### `src/composables/admin/useAdminUserManagement.ts`
- **`deleteUser`**: when auth user deletion fails after profile deletion succeeds, set `error.value` with a specific partial-failure message and return `false` — do not return `true`. This is a known partial failure state, not a programming error, so don't re-throw.
- **`updateUser`**: replace `Partial<User>` spread into Supabase `.update()` with an explicit field mapping to column names. Prevents schema mismatch bugs after the `location` → `location_lat`/`location_lng` split.

### `src/components/smart/owner/OwnerPropertyView.vue`
- **`onMounted`**: fix `fetchMyProperties` in `useOwnerProperties` to propagate errors (re-throw) instead of returning `false` silently, so the `onMounted` catch block fires on network failure.
- **Line 177**: remove `booking.cleaning_duration` access — field was deleted from `Booking` in this PR. Use `property.cleaning_duration` directly (the fallback was already correct).

### `src/composables/admin/useCleanerManagement.ts`
- `CleanerFormData`: replace `location?: { lat: number; lng: number }` with `location_lat?: number; location_lng?: number` to match the `Cleaner` type and Supabase columns.

---

## Section 4: Comments & Dead Code

### `src/utils/authHelpers.ts`
- `createUserWithSettings` JSDoc: remove "Ensures compatibility with both old and new patterns" — replace with accurate description of flat-field-only construction.

### `src/composables/admin/useCleanerManagement.ts`
- `allCleaners` comment: remove "based on user role" (data is hardcoded, not role-derived). Replace with: `// TODO: replace with Supabase query: .from('user_profiles').select('*').eq('role', 'cleaner')`.

### `src/router/guards.ts`
- Remove the "Enhanced with Supabase Authentication" file-level banner.
- `loadingGuard`: replace "Set loading state for better UX" with `// TODO: set loading state here`.

---

## Verification

After all changes:
1. `pnpm build` — must pass with no type errors (removing `[key: string]: any` will surface any remaining mismatches)
2. `pnpm test:run` — must pass
3. Manual: navigate to an owner route — layout must render (not blank)
4. Manual: rapid navigation — no auth race condition errors in console
5. Manual: `router.push({ name: 'owner-calendar' })` — must resolve correctly
