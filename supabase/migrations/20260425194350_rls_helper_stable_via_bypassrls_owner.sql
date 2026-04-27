-- Refactor private.get_user_role_bypass_rls to STABLE without body-level SET.
--
-- The previous revert (20260425184338) put this helper back to VOLATILE
-- because its body did `SET row_security = off/on`, which is illegal in
-- STABLE/IMMUTABLE functions (Postgres error 0A000). VOLATILE worked but
-- forced a Seq Scan with per-row filter evaluation on every authenticated
-- read of bookings/properties — measured at ~250µs/row, projecting to
-- ~1.9s per owner SELECT at the CLAUDE.md scale of ~7,500 bookings.
--
-- The original `SET row_security = off` defended against RLS recursion:
-- user_profiles' own policies call private.is_admin(), which calls back
-- into this function, which reads user_profiles again. To get STABLE
-- back we need a different way to skip RLS on that one read.
--
-- Approach: dedicated NOLOGIN role with BYPASSRLS owns the function.
-- SECURITY DEFINER means the body runs as the owner; with BYPASSRLS the
-- internal SELECT on public.user_profiles bypasses policies without any
-- session GUC manipulation. No SET in the body → STABLE is legal.
--
-- Side benefits of switching plpgsql -> SQL:
--   * SQL functions are inlinable by the planner (where SECURITY DEFINER
--     allows it; even when not inlined, the STABLE marker enables
--     InitPlan hoisting so the function fires once per statement, not
--     once per row).
--   * Drops the EXCEPTION WHEN others fallback that silently returned
--     'owner' on any error. That mask hid real failures and is not the
--     pattern used by the rest of private.* helpers.

BEGIN;

-- 1. Create or normalize the BYPASSRLS role. NOLOGIN means nothing can
--    authenticate as this role directly; SECURITY DEFINER is how the
--    function gets to run with these privileges.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'claro_rls_bypass') THEN
    CREATE ROLE claro_rls_bypass NOLOGIN BYPASSRLS;
  ELSE
    ALTER ROLE claro_rls_bypass NOLOGIN BYPASSRLS;
  END IF;
END $$;

-- The migration role (postgres on Supabase) must be a member of the
-- new role to be allowed to ALTER FUNCTION ... OWNER TO it. This is a
-- one-time membership grant scoped to migration mechanics; it does not
-- change runtime privileges of postgres beyond what it already has.
GRANT claro_rls_bypass TO postgres;

-- 2. The role needs base privileges on the underlying table and on
--    the schema where the function lives. BYPASSRLS skips policies but
--    does not grant SELECT — those are independent. CREATE on schema
--    private is required by ALTER FUNCTION ... OWNER TO (the new owner
--    must be allowed to create objects in the schema).
GRANT USAGE          ON SCHEMA public        TO claro_rls_bypass;
GRANT USAGE, CREATE  ON SCHEMA private       TO claro_rls_bypass;
GRANT SELECT         ON public.user_profiles TO claro_rls_bypass;

-- 3. Replace body BEFORE transferring ownership: CREATE OR REPLACE
--    requires the caller to own the function. Postgres owns it now;
--    after the ALTER OWNER below it won't, so the order matters.
CREATE OR REPLACE FUNCTION private.get_user_role_bypass_rls(user_id UUID)
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = ''
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_profiles WHERE id = user_id),
    'owner'::public.user_role
  );
$$;

-- 4. Transfer ownership last. SECURITY DEFINER will now run as the
--    BYPASSRLS owner, so the SELECT on public.user_profiles inside
--    the body skips RLS without any session GUC manipulation.
ALTER FUNCTION private.get_user_role_bypass_rls(UUID) OWNER TO claro_rls_bypass;

-- 5. Assertions: volatility STABLE, owner is the BYPASSRLS role, and
--    that role still has BYPASSRLS. All-or-nothing in this transaction.
DO $$
DECLARE
  vol           CHAR(1);
  ownr          NAME;
  has_bypassrls BOOLEAN;
BEGIN
  SELECT p.provolatile, r.rolname
    INTO vol, ownr
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    JOIN pg_roles r     ON p.proowner     = r.oid
   WHERE n.nspname = 'private'
     AND p.proname = 'get_user_role_bypass_rls';

  IF vol IS DISTINCT FROM 's' THEN
    RAISE EXCEPTION
      'Migration assertion failed: volatility is %, expected s (STABLE)',
      vol;
  END IF;

  IF ownr IS DISTINCT FROM 'claro_rls_bypass' THEN
    RAISE EXCEPTION
      'Migration assertion failed: function owner is %, expected claro_rls_bypass',
      ownr;
  END IF;

  SELECT rolbypassrls
    INTO has_bypassrls
    FROM pg_roles
   WHERE rolname = 'claro_rls_bypass';

  IF NOT has_bypassrls THEN
    RAISE EXCEPTION
      'Migration assertion failed: claro_rls_bypass does not have BYPASSRLS';
  END IF;
END $$;

COMMIT;
