-- supabase/migrations/20260426000001_drop_dev_artifact_tables.sql
-- Drop dev-only tables that have fully-open RLS policies (USING true for
-- INSERT/UPDATE/DELETE) and no migration source. Confirmed by Supabase
-- security advisor 2026-04-26. Neither table has client-side references.
-- If calendar_events becomes a real feature it gets a new migration with
-- scoped policies.

DROP TABLE IF EXISTS public.calendar_events;
DROP TABLE IF EXISTS public.test_table;
