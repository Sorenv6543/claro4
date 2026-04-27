-- Fix: remove COALESCE('owner') fallback from get_user_role_bypass_rls.
--
-- The previous definition returned 'owner' for any user_id that has no
-- user_profiles row. This made is_owner() return TRUE for anonymous users
-- and users whose profile trigger failed, granting them full owner-level
-- RLS access without a valid profile.
--
-- NULL is the correct return for a missing row: all is_*() helpers evaluate
-- the result in a USING clause where NULL is treated as FALSE (deny). This
-- restores the intended deny-by-default posture for profileless identities.

BEGIN;

CREATE OR REPLACE FUNCTION private.get_user_role_bypass_rls(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT role FROM public.user_profiles WHERE id = user_id;
$$;

-- Ownership must be set after CREATE OR REPLACE so the BYPASSRLS role
-- continues to own the function and SECURITY DEFINER executes under it.
ALTER FUNCTION private.get_user_role_bypass_rls(UUID) OWNER TO claro_rls_bypass;

-- Assertion: function must be STABLE and owned by claro_rls_bypass.
DO $$
DECLARE
  vol  CHAR(1);
  ownr NAME;
BEGIN
  SELECT p.provolatile, r.rolname
    INTO vol, ownr
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_roles r     ON p.proowner     = r.oid
   WHERE n.nspname = 'private'
     AND p.proname = 'get_user_role_bypass_rls';

  IF vol IS DISTINCT FROM 's' THEN
    RAISE EXCEPTION 'Assertion failed: volatility is %, expected s (STABLE)', vol;
  END IF;

  IF ownr IS DISTINCT FROM 'claro_rls_bypass' THEN
    RAISE EXCEPTION 'Assertion failed: function owner is %, expected claro_rls_bypass', ownr;
  END IF;
END;
$$;

COMMIT;
