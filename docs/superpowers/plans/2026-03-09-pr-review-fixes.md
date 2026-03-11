# PR Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all issues identified in the PR review of `feat/owner-property-view` before merging — covering type safety, routing, error handling, and comment accuracy.

**Architecture:** Changes are organized into four logical groups matching the design spec: (1) types, (2) auth & router, (3) error handling across composables and components, (4) comment/dead-code cleanup. Each group can be committed independently. No new files are created — all changes are targeted edits to existing files.

**Tech Stack:** Vue 3, TypeScript, Pinia, Vuetify 3, Vue Router 4, Vitest

---

## Chunk 1: Types

### Task 1: Fix `src/types/booking.ts`

**Files:**
- Modify: `src/types/booking.ts`

**Changes:**
1. Remove the `[key: string]: any` index signature (lines 39–41)
2. Remove the redundant `priority` re-declaration from `BookingWithMetadata` (line 55)
3. Add `priority` validation to the `isBooking` type guard

- [ ] **Step 1: Remove `[key: string]: any` from `Booking`**

In `src/types/booking.ts`, delete lines 39–41:
```typescript
  // Add index signature to allow conversion to Record<string, unknown>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
```

The `BookingRecord` type alias on line 62 already handles boundaries that need `Record<string, unknown>`.

- [ ] **Step 2: Remove redundant `priority` from `BookingWithMetadata`**

In `src/types/booking.ts`, remove line 55 from the `BookingWithMetadata` interface:
```typescript
  priority: 'low' | 'normal' | 'high' | 'urgent';
```
`BookingWithMetadata extends Booking` already inherits `priority`.

- [ ] **Step 3: Update `isBooking` to validate `priority`**

Replace the current `isBooking` implementation (lines 82–91):
```typescript
export function isBooking(obj: unknown): obj is Booking {
  if (typeof obj !== 'object' || obj === null) return false;
  const b = obj as Partial<Booking>;
  return (
    typeof b.id === 'string' &&
    typeof b.property_id === 'string' &&
    typeof b.checkout_date === 'string' &&
    typeof b.checkin_date === 'string' &&
    typeof b.priority === 'string' &&
    ['low', 'normal', 'high', 'urgent'].includes(b.priority as string)
  );
}
```

- [ ] **Step 4: Run build to verify no type regressions**

```bash
pnpm build:fast
```

Expected: Build succeeds. If you see a compile error about `cleaning_duration` or any other property not existing on `Booking`, that is a pre-existing bug being surfaced — fix it at the call site, not by restoring the index signature.

- [ ] **Step 5: Commit**

```bash
git add src/types/booking.ts
git commit -m "fix: remove [key: string]: any from Booking, add priority to isBooking guard"
```

---

### Task 2: Fix `src/types/user.ts`

**Files:**
- Modify: `src/types/user.ts`

**Changes:**
- Remove `settings?: UserSettings` from `PropertyOwner`, `Admin`, and `Cleaner`
- Remove the redundant flat-field re-declarations from each subtype (they are already on `User`)
- Update the `User` JSDoc to remove "supports both flattened and nested settings"

- [ ] **Step 1: Clean up `PropertyOwner`**

Replace the `PropertyOwner` interface (lines 49–58) with:
```typescript
export interface PropertyOwner extends User {
  role: 'owner';
  company_name?: string;
}
```

- [ ] **Step 2: Clean up `Admin`**

Replace the `Admin` interface (lines 64–73) with:
```typescript
export interface Admin extends User {
  role: 'admin';
  access_level: 'full' | 'limited';
}
```

- [ ] **Step 3: Clean up `Cleaner`**

Replace the `Cleaner` interface (lines 79–91) with:
```typescript
export interface Cleaner extends User {
  role: 'cleaner';
  skills: string[];
  max_daily_bookings: number;
}
```

Note: `location_lat`, `location_lng` are already on `User` base type.

- [ ] **Step 4: Update `User` JSDoc**

Change line 23:
```typescript
 * Core data model for all users - supports both flattened and nested settings
```
to:
```typescript
 * Core data model for all users. Settings are stored as flat fields only.
```

- [ ] **Step 5: Run build to find all affected call sites**

```bash
pnpm build:fast
```

Expected: TypeScript will now report errors at any location that references `user.settings`, `owner.settings`, etc. Each error is a call site that needs to be updated to use the flat field equivalents:
- `user.settings?.notifications` → `user.notifications_enabled`
- `user.settings?.timezone` → `user.timezone`
- `user.settings?.theme` → `user.theme`
- `user.settings?.language` → `user.language`

Fix each error before proceeding.

- [ ] **Step 6: Commit**

```bash
git add src/types/user.ts
git commit -m "fix: remove nested settings from User subtypes, flat fields only"
```

---

## Chunk 2: Auth & Router

### Task 3: Fix mock users and `updateUserSettings` in `src/composables/shared/useAuth.ts`

**Files:**
- Modify: `src/composables/shared/useAuth.ts`

- [ ] **Step 1: Fix mock `owner-1` user**

Replace the `owner-1` mock user object (lines 27–39):
```typescript
{
  id: 'owner-1',
  email: 'owner@example.com',
  name: 'Property Owner',
  role: 'owner' as UserRole,
  company_name: 'Luxury Rentals Inc.',
  notifications_enabled: true,
  timezone: 'America/New_York',
  theme: 'light' as const,
  language: 'en',
} as PropertyOwner,
```

- [ ] **Step 2: Fix mock `admin-1` user**

Replace the `admin-1` mock user object (lines 40–52):
```typescript
{
  id: 'admin-1',
  email: 'admin@example.com',
  name: 'Admin User',
  role: 'admin' as UserRole,
  access_level: 'full' as const,
  notifications_enabled: true,
  timezone: 'America/New_York',
  theme: 'dark' as const,
  language: 'en',
} as Admin,
```

- [ ] **Step 3: Fix `updateUserSettings` to use explicit field mapping**

Replace the `updatedUser` construction in `updateUserSettings` (lines 255–260):
```typescript
const settingsMap: Record<keyof UserSettings, keyof User> = {
  notifications: 'notifications_enabled',
  timezone: 'timezone',
  theme: 'theme',
  language: 'language',
};

const patch: Partial<User> = {};
for (const [settingsKey, userKey] of Object.entries(settingsMap) as [keyof UserSettings, keyof User][]) {
  if (settingsKey in settings) {
    (patch as Record<string, unknown>)[userKey as string] = settings[settingsKey];
  }
}

const updatedUser = {
  ...userStore.user,
  ...patch,
  updated_at: new Date().toISOString()
};
```

- [ ] **Step 4: Also fix `register` to use flat fields**

In `register`, the three role branches currently create users with `settings: { ... }` and no flat fields. Update each branch to use flat fields instead. For example, the `'owner'` branch (lines 184–194):
```typescript
newUser = {
  id: `owner-${uuidv4()}`,
  email: userData.email,
  name: userData.name,
  role: 'owner',
  company_name: userData.company_name || '',
  notifications_enabled: true,
  timezone: 'America/New_York',
  theme: 'light' as const,
  language: 'en',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
} as PropertyOwner;
```

Apply the same pattern to the `'admin'` and `'cleaner'` branches (use `theme: 'light'` for cleaner).

- [ ] **Step 5: Remove unused `UserSettings` import if no longer needed**

Check line 11. If `UserSettings` is no longer used in this file (it's still used as the parameter type for `updateUserSettings`), keep the import. If `UserSettings` was removed from `src/types/user.ts` exports, update accordingly.

- [ ] **Step 6: Run tests**

```bash
pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/composables/shared/useAuth.ts
git commit -m "fix: use flat settings fields in mock users and updateUserSettings"
```

---

### Task 4: Fix `src/utils/authHelpers.ts`

**Files:**
- Modify: `src/utils/authHelpers.ts`

- [ ] **Step 1: Update `createUserWithSettings` JSDoc**

Replace lines 223–226:
```typescript
/**
 * Creates a User object from partial data, populating flat settings fields.
 * The optional `settings` parameter is accepted for convenience but values
 * are always written to the flat fields only (notifications_enabled, timezone, theme, language).
 */
```

- [ ] **Step 2: Remove nested `settings` block from `createCleaner`**

In `createCleaner` (lines 287–320), remove the nested settings block (lines 302–308):
```typescript
    // Nested settings (for compatibility)
    settings: {
      notifications: cleanerData.settings?.notifications ?? cleanerData.notifications_enabled ?? true,
      timezone: cleanerData.settings?.timezone ?? cleanerData.timezone ?? 'UTC',
      theme: cleanerData.settings?.theme ?? cleanerData.theme ?? 'light',
      language: cleanerData.settings?.language ?? cleanerData.language ?? 'en'
    },
```

The `Cleaner` type no longer has `settings?` after Task 2.

- [ ] **Step 3: Run build**

```bash
pnpm build:fast
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/utils/authHelpers.ts
git commit -m "fix: update createUserWithSettings JSDoc, remove nested settings from createCleaner"
```

---

### Task 5: Fix `src/layouts/default.vue`

**Files:**
- Modify: `src/layouts/default.vue`

- [ ] **Step 1: Uncomment `<router-view />`**

Replace lines 62–66:
```html
    <!-- <v-main class="main-content-area">
      <div class="viewport-container">
        <router-view />
      </div>
    </v-main> -->
```

With:
```html
    <v-main class="main-content-area">
      <div class="viewport-container">
        <router-view />
      </div>
    </v-main>
```

- [ ] **Step 2: Verify dev server renders routes that use the default layout**

```bash
pnpm dev:local
```

Navigate to any route using `layout: 'default'`. The page must render content — not be blank.

- [ ] **Step 3: Commit**

```bash
git add src/layouts/default.vue
git commit -m "fix: uncomment router-view in default layout (blank page bug)"
```

---

### Task 6: Fix `src/router/guards.ts`

**Files:**
- Modify: `src/router/guards.ts`

- [ ] **Step 1: Fix `authGuard` to avoid calling `checkAuth()` on every navigation**

Replace the `authGuard` function body. The key change: only call `checkAuth()` when the store has not yet initialized (i.e., no user and `isAuthenticated` is false on first load). For subsequent navigations, trust the cached store state:

```typescript
export async function authGuard(
  to: RouteLocationNormalized,
  _from: RouteLocationNormalized,
  next: NavigationGuardNext
) {
  const authStore = useAuthStore();

  // Only call checkAuth on initial load (no cached session yet)
  if (!authStore.isAuthenticated && !authStore.user) {
    await authStore.checkAuth();
  }

  // Check if route requires authentication
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/auth/login');
    return;
  }

  // Check role-based access
  const requiredRole = to.meta.role as UserRole;
  if (requiredRole && authStore.user?.role !== requiredRole) {
    const defaultRoute = getDefaultRouteForRole(authStore.user?.role);
    next(defaultRoute);
    return;
  }

  // Block admin routes for non-admins
  if (to.path.startsWith('/admin') && !authStore.isAdmin) {
    next(getDefaultRouteForRole(authStore.user?.role));
    return;
  }

  // Block owner routes for non-owners
  if (to.path.startsWith('/owner') && !authStore.isOwner) {
    next(getDefaultRouteForRole(authStore.user?.role));
    return;
  }

  // Redirect authenticated users away from auth/login pages
  if ((to.path === '/' || to.path.startsWith('/auth')) && authStore.isAuthenticated) {
    next(getDefaultRouteForRole(authStore.user?.role));
    return;
  }

  next();
}
```

- [ ] **Step 2: Remove `realtimeSyncGuard`**

Delete the entire `realtimeSyncGuard` function (lines 115–130).

- [ ] **Step 3: Fix `loadingGuard` comment**

Replace line 81:
```typescript
  // Set loading state for better UX
```
with:
```typescript
  // TODO: set loading state here
```

- [ ] **Step 4: Remove the stale file-level banner**

Delete line 1:
```typescript
// src/router/guards.ts - Enhanced with Supabase Authentication
```

- [ ] **Step 5: Commit**

```bash
git add src/router/guards.ts
git commit -m "fix: only call checkAuth on initial load, remove realtimeSyncGuard, fix stale comments"
```

---

### Task 7: Fix `src/router/index.ts`

**Files:**
- Modify: `src/router/index.ts`

- [ ] **Step 1: Revert `owner-calendar` route**

Find the `owner-calendar` route at lines 51–60. Change `name` and `component`:
```typescript
{
  path: '/owner/calendar',
  name: 'owner-calendar',
  component: () => import('@/pages/owner/calendar.vue'),
  meta: {
    layout: 'owner',
    role: 'owner',
    requiresAuth: true
  }
},
```

- [ ] **Step 2: Delete all commented-out dev demo routes**

Delete everything from line 206 (the `// Development Demo Routes - Admin Demos` comment) through line 349 (the last `// }` closing the final commented-out route block). The active route array should end at the `admin-users` route, followed immediately by the `])` closing the array.

Verify the file still has the correct closing structure:
```typescript
  ]
})

// Apply navigation guards
router.beforeEach(developmentGuard)
router.beforeEach(loadingGuard)
router.beforeEach(authGuard)
router.afterEach(afterNavigationGuard)

export default router
```

- [ ] **Step 3: Run build to ensure no import errors**

```bash
pnpm build:fast
```

Expected: Build succeeds. The `/dev/*` routes are still served by the `developmentGuard` which blocks them in production — deleting the commented-out definitions doesn't affect that.

- [ ] **Step 4: Commit**

```bash
git add src/router/index.ts
git commit -m "fix: revert owner-calendar route name and component, delete commented-out dev routes"
```

---

## Chunk 3: Error Handling & Components

### Task 8: Fix error handling in composables

**Files:**
- Modify: `src/composables/owner/useOwnerBookings.ts`
- Modify: `src/composables/owner/useOwnerProperties.ts`
- Modify: `src/composables/admin/useAdminBookings.ts`
- Modify: `src/composables/admin/useAdminUserManagement.ts`

- [ ] **Step 1: Remove empty catch from `createOwnerBooking` in `useOwnerBookings.ts`**

Find the `createOwnerBooking` function (around line 442). Replace lines 458–462:
```typescript
      // Optionally add to store if needed for test
      try {
        bookingStore.addBooking(booking);
      } catch {
        // ignore
      }
```
with:
```typescript
      bookingStore.addBooking(booking);
```

If `addBooking` throws, the exception propagates to the caller naturally.

- [ ] **Step 2: Fix `fetchMyProperties` in `useOwnerProperties.ts` to propagate errors**

Find `fetchMyProperties` (around line 136). Replace the catch block (lines 153–157):
```typescript
    } catch {
      error.value = 'Unable to load your properties. Please try again.';
      loading.value = false;
      return false;
    }
```
with:
```typescript
    } catch (err) {
      error.value = 'Unable to load your properties. Please try again.';
      loading.value = false;
      throw err;
    }
```

This ensures the `onMounted` catch in `OwnerPropertyView` fires on network failure instead of receiving a silent `false`.

- [ ] **Step 3: Fix `createBooking` in `useAdminBookings.ts` to re-throw**

Find the `createBooking` arrow function (around line 228). Replace the catch block:
```typescript
    } catch (err: unknown) {
      const errorMsg = err as Error;
      error.value = `Failed to create booking: ${errorMsg.message}`;
      trackCachePerformance('admin-create-booking', false);
    }
```
with:
```typescript
    } catch (err: unknown) {
      error.value = `Failed to create booking: ${err instanceof Error ? err.message : String(err)}`;
      trackCachePerformance('admin-create-booking', false);
      throw err;
    }
```

- [ ] **Step 4: Fix `deleteUser` in `useAdminUserManagement.ts` to surface partial failure**

Find the auth cleanup check in `deleteUser` (lines 132–136):
```typescript
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      // Warn but do not throw, since profile deletion succeeded
      console.warn('Auth user deletion failed:', authError)
    }
    await fetchAllUsers()
    return true
```

Replace with:
```typescript
    const { error: authError } = await supabase.auth.admin.deleteUser(userId)
    if (authError) {
      // Profile was deleted but auth account remains — user can still log in
      error.value = 'User profile deleted, but the auth account could not be removed. Contact your Supabase admin to delete the auth record manually.'
      loading.value = false
      return false
    }
    await fetchAllUsers()
    return true
```

- [ ] **Step 5: Fix `updateUser` in `useAdminUserManagement.ts` — explicit field mapping**

Find `updateUser` (around line 91). Replace the Supabase `.update()` call (lines 95–101) with an explicit column mapping instead of spreading `Partial<User>`:

```typescript
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        name: updateData.name,
        email: updateData.email,
        role: updateData.role,
        company_name: updateData.company_name,
        notifications_enabled: updateData.notifications_enabled,
        timezone: updateData.timezone,
        theme: updateData.theme,
        language: updateData.language,
        access_level: updateData.access_level,
        skills: updateData.skills,
        max_daily_bookings: updateData.max_daily_bookings,
        location_lat: updateData.location_lat,
        location_lng: updateData.location_lng,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
```

Only include fields that `user_profiles` actually has columns for. Remove any field from this list that doesn't exist in the Supabase schema.

- [ ] **Step 6: Run tests**

```bash
pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/composables/owner/useOwnerBookings.ts src/composables/owner/useOwnerProperties.ts src/composables/admin/useAdminBookings.ts src/composables/admin/useAdminUserManagement.ts
git commit -m "fix: propagate errors in composables, fix deleteUser partial failure, explicit updateUser field mapping"
```

---

### Task 9: Fix `src/components/smart/owner/OwnerPropertyView.vue`

**Files:**
- Modify: `src/components/smart/owner/OwnerPropertyView.vue`

- [ ] **Step 1: Remove `booking.cleaning_duration` access on line 177**

Find line 177:
```html
                  <v-list-item-subtitle>Cleaning window: {{ booking.cleaning_duration ?? property.cleaning_duration }} min</v-list-item-subtitle>
```

Replace with:
```html
                  <v-list-item-subtitle>Cleaning window: {{ property.cleaning_duration }} min</v-list-item-subtitle>
```

`booking.cleaning_duration` was removed from the `Booking` type. `property.cleaning_duration` is the correct source.

- [ ] **Step 2: Verify `onMounted` catches errors correctly**

The `onMounted` at lines 449–457 calls `fetchMyProperties()`. After Task 8 Step 2, `fetchMyProperties` now re-throws on network failure, so the catch block here will now fire. The existing catch is already correct — no changes needed here beyond verifying it reads:

```typescript
onMounted(async () => {
  try {
    await Promise.all([fetchMyProperties(), fetchMyBookings()]);
    if (!property.value) router.push('/owner/properties');
  } catch (err) {
    console.error('[OwnerPropertyView] Failed to load property data:', err);
    loadError.value = 'Unable to load property details. Please refresh or go back.';
  }
});
```

- [ ] **Step 3: Run build**

```bash
pnpm build:fast
```

Expected: No type errors. The removal of `[key: string]: any` from Task 1 means any remaining `booking.X` access for non-existent fields will now surface as compile errors here.

- [ ] **Step 4: Commit**

```bash
git add src/components/smart/owner/OwnerPropertyView.vue
git commit -m "fix: remove booking.cleaning_duration access (field removed from type)"
```

---

### Task 10: Fix `src/composables/admin/useCleanerManagement.ts`

**Files:**
- Modify: `src/composables/admin/useCleanerManagement.ts`

- [ ] **Step 1: Fix `CleanerFormData` location fields**

Replace lines 24–33:
```typescript
export interface CleanerFormData {
  name: string;
  email: string;
  skills: string[];
  max_daily_bookings: number;
  location?: {
    lat: number;
    lng: number;
  };
}
```

With:
```typescript
export interface CleanerFormData {
  name: string;
  email: string;
  skills: string[];
  max_daily_bookings: number;
  location_lat?: number;
  location_lng?: number;
}
```

- [ ] **Step 2: Fix `allCleaners` comment**

Replace lines 94–95:
```typescript
    // In a real app, this would come from a dedicated cleaners collection
    // For now, we'll simulate cleaner data based on user role
```

With:
```typescript
    // Mock data — replace with: supabase.from('user_profiles').select('*').eq('role', 'cleaner')
```

- [ ] **Step 3: Run build**

```bash
pnpm build:fast
```

Expected: No errors.

- [ ] **Step 4: Run full test suite**

```bash
pnpm test:run
```

Expected: All tests pass.

- [ ] **Step 5: Commit**

```bash
git add src/composables/admin/useCleanerManagement.ts
git commit -m "fix: CleanerFormData uses location_lat/location_lng, fix allCleaners comment"
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

The PR at https://github.com/Sorenv6543/claro4/pull/3 will update automatically.
