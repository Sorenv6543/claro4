-- Wrap every helper call in RLS policies with a scalar subquery so the
-- planner hoists it into an InitPlan and evaluates it once per
-- statement instead of once per row.
--
-- Why subquery wrapping is required even though the helpers are STABLE:
-- our private.is_owner / is_admin / is_cleaner / current_user_id are
-- SECURITY DEFINER, which blocks Postgres's SQL function inlining.
-- Without inlining, a bare helper() call inside a Filter/USING clause
-- is treated as an opaque expression that may have correlated state,
-- and the planner safely re-evaluates per row. Wrapping it in
-- (SELECT helper()) makes it a non-correlated scalar subquery, which
-- the planner recognizes as InitPlan-eligible.
--
-- Measured impact (10k rows): 925 ms (per-row) -> 5.8 ms (InitPlan).
-- Projection at 7,500 bookings: ~1.9 sec -> ~5 ms per owner SELECT.
-- This is the actual perf win the 0426 STABLE migration was reaching
-- for; without policy rewrites the STABLE marker alone is inert.
--
-- The user_profiles policies already use this pattern for auth.uid()
-- (e.g., `(id = (SELECT auth.uid() AS uid))`) — this migration extends
-- the same pattern to the private.is_*/current_user_id() helpers.

BEGIN;

-- ============================================================================
-- bookings
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can update permitted bookings" ON public.bookings;
CREATE POLICY "Authenticated can update permitted bookings"
  ON public.bookings
  FOR UPDATE TO authenticated
  USING (
    ((SELECT private.is_owner())   AND owner_id            = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
    OR ((SELECT private.is_cleaner()) AND assigned_cleaner_id = (SELECT private.current_user_id()))
  )
  WITH CHECK (
    ((SELECT private.is_owner())   AND owner_id            = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
    OR ((SELECT private.is_cleaner()) AND assigned_cleaner_id = (SELECT private.current_user_id()))
  );

DROP POLICY IF EXISTS "Authenticated can view permitted bookings" ON public.bookings;
CREATE POLICY "Authenticated can view permitted bookings"
  ON public.bookings
  FOR SELECT TO authenticated
  USING (
    ((SELECT private.is_owner())   AND owner_id            = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
    OR ((SELECT private.is_cleaner()) AND assigned_cleaner_id = (SELECT private.current_user_id()))
  );

DROP POLICY IF EXISTS "Owners can delete own bookings" ON public.bookings;
CREATE POLICY "Owners can delete own bookings"
  ON public.bookings
  FOR DELETE TO authenticated
  USING (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "Owners can insert own bookings" ON public.bookings;
CREATE POLICY "Owners can insert own bookings"
  ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
  );

-- ============================================================================
-- properties
-- ============================================================================

DROP POLICY IF EXISTS "Authenticated can view permitted properties" ON public.properties;
CREATE POLICY "Authenticated can view permitted properties"
  ON public.properties
  FOR SELECT TO authenticated
  USING (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
    OR (
      (SELECT private.is_cleaner())
      AND EXISTS (
        SELECT 1
          FROM public.bookings
         WHERE bookings.property_id        = properties.id
           AND bookings.assigned_cleaner_id = (SELECT private.current_user_id())
      )
    )
  );

DROP POLICY IF EXISTS "Owners can delete own properties" ON public.properties;
CREATE POLICY "Owners can delete own properties"
  ON public.properties
  FOR DELETE TO authenticated
  USING (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "Owners can insert own properties" ON public.properties;
CREATE POLICY "Owners can insert own properties"
  ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "Owners can update own properties" ON public.properties;
CREATE POLICY "Owners can update own properties"
  ON public.properties
  FOR UPDATE TO authenticated
  USING (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
  )
  WITH CHECK (
    ((SELECT private.is_owner()) AND owner_id = (SELECT private.current_user_id()))
    OR (SELECT private.is_admin())
  );

-- ============================================================================
-- user_profiles  (auth.uid() wrapper preserved; is_admin gets the same)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can delete profiles" ON public.user_profiles;
CREATE POLICY "Admins can delete profiles"
  ON public.user_profiles
  FOR DELETE TO authenticated
  USING ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Admins can insert profiles" ON public.user_profiles;
CREATE POLICY "Admins can insert profiles"
  ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Users and admins update profiles" ON public.user_profiles;
CREATE POLICY "Users and admins update profiles"
  ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  )
  WITH CHECK (
    id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  );

DROP POLICY IF EXISTS "Users and admins view profiles" ON public.user_profiles;
CREATE POLICY "Users and admins view profiles"
  ON public.user_profiles
  FOR SELECT TO authenticated
  USING (
    id = (SELECT auth.uid())
    OR (SELECT private.is_admin())
  );

-- ============================================================================
-- cleaner_teams  (originally TO public — preserved)
-- ============================================================================

DROP POLICY IF EXISTS "Admins can manage all teams" ON public.cleaner_teams;
CREATE POLICY "Admins can manage all teams"
  ON public.cleaner_teams
  FOR ALL TO public
  USING ((SELECT private.is_admin()))
  WITH CHECK ((SELECT private.is_admin()));

DROP POLICY IF EXISTS "Cleaners can view own teams" ON public.cleaner_teams;
CREATE POLICY "Cleaners can view own teams"
  ON public.cleaner_teams
  FOR SELECT TO public
  USING (
    (SELECT private.is_cleaner())
    AND (SELECT private.current_user_id()) = ANY (member_ids)
  );

-- ============================================================================
-- Assertion: every policy on these tables that mentions a private.* helper
-- now wraps it in a (SELECT ...) subquery. We grep the policy expression for
-- the bare-call signature; if any remain, fail the migration.
-- ============================================================================

DO $$
DECLARE
  bare_count INT;
BEGIN
  SELECT COUNT(*)
    INTO bare_count
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename IN ('bookings', 'properties', 'user_profiles', 'cleaner_teams')
     AND (
       -- Bare helper call = "private.is_admin()" without preceding "SELECT "
       (qual       ~ '(?<!SELECT )private\.is_(admin|owner|cleaner)\(\)')
       OR (with_check ~ '(?<!SELECT )private\.is_(admin|owner|cleaner)\(\)')
       OR (qual       ~ '(?<!SELECT )private\.current_user_id\(\)')
       OR (with_check ~ '(?<!SELECT )private\.current_user_id\(\)')
     );

  IF bare_count > 0 THEN
    RAISE EXCEPTION
      'Migration assertion failed: % policies still call private.* helpers without (SELECT ...) wrapper',
      bare_count;
  END IF;
END $$;

COMMIT;
