-- Revert get_user_role_bypass_rls back to VOLATILE.
--
-- Migration 20260425064847_rls_helpers_stable.sql incorrectly assumed
-- PostgreSQL's STABLE rule only forbids data modification. In fact,
-- STABLE/IMMUTABLE functions cannot use the SET keyword in the function
-- body at all (error code 0A000), even for session GUCs like
-- row_security. Once that ALTER FUNCTION shipped, every authenticated
-- SELECT against bookings, properties, or user_profiles failed because
-- the RLS chain — is_owner / is_admin / is_cleaner → current_user_role
-- → get_user_role_bypass_rls — hit 0A000 on the very first row.
--
-- The other four helpers (current_user_role, is_owner, is_admin,
-- is_cleaner) are pure SELECT delegates with no body-level SET, so they
-- legally remain STABLE. A STABLE function may call a VOLATILE one;
-- the planner just cannot memoize this volatile leaf, which gives back
-- the per-row cost the original migration was trying to avoid. A proper
-- refactor (drop body-level SET via BYPASSRLS grant or a JWT claim,
-- then re-mark STABLE) is tracked separately.

BEGIN;

ALTER FUNCTION private.get_user_role_bypass_rls(UUID) VOLATILE;

DO $$
DECLARE
  vol CHAR(1);
BEGIN
  SELECT p.provolatile
    INTO vol
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
   WHERE n.nspname = 'private'
     AND p.proname = 'get_user_role_bypass_rls';

  IF vol IS DISTINCT FROM 'v' THEN
    RAISE EXCEPTION
      'Migration assertion failed: get_user_role_bypass_rls volatility is %, expected v (VOLATILE)',
      vol;
  END IF;
END $$;

COMMIT;
