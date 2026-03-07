---
name: db-migration
description: Create a new Supabase migration file with correct naming, RLS policies, and type sync reminder. Use when adding or modifying database tables or columns.
disable-model-invocation: true
---

## Steps

1. **Generate the filename** using the timestamp format:
   ```
   supabase/migrations/YYYYMMDDHHMMSS_<short_description>.sql
   ```
   Use the current date/time. Example: `20260306142500_add_cleaner_assignments.sql`

2. **Write the migration** with this structure:
   ```sql
   -- Migration: <description>
   -- Created: <date>

   -- Table definition
   CREATE TABLE IF NOT EXISTS <table_name> (
     id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
     owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
     created_at timestamptz DEFAULT now() NOT NULL,
     updated_at timestamptz DEFAULT now() NOT NULL
     -- add columns here
   );

   -- Enable RLS
   ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

   -- Policies
   CREATE POLICY "<table>_select_own" ON <table_name>
     FOR SELECT USING (owner_id = auth.uid());

   CREATE POLICY "<table>_insert_own" ON <table_name>
     FOR INSERT WITH CHECK (owner_id = auth.uid());

   CREATE POLICY "<table>_update_own" ON <table_name>
     FOR UPDATE USING (owner_id = auth.uid());

   CREATE POLICY "<table>_delete_own" ON <table_name>
     FOR DELETE USING (owner_id = auth.uid());
   ```

3. **Remind the user** to:
   - Update `src/types/` to add the corresponding TypeScript type
   - Run `supabase gen types typescript --project-id aejkrsvemqnftivzkkxd > src/types/supabase.ts` if using generated types
   - Run `pnpm build` to confirm no type errors
   - Push the migration: `supabase db push` (or apply via Supabase dashboard)
