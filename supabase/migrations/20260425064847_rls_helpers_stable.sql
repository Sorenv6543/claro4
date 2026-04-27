-- Mark RLS helper functions STABLE so PostgreSQL can memoize them
-- across rows within a single statement.
--
-- Without STABLE, the planner treats these as VOLATILE by default and
-- may invoke `private.is_admin()` once per row in a SELECT — which in
-- turn re-runs `private.current_user_role()` and the underlying
-- `private.get_user_role_bypass_rls(auth.uid())` query against
-- `public.user_profiles` per row. At ~100K bookings this turns a
-- millisecond RLS check into a multi-second-per-query problem.
--
-- STABLE semantics:
-- "The function cannot modify the database, and within a single table
--  scan will consistently return the same result for the same argument
--  values, but its result could change across SQL statements."
--
-- That's exactly what we need for auth helpers driven by auth.uid() /
-- JWT claims: the JWT doesn't change mid-query, so per-statement
-- caching is safe; but it can change across statements, so IMMUTABLE
-- would be wrong (the planner could constant-fold a stale value).
--
-- get_user_role_bypass_rls does `SET row_security = off/on` which is
-- a session GUC change, not a database modification, so STABLE is
-- still correct. This matches Supabase's published RLS-helper pattern.
--
-- private.current_user_id() is already STABLE (see complete_schema.sql);
-- this migration only touches the role-derivation chain.
--
-- Wrapped in a transaction with a post-condition assertion: each ALTER
-- FUNCTION runs in its own implicit transaction by default, so a
-- mid-migration failure (e.g., one helper renamed in a parallel branch)
-- would leave the migration row recorded as applied with only some
-- functions STABLE — silently 60% on, with no operator signal. The
-- BEGIN/COMMIT plus the DO block ensures all-or-nothing application.

BEGIN;

ALTER FUNCTION private.get_user_role_bypass_rls(UUID) STABLE;
ALTER FUNCTION private.current_user_role()           STABLE;
ALTER FUNCTION private.is_owner()                    STABLE;
ALTER FUNCTION private.is_admin()                    STABLE;
ALTER FUNCTION private.is_cleaner()                  STABLE;

DO $$
DECLARE
  non_stable_count INT;
BEGIN
  SELECT COUNT(*)
    INTO non_stable_count
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'private'
     AND p.proname IN (
       'get_user_role_bypass_rls',
       'current_user_role',
       'is_owner',
       'is_admin',
       'is_cleaner'
     )
     AND p.provolatile <> 's';  -- 's' = STABLE, 'i' = IMMUTABLE, 'v' = VOLATILE

  IF non_stable_count > 0 THEN
    RAISE EXCEPTION
      'Migration assertion failed: % RLS helper(s) still non-STABLE after ALTER',
      non_stable_count;
  END IF;
END $$;

COMMIT;
