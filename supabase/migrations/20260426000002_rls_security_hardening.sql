-- supabase/migrations/20260426000002_rls_security_hardening.sql
-- Two security fixes:
-- 1. RESTRICTIVE anonymous-block policies on bookings, properties, user_profiles.
--    Anonymous users assume the `authenticated` role (Supabase anonymous sign-ins
--    are enabled). The is_owner/is_admin/is_cleaner helpers implicitly protect data
--    (anon users have no profile row), but a RESTRICTIVE policy makes this
--    explicit and durable against future helper changes.
--    Ref: https://supabase.com/docs/guides/auth/auth-anonymous#access-control
-- 2. cleaner_teams: TO public -> TO authenticated, merge two SELECT policies into
--    one. Fixes anonymous access warning + multiple-permissive-policies perf warning.

BEGIN;

-- ============================================================================
-- 1. Anonymous-block RESTRICTIVE policies
-- ============================================================================

CREATE POLICY "Block anonymous mutations"
  ON public.bookings AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

CREATE POLICY "Block anonymous mutations"
  ON public.properties AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

CREATE POLICY "Block anonymous mutations"
  ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE)
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean) IS NOT TRUE);

-- ============================================================================
-- 2. cleaner_teams: merge policies, switch TO authenticated
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all teams"  ON public.cleaner_teams;
DROP POLICY IF EXISTS "Cleaners can view own teams"  ON public.cleaner_teams;

-- Single merged SELECT policy replaces two permissive policies that were
-- evaluated separately and OR'd per query (doubles the evaluation cost).
CREATE POLICY "Authenticated can view permitted teams"
  ON public.cleaner_teams FOR SELECT TO authenticated
  USING (
    (SELECT private.is_admin())
    OR (
      (SELECT private.is_cleaner())
      AND (SELECT private.current_user_id()) = ANY(member_ids)
    )
  );

-- Separate ALL policy for admin writes
CREATE POLICY "Admins can manage teams"
  ON public.cleaner_teams FOR ALL TO authenticated
  USING    ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

-- ============================================================================
-- Assertion: cleaner_teams has no remaining TO public policies
-- ============================================================================
DO $$
DECLARE
  public_count INT;
BEGIN
  SELECT COUNT(*)
    INTO public_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename  = 'cleaner_teams'
     AND roles @> ARRAY['public']::name[];

  IF public_count > 0 THEN
    RAISE EXCEPTION
      'Migration assertion failed: % cleaner_teams policies still use TO public',
      public_count;
  END IF;
END $$;

COMMIT;
