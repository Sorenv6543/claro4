-- supabase/migrations/20260327000000_cleaner_teams_and_assignment.sql

-- 1. Create cleaner_teams table
CREATE TABLE public.cleaner_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  member_ids UUID[] NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update timestamp trigger
CREATE TRIGGER update_cleaner_teams_updated_at
  BEFORE UPDATE ON public.cleaner_teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index for active teams
CREATE INDEX idx_cleaner_teams_active ON public.cleaner_teams (active);

-- 2. Add assignment columns to bookings
ALTER TABLE public.bookings
  ADD COLUMN assigned_team_id UUID REFERENCES public.cleaner_teams(id) ON DELETE SET NULL,
  ADD COLUMN assigned_group_ids UUID[];

-- Index for team assignments
CREATE INDEX idx_bookings_assigned_team ON public.bookings (assigned_team_id);

-- 3. Mutual exclusivity constraint: at most one assignment type
ALTER TABLE public.bookings ADD CONSTRAINT one_assignment_type CHECK (
  (CASE WHEN assigned_cleaner_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN assigned_team_id IS NOT NULL THEN 1 ELSE 0 END +
   CASE WHEN assigned_group_ids IS NOT NULL AND array_length(assigned_group_ids, 1) > 0 THEN 1 ELSE 0 END) <= 1
);

-- 4. RLS for cleaner_teams
ALTER TABLE public.cleaner_teams ENABLE ROW LEVEL SECURITY;

-- Admins: full CRUD
CREATE POLICY "Admins can manage all teams"
  ON public.cleaner_teams
  FOR ALL
  USING (private.is_admin())
  WITH CHECK (private.is_admin());

-- Cleaners: can view teams they belong to
CREATE POLICY "Cleaners can view own teams"
  ON public.cleaner_teams
  FOR SELECT
  USING (private.is_cleaner() AND private.current_user_id() = ANY(member_ids));
