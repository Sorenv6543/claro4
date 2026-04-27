-- Drop stale TO public cleaner_teams policies that were recreated by
-- 20260425194826_rls_policies_initplan_hoist.sql after
-- 20260426000002/000003 had already replaced them with TO authenticated.
-- Leaves only "Authenticated use teams" (FOR ALL, TO authenticated).

BEGIN;

DROP POLICY IF EXISTS "Admins can manage all teams" ON public.cleaner_teams;
DROP POLICY IF EXISTS "Cleaners can view own teams"  ON public.cleaner_teams;

DO $$
DECLARE
  remaining INT;
BEGIN
  SELECT COUNT(*) INTO remaining
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename  = 'cleaner_teams'
    AND roles @> ARRAY['public']::name[];

  IF remaining > 0 THEN
    RAISE EXCEPTION 'Assertion failed: % cleaner_teams policies still target TO public', remaining;
  END IF;
END $$;

COMMIT;
