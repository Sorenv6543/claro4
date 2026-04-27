-- supabase/migrations/20260426000003_rls_policy_refinements.sql
-- Two policy refinements:
-- 1. cleaner_teams: merge SELECT + ALL policies into one combined policy to
--    eliminate the multiple_permissive_policies advisor warning.
--    The USING clause controls reads (admin OR cleaner member) and
--    WITH CHECK controls writes (admin only).
-- 2. Anonymous RESTRICTIVE policies: move IS NOT TRUE inside the (SELECT ...)
--    subquery so the full boolean expression is evaluated once per query
--    (InitPlan hoist), not per row.

BEGIN;

-- ============================================================================
-- 1. cleaner_teams: merge two policies into one combined USING/WITH CHECK
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can view permitted teams" ON public.cleaner_teams;
DROP POLICY IF EXISTS "Admins can manage teams"               ON public.cleaner_teams;

CREATE POLICY "Authenticated use teams"
  ON public.cleaner_teams FOR ALL TO authenticated
  USING (
    (SELECT private.is_admin())
    OR (
      (SELECT private.is_cleaner())
      AND (SELECT private.current_user_id()) = ANY(member_ids)
    )
  )
  WITH CHECK ((SELECT private.is_admin()));

-- ============================================================================
-- 2. Tighten RESTRICTIVE policy expressions — IS NOT TRUE inside (SELECT ...)
-- ============================================================================

DROP POLICY IF EXISTS "Block anonymous mutations" ON public.bookings;
DROP POLICY IF EXISTS "Block anonymous mutations" ON public.properties;
DROP POLICY IF EXISTS "Block anonymous mutations" ON public.user_profiles;

CREATE POLICY "Block anonymous mutations"
  ON public.bookings AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE))
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE));

CREATE POLICY "Block anonymous mutations"
  ON public.properties AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE))
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE));

CREATE POLICY "Block anonymous mutations"
  ON public.user_profiles AS RESTRICTIVE FOR ALL TO authenticated
  USING      ((SELECT (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE))
  WITH CHECK ((SELECT (auth.jwt()->>'is_anonymous')::boolean IS NOT TRUE));

COMMIT;
