-- Migration: Add turn booking metadata columns
-- These fields store same-day turnover details when booking_type = 'turn'

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS turn_date DATE,
  ADD COLUMN IF NOT EXISTS turn_start_time TIME,
  ADD COLUMN IF NOT EXISTS turn_checkin_time TIME;

COMMENT ON COLUMN public.bookings.turn_date IS 'Date when same-day turnover occurs (first guests depart, next guests arrive)';
COMMENT ON COLUMN public.bookings.turn_start_time IS 'Time the departing guests check out on the turn date';
COMMENT ON COLUMN public.bookings.turn_checkin_time IS 'Time the arriving guests check in on the turn date';
