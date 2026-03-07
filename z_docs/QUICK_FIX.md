# 🚨 QUICK FIX: Signup 500 Error

## The Problem
**ERROR: type "user_role" does not exist (SQLSTATE 42704)**

Your signup is failing because the enum types were never created in the database.

## The Solution (30 seconds)

### 1. Open base SQL Editor
🔗 https://base.com/dashboard/project//sql/new

### 2. Copy & Paste This File
📁 Open: `base/FIX_MISSING_ENUMS.sql`

Copy **EVERYTHING** and paste into SQL editor, then click **RUN**

### 3. Test Signup
🌐 http://localhost:3000/auth/register

Create an account - it should work now! ✅

---

## What This Fix Does

1. ✅ Creates all missing enum types:
   - `user_role` (owner, admin, cleaner)
   - `booking_type` (standard, turn)
   - `booking_status` (pending, scheduled, in_progress, completed, cancelled)
   - `property_type` (apartment, house, condo, townhouse)
   - `pricing_tier` (basic, standard, premium, luxury)
   - `priority_level` (low, normal, high, urgent)
   - `theme_preference` (light, dark, system)

2. ✅ Fixes the trigger function with proper security

3. ✅ Re-enables RLS

4. ✅ Shows verification results

---

## Expected Result After Running

You should see output like:
```
NOTICE: Created enum type: user_role
NOTICE: Created enum type: booking_type
...
✅ SUCCESS: All enum types created and trigger function fixed!
```

Then a table showing all 7 enum types with their values.

---

## If It Still Fails

Check the base logs for the specific error:
🔗 https://base.com/dashboard/project//logs

Look for any errors mentioning enum types or the handle_new_user function.
