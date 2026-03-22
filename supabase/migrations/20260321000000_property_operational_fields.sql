-- Add operational fields for cleaning company property management
ALTER TABLE public.properties
  ADD COLUMN color TEXT NOT NULL DEFAULT '#5c6bc0',
  ADD COLUMN floor_type TEXT DEFAULT NULL,
  ADD COLUMN access_info TEXT DEFAULT NULL,
  ADD COLUMN parking_instructions TEXT DEFAULT NULL,
  ADD COLUMN alarm_info TEXT DEFAULT NULL,
  ADD COLUMN contact_name TEXT DEFAULT NULL,
  ADD COLUMN contact_phone TEXT DEFAULT NULL,
  ADD COLUMN trash_day TEXT DEFAULT NULL,
  ADD COLUMN linens_location TEXT DEFAULT NULL;

-- Add CHECK constraint for floor_type enum
ALTER TABLE public.properties
  ADD CONSTRAINT chk_floor_type CHECK (
    floor_type IS NULL OR floor_type IN ('hardwood', 'carpet', 'tile', 'mixed')
  );

COMMENT ON COLUMN public.properties.color IS 'User-selected property color hex, used for cards/sidebar/calendar';
COMMENT ON COLUMN public.properties.access_info IS 'Free text: lockbox codes, smart lock details, key location, gate/garage codes';
COMMENT ON COLUMN public.properties.alarm_info IS 'Alarm system code and arming/disarming instructions';
COMMENT ON COLUMN public.properties.contact_name IS 'Emergency contact name for property issues';
COMMENT ON COLUMN public.properties.contact_phone IS 'Emergency contact phone for property issues';
COMMENT ON COLUMN public.properties.trash_day IS 'Trash/recycling pickup day or schedule';
COMMENT ON COLUMN public.properties.linens_location IS 'Where sheets, towels, and cleaning supplies are stored';
