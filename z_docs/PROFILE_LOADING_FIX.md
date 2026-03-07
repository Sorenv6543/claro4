# User Profile Loading Fix

## Problem Identified

From the console logs, login was failing with this sequence:

```
[Auth Debug] Auth state changed: {event: 'SIGNED_IN', userId: 'b57e1d65-fec5-448a-8f9a-b1a7a85a93cc'}
⏭️ Profile load already in progress, reusing promise
❌ [Login] Login timeout after 5000ms - auth operation hanging
[Login] Likely issues: RLS policy blocking profile load
```

**Root Cause**: The user exists in `auth.users` but their profile doesn't exist in `public.user_profiles`, OR the profile has no role set (null).

This happens when:
1. The signup trigger (`handle_new_user`) doesn't fire properly
2. The profile was deleted but auth user remains
3. The profile was created with a NULL role
4. RLS policy blocks access to existing profile

---

## Solutions Implemented

### 1. New Profile Ensure Utility
**File**: `src/composables/supabase/useProfileEnsure.ts`

Automatically checks and creates missing profiles:
- **On Signup**: Creates profile if trigger didn't fire
- **On Login**: Ensures profile exists before loading
- **Role Defaults**: Sets role to 'owner' if missing

```typescript
import { ensureUserProfileExists } from '@/composables/supabase/useProfileEnsure';

const success = await ensureUserProfileExists(
  userId,
  email,
  name,
  'owner'  // default role
);
```

### 2. Updated Auth Flow
**File**: `src/composables/supabase/useSupabaseAuth.ts`

**Changes**:
- **signUp()**: Calls `ensureUserProfileExists()` after successful signup
- **doLoadUserProfile()**: Calls `ensureUserProfileExists()` before attempting to load profile
- Better error handling for missing vs inaccessible profiles

**How it works**:
```
Login → Auth.signIn() ✅
      → Auth state change → SIGNED_IN
      → loadUserProfile()
      → ensureUserProfileExists() ← NEW: checks/creates profile
      → Query user_profiles
      → Fallback after 2s if hanging
      → Use cached profile data
```

### 3. SQL Fix Script
**File**: `supabase/migrations/011_fix_missing_user_profiles.sql`

Fixes any existing users without profiles:
- Finds all auth users missing profiles
- Creates profiles from their metadata
- Sets defaults for role
- Updates any NULL roles to 'owner'

---

## How to Apply the Fix

### Option A: Automatic (New Signups/Logins)

The new code automatically handles this going forward:

1. New users signing up → Profile created automatically
2. Existing users logging in → Profile checked/created on login
3. Profile role NULL → Set to 'owner' automatically

**No action needed** - just test login!

### Option B: Fix Existing Users

If you have existing users who can't login:

**Method 1: Run SQL Migration**
```sql
-- Go to Supabase Dashboard → SQL Editor
-- Run the migration to fix all missing/broken profiles:
-- supabase/migrations/011_fix_missing_user_profiles.sql
```

**Method 2: Diagnose Individual User**
```sql
-- Find the user (from browser console: runAuthDiagnostics())
SELECT * FROM public.user_profiles 
WHERE id = 'b57e1d65-fec5-448a-8f9a-b1a7a85a93cc';

-- If no results, create the profile:
INSERT INTO public.user_profiles (id, email, name, role)
VALUES ('b57e1d65-fec5-448a-8f9a-b1a7a85a93cc', 'user@example.com', 'User Name', 'owner');

-- If exists but role is NULL, update it:
UPDATE public.user_profiles 
SET role = 'owner' 
WHERE id = 'b57e1d65-fec5-448a-8f9a-b1a7a85a93cc' 
AND role IS NULL;
```

---

## Testing the Fix

### Test 1: Check Existing User Profile

```javascript
// Open browser console
await runAuthDiagnostics()
```

Look for:
```
✅ User Profile Access: PASS (145ms)
   Details: Profile found with role: owner
```

If FAIL:
```
❌ User Profile Access: FAIL (5243ms)
   Details: No profile found for user [id]
```

### Test 2: New Signup + Login

1. Go to register page
2. Create account with new email
3. Login with that account
4. Should see in console:
   ```
   📋 [Profile] Ensuring profile exists...
   ✅ [ProfileEnsure] Profile created successfully
   ✅ [Profile] Loaded in 250ms: { email, role: owner }
   ✅ [Login] User loaded (role: owner), navigating to /owner/dashboard
   ```

### Test 3: Existing User Login

1. Login with existing account that was failing
2. Should see:
   ```
   📋 [Profile] Ensuring profile exists...
   ✅ [ProfileEnsure] Profile exists with role: owner
   ✅ [Profile] Loaded in 250ms: { email, role: owner }
   ✅ [Login] User loaded (role: owner), navigating to /owner/dashboard
   ```

### Test 4: Run Diagnostics

```javascript
// In browser console:
await runAuthDiagnostics()
```

All tests should PASS (green ✅):
- ✅ Auth Session Check
- ✅ User Profile Access
- ✅ RLS Policy Check
- ✅ Network Latency

---

## What Changed

### Files Modified
1. ✅ `src/composables/supabase/useSupabaseAuth.ts`
   - Added `ensureUserProfileExists()` import
   - Updated `signUp()` to ensure profile creation
   - Updated `doLoadUserProfile()` to ensure profile exists before querying

2. ✅ `src/composables/supabase/useProfileEnsure.ts` (NEW)
   - Comprehensive profile creation/verification utility
   - Handles missing profiles, NULL roles, RLS errors
   - Safe error handling with detailed logging

3. ✅ `supabase/migrations/011_fix_missing_user_profiles.sql` (NEW)
   - SQL script to fix existing users
   - Optional - only needed if you have existing broken profiles

---

## Behavior After Fix

### Signup Process
```
User signs up
  ↓
Auth creates account
  ↓
ensureUserProfileExists() ← Creates profile if needed
  ↓
Profile created with role='owner'
  ↓
Login succeeds ✅
```

### Login Process
```
User logs in
  ↓
Credentials validated
  ↓
ensureUserProfileExists() ← Checks if profile exists
  ↓
Profile exists and has role ✅
  ↓
Load profile data
  ↓
Fallback after 2s if hanging
  ↓
Navigate to dashboard ✅
```

### Error Recovery
```
Profile query hangs
  ↓
After 2s: Use cached/fallback profile
  ↓
Continue with that profile data
  ↓
App stays responsive ✅
```

---

## Expected Results

✅ **Signups should complete instantly** (profile auto-created)
✅ **Logins should complete in < 2s** (profile auto-verified)
✅ **No more "Profile load already in progress" messages**
✅ **Clear diagnostics if something goes wrong**
✅ **Automatic fallback** if Supabase is slow

---

## If You Still See Timeout Errors

1. **Run diagnostics**:
   ```javascript
   await runAuthDiagnostics()
   ```

2. **Check the results**:
   - If "User Profile Access" FAILS with 42501 error → RLS policy issue
   - If latency > 2s → Network issue
   - If "No profile found" → Profile doesn't exist

3. **Apply SQL Fix**:
   ```sql
   -- Run the migration script
   ```

4. **Clear browser cache** and retry login

---

## Files Summary

| File | Purpose | Status |
|------|---------|--------|
| `useProfileEnsure.ts` | Ensure profile exists | NEW ✅ |
| `useSupabaseAuth.ts` | Integrated ensure logic | UPDATED ✅ |
| `011_fix_missing_user_profiles.sql` | Fix existing users | NEW ✅ |
| `authDiagnostics.ts` | Diagnostic tool | EXISTING ✅ |
