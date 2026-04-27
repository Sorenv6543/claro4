-- Security hardening: revoke EXECUTE from PUBLIC on all functions that the
-- Supabase security advisor flagged as callable by the unauthenticated `anon`
-- role via REST (/rest/v1/rpc/*).
--
-- PostgreSQL default behaviour: EXECUTE on newly created functions is granted
-- to PUBLIC, which in Supabase includes the `anon` role. The existing
-- GRANT EXECUTE ... TO authenticated in 20260225013203_complete_schema.sql is
-- explicit and survives REVOKE FROM PUBLIC. The net result of
--   REVOKE EXECUTE ... FROM PUBLIC + existing GRANT ... TO authenticated
-- is that authenticated users retain full access; anon users lose access.
--
-- Functions addressed:
--
--   CRITICAL (callable by anon AND by authenticated — privilege escalation):
--     public.create_admin_user(TEXT, TEXT)
--       - REVOKE FROM PUBLIC (removes anon access)
--       - REVOKE FROM authenticated (any owner/cleaner MUST NOT be able to
--         call this; admin creation is an administrative operation reachable
--         only via direct DB access or service_role, not PostgREST /rpc)
--
--   HIGH (private schema — callable by anon via REST):
--     private.current_user_id()
--     private.current_user_role()
--     private.get_user_role_bypass_rls(uuid)
--     private.is_admin()
--     private.is_owner()
--     private.is_cleaner()
--     private.validate_property_ownership(uuid, uuid)
--       - REVOKE ALL FROM PUBLIC for the entire private schema.
--         The existing GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private
--         TO authenticated preserves authenticated-role access for RLS.
--
--   HIGH (public schema trigger/auth functions callable by anon via REST):
--     public.handle_new_user()           — auth trigger, no args
--     public.handle_user_email_linked()  — auth trigger, no args
--     public.rls_auto_enable()           — dev artifact, no args
--     public.validate_assigned_cleaner() — booking trigger, no args
--       - REVOKE FROM PUBLIC individually.
--         These are RETURNS TRIGGER functions. Triggers fire as the session
--         role (postgres/service_role) which bypasses privilege checks, so
--         removing PUBLIC EXECUTE does not affect trigger execution at all.

BEGIN;

-- ============================================================================
-- 1. Revoke EXECUTE on entire private schema from PUBLIC.
--    The existing GRANT TO authenticated is unaffected.
-- ============================================================================

REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA private FROM PUBLIC;

-- ============================================================================
-- 2. Revoke EXECUTE on public.create_admin_user from PUBLIC and authenticated.
--    After these two REVOKEs only superusers / service_role can call this.
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT) FROM authenticated;

-- ============================================================================
-- 3. Revoke EXECUTE on individual public-schema trigger/auth functions.
--    Two REVOKE statements per function: one for PUBLIC (default grant),
--    one for anon explicitly (Supabase issues explicit anon grants on
--    auth trigger functions at creation time).
-- ============================================================================

REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user()           FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_linked()  FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_user_email_linked()  FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()           FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable()           FROM anon;
REVOKE EXECUTE ON FUNCTION public.validate_assigned_cleaner() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.validate_assigned_cleaner() FROM anon;

-- ============================================================================
-- 4. Verification assertions
-- ============================================================================

DO $$
DECLARE
  rec           RECORD;
  proacl_text   TEXT;
  fail_count    INT := 0;
  fail_messages TEXT := '';
BEGIN
  FOR rec IN
    SELECT
      n.nspname                                    AS schema_name,
      p.proname                                    AS func_name,
      pg_get_function_identity_arguments(p.oid)    AS arg_types,
      p.proacl::text                               AS acl_text
    FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE
      n.nspname = 'private'
      OR (n.nspname = 'public' AND p.proname IN (
        'create_admin_user',
        'handle_new_user',
        'handle_user_email_linked',
        'rls_auto_enable',
        'validate_assigned_cleaner'
      ))
  LOOP
    proacl_text := rec.acl_text;

    IF proacl_text IS NULL THEN
      fail_count    := fail_count + 1;
      fail_messages := fail_messages || E'\n  ' ||
        rec.schema_name || '.' || rec.func_name ||
        '(' || rec.arg_types || '): proacl IS NULL — REVOKE FROM PUBLIC had no effect';
      CONTINUE;
    END IF;

    IF proacl_text ~ '(^\{|,)=X/' THEN
      fail_count    := fail_count + 1;
      fail_messages := fail_messages || E'\n  ' ||
        rec.schema_name || '.' || rec.func_name ||
        '(' || rec.arg_types || '): PUBLIC still has EXECUTE — acl=' || proacl_text;
      CONTINUE;
    END IF;

    IF proacl_text ~ '(^\{|,)anon=X/' THEN
      fail_count    := fail_count + 1;
      fail_messages := fail_messages || E'\n  ' ||
        rec.schema_name || '.' || rec.func_name ||
        '(' || rec.arg_types || '): anon still has EXECUTE — acl=' || proacl_text;
      CONTINUE;
    END IF;

    IF rec.schema_name = 'public' AND rec.func_name = 'create_admin_user' THEN
      IF proacl_text ~ '(^\{|,)authenticated=X/' THEN
        fail_count    := fail_count + 1;
        fail_messages := fail_messages || E'\n  ' ||
          rec.schema_name || '.' || rec.func_name ||
          '(' || rec.arg_types || '): authenticated still has EXECUTE — acl=' || proacl_text;
        CONTINUE;
      END IF;
    END IF;
  END LOOP;

  IF fail_count > 0 THEN
    RAISE EXCEPTION
      'Migration assertion failed — % function(s) still have unwanted EXECUTE grants:%',
      fail_count, fail_messages;
  END IF;
END $$;

COMMIT;
