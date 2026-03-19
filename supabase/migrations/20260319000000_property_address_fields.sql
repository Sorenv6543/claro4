-- Migration: Replace property name + single address with structured address fields
-- The property is now identified by its address, not a name

-- Add structured address columns
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS address_street TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_unit TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_city TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_state TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS address_zip TEXT NOT NULL DEFAULT '';

-- Migrate existing data: parse old address into street field as best-effort
UPDATE public.properties
SET address_street = COALESCE(NULLIF(address, ''), name)
WHERE address_street = '';

-- Drop the old columns
ALTER TABLE public.properties
  DROP COLUMN IF EXISTS name,
  DROP COLUMN IF EXISTS address;

-- Add comment
COMMENT ON TABLE public.properties IS 'Properties identified by structured address (street, unit, city, state, zip)';
