-- Allow half-bathrooms (1.5, 2.5, etc.) by changing integer to numeric
ALTER TABLE public.properties
  ALTER COLUMN bathrooms TYPE numeric(4,1) USING bathrooms::numeric(4,1);
