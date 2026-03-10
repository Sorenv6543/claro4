-- Fix booking_dates_valid constraint direction.
-- Old (wrong): CHECK (checkin_date >= checkout_date) — rejects valid bookings.
-- New (correct): CHECK (checkout_date >= checkin_date) — checkin ≤ checkout.

ALTER TABLE public.bookings
  DROP CONSTRAINT booking_dates_valid;

ALTER TABLE public.bookings
  ADD CONSTRAINT booking_dates_valid CHECK (checkout_date >= checkin_date);
