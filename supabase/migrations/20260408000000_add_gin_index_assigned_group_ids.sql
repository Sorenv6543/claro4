-- Add GIN index for array containment queries on assigned_group_ids
-- Without this, queries like `assigned_group_ids @> ARRAY[cleanerId]` do full table scans
CREATE INDEX IF NOT EXISTS idx_bookings_assigned_group_ids
  ON public.bookings USING GIN (assigned_group_ids);
