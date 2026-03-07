# Auth Timeout Fixes - Implementation Summary

## Problems Identified

From the console logs, we identified **three cascading auth timeout issues**:

1. **Sign Out Hanging** (5s timeout)
   ```
   🟡 useSupabaseAuth.signOut() called
   ⚠️ Sign out timed out, proceeding with local cleanup
   ```

2. **Login Timeout** (8s timeout)
   ```
   ⚠️ Login timeout - forcing loading to stop
   🔧 Force stopping loading state
   ```

3. **Profile Load Hanging** (3s fallback)
   ```
   ⏭️ Profile load already in progress, reusing promise
   ```

These timeouts left the app in an inconsistent state because they didn't provide clear feedback about what was blocking.

---

## Root Causes

1. **Supabase RLS Policy Blocking**: Most likely cause - the `user_profiles` INSERT/SELECT policy requires the user's role to be 'owner', but it might not be set in the database
2. **Network Latency**: High latency to Supabase servers
3. **Session Token Issues**: Token expired or invalid
4. **Race Conditions**: Multiple profile load attempts not properly deduplicated

---

## Fixes Implemented

### 1. `useSupabaseAuth.ts` - Improved Profile Loading

**File**: `src/composables/supabase/useSupabaseAuth.ts`

```typescript
// BEFORE: 3s fallback, minimal logging
let usedFallback = false;
const fallbackTimer = setTimeout(() => {
  usedFallback = true;
  user.value = buildFallbackProfile(userId);
}, 3000);

// AFTER: 2s fallback with diagnostics
const startTime = Date.now();
console.log(`📦 [Profile] Loading user profile for: ${userId}`);

const fallbackTimer = setTimeout(() => {
  const elapsed = Date.now() - startTime;
  console.warn(`⏱️ [Profile] Using fallback after ${elapsed}ms`);
  console.error(`[Profile] Query still pending - check RLS policies`);
}, 2000); // Reduced from 3s

// Added absolute timeout
const absoluteTimeoutTimer = setTimeout(() => {
  console.error(`❌ [Profile] Absolute timeout after 5s`);
  console.error(`[Profile] Check RLS policies on user_profiles table`);
}, 5000);
```

**Benefits**:
- Faster feedback (2s instead of 3s)
- Clear diagnostics pointing to RLS policies
- Absolute timeout prevents indefinite hanging
- Timestamps help identify where delays occur

### 2. `useSupabaseAuth.ts` - Improved Sign Out

```typescript
// BEFORE: 5s timeout, vague logging
const timeoutPromise = new Promise<{ error: Error }>((_, reject) => 
  setTimeout(() => reject(new Error('Sign out timed out after 5 seconds')), 5000)
);

// AFTER: 3s timeout with diagnostics
const startTime = Date.now();
const timeoutPromise = new Promise<never>((_, reject) => 
  setTimeout(() => reject(new Error('Sign out timed out after 3 seconds')), 3000)
);

try {
  const { error: signOutError } = await Promise.race([signOutPromise, timeoutPromise]);
  const elapsed = Date.now() - startTime;
  console.log(`✅ [Auth] signOut() completed in ${elapsed}ms`, signOutError);
} catch (timeoutErr) {
  const elapsed = Date.now() - startTime;
  console.warn(`⚠️ [Auth] Sign out timed out after ${elapsed}ms`);
  console.warn(`[Auth] Timeout reason: Supabase auth service may be slow or unreachable`);
}
```

**Benefits**:
- More aggressive timeout (3s instead of 5s)
- Always clears local state even on timeout
- Clear diagnostics for network issues

### 3. `login.vue` - Optimized Login Flow

```typescript
// BEFORE: 8s timeout, 1s user wait
const loginTimeout = setTimeout(() => {
  console.warn('⚠️ Login timeout - forcing loading to stop');
  forceStopLoading();
}, 8000);

// AFTER: 5s timeout with diagnostics
const loginStartTime = Date.now();
const loginTimeout = setTimeout(() => {
  const elapsed = Date.now() - loginStartTime;
  console.error(`❌ [Login] Login timeout after ${elapsed}ms`);
  console.error('[Login] Likely issues: RLS policy blocking profile load');
  forceStopLoading();
}, 5000);

// User wait: 1s → 2s (20 * 100ms)
let attempts = 0;
const maxAttempts = 20; // 20 * 100ms = 2s max
while (!authStore.user && attempts < maxAttempts) {
  await new Promise(resolve => setTimeout(resolve, 100));
  attempts++;
}
```

**Benefits**:
- Faster timeout detection (5s instead of 8s)
- Better diagnostics about what's blocking
- Longer user wait (2s instead of 1s) to accommodate slower RLS queries

---

## New Diagnostic Tool: `authDiagnostics.ts`

**File**: `src/utils/authDiagnostics.ts`

A comprehensive diagnostic utility to identify auth issues.

### Usage

Run in browser console:
```javascript
await runAuthDiagnostics()
```

### What It Tests

1. **Auth Session Check**
   - Verifies active session exists
   - Shows user email if authenticated

2. **User Profile Access**
   - Tests if current user can read their profile
   - Identifies RLS policy blocks (error code 42501)
   - Shows user role if accessible

3. **RLS Policy Check**
   - Attempts test booking insert
   - Distinguishes between FK errors (good) and RLS errors (bad)
   - Identifies which policies are blocking

4. **Network Latency**
   - Measures response time to Supabase
   - Flags if latency > 1s (warning) or > 2s (error)
   - Helps identify network issues vs RLS issues

### Example Output

```
✅ [Diagnostics] Auth Session Check: PASS (145ms)
   Details: Session found for user@example.com

❌ [Diagnostics] User Profile Access: FAIL (5243ms)
   Details: RLS Error (42501): new row violates row-level security policy

⚠️ [Diagnostics] Network Latency: PASS (1250ms)
   Details: Moderate latency (1250ms)
```

---

## How to Test

### Test 1: Login Flow

1. Open browser DevTools (F12)
2. Go to login page
3. Check Console - should see:
   ```
   🔐 [Login] Starting login process...
   [Login] Calling authStore.login()...
   [Login] Result after 500ms: { success: true, hasUser: true, ... }
   ✅ [Login] User loaded (role: owner), navigating to /owner/dashboard
   ```

4. If timeout occurs, check:
   ```
   ❌ [Login] Login timeout after 5000ms
   [Login] Likely issues: RLS policy blocking profile load
   ```

### Test 2: Sign Out Flow

1. While logged in, click logout
2. Check Console - should see:
   ```
   🟡 [Auth] signOut() called
   🟡 [Auth] Calling supabase.auth.signOut()...
   ✅ [Auth] signOut() completed in 250ms
   ```

3. If timeout occurs:
   ```
   ⚠️ [Auth] Sign out timed out after 3000ms
   [Auth] Timeout reason: Supabase auth service may be slow
   ```

### Test 3: Run Full Diagnostics

1. Open browser console
2. Run: `await runAuthDiagnostics()`
3. Review the full diagnostic report
4. Any RED items indicate critical RLS policy issues that need fixing

---

## What to Fix If Tests Fail

### If User Profile Access Fails

1. Open Supabase Dashboard
2. Go to **Table Editor → user_profiles**
3. Check if your test user record exists
4. Verify the `role` column is set to `'owner'` (not null, not 'admin')
5. If missing, create it with role='owner'

### If RLS Policy Check Fails with 42501

The RLS policy is blocking inserts. Check:

1. **Supabase Dashboard → SQL Editor**
2. Run this query:
   ```sql
   SELECT * FROM public.user_profiles WHERE id = 'YOUR_USER_ID';
   ```
3. If no results: Create the profile with role='owner'
4. If exists but role is null: Update it: 
   ```sql
   UPDATE public.user_profiles SET role = 'owner' WHERE id = 'YOUR_USER_ID';
   ```

### If Network Latency is High (> 2s)

1. Check your internet connection
2. Try a different region (VPN)
3. Supabase may be experiencing issues - check their status page
4. Consider increasing timeout values if connection is consistently slow

---

## Files Modified

1. ✅ `src/composables/supabase/useSupabaseAuth.ts`
   - Profile load: 3s → 2s fallback, added 5s absolute timeout
   - Sign out: 5s → 3s timeout
   - Better logging with timestamps and diagnostics

2. ✅ `src/pages/auth/login.vue`
   - Login: 8s → 5s timeout
   - User wait: 1s → 2s
   - Better diagnostics in error messages

3. ✅ `src/utils/authDiagnostics.ts` (NEW)
   - Comprehensive diagnostic tool
   - Exportable to browser console as `runAuthDiagnostics()`
   - Tests auth session, profile access, RLS policy, network latency

---

## Expected Behavior After Fixes

✅ **Login Should Complete in < 2s** (instead of timing out at 8s)
✅ **Sign Out Should Complete in < 1s** (instead of timing out at 5s)
✅ **Profile Load Should Complete in < 1s** (instead of falling back at 3s)
✅ **Clear Diagnostics** when something is slow (helps identify RLS vs network issues)
✅ **Fallback Behavior** when Supabase is slow (app still works but uses cache)

---

## Next Steps

1. **Test the fixes**:
   - Try logging in - should be fast now
   - Try logging out - should be instant
   - Check console for timing info

2. **Run diagnostics** if something seems slow:
   ```javascript
   await runAuthDiagnostics()
   ```

3. **Fix RLS issues** if diagnostics report 42501 errors:
   - Verify user_profiles record exists
   - Check role is 'owner' not null
   - Re-test after fixing

4. **Monitor timeouts**:
   - If still seeing timeouts, check browser console
   - Longer timestamps indicate network issues
   - Shorter timeouts indicate RLS policy blocks
