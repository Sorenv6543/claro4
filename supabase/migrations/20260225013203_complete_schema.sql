-- 20260225013203_complete_schema.sql
-- Complete schema for property cleaning scheduler (Claro4)
-- Consolidated from Claro3 with fixes:
--   - properties.id (no typo, was "property _id" in claro3)
--   - bookings uses DATE + TIME split columns (not TIMESTAMPTZ)
--   - bedrooms is INTEGER (not TEXT)
--   - clean RLS policies (no duplicates)
--   - timezone default 'UTC' (not a garbled string)

-- ============================================================================
-- EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'cleaner');
CREATE TYPE booking_type AS ENUM ('standard', 'turn');
CREATE TYPE booking_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled');
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse');
CREATE TYPE pricing_tier AS ENUM ('basic', 'standard', 'premium', 'luxury');
CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');

-- ============================================================================
-- SCHEMAS
-- ============================================================================
CREATE SCHEMA IF NOT EXISTS private;

-- ============================================================================
-- TABLES
-- ============================================================================

-- User profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'owner',
  company_name TEXT,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  timezone TEXT NOT NULL DEFAULT 'UTC',
  theme theme_preference NOT NULL DEFAULT 'system',
  language TEXT NOT NULL DEFAULT 'en',
  access_level TEXT CHECK (access_level IN ('full', 'limited')),
  skills TEXT[],
  max_daily_bookings INTEGER,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  last_sign_in_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.user_profiles IS 'User profiles extending auth.users with role-based fields';

-- Properties table
CREATE TABLE public.properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet INTEGER,
  property_type property_type,
  cleaning_duration INTEGER NOT NULL DEFAULT 120,
  special_instructions TEXT,
  pricing_tier pricing_tier NOT NULL DEFAULT 'standard',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.properties IS 'Properties owned by users, with owner_id for multi-tenant filtering';

-- Bookings table (separate DATE and TIME columns for flexibility)
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES public.user_profiles(id) ON DELETE CASCADE,
  checkout_date DATE NOT NULL,
  checkout_time TIME NOT NULL,
  checkin_date DATE NOT NULL,
  checkin_time TIME NOT NULL,
  booking_type booking_type NOT NULL DEFAULT 'standard',
  status booking_status NOT NULL DEFAULT 'pending',
  guest_count INTEGER,
  notes TEXT,
  priority priority_level NOT NULL DEFAULT 'normal',
  assigned_cleaner_id UUID REFERENCES public.user_profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT booking_dates_valid CHECK (checkout_date >= checkin_date)
);

COMMENT ON TABLE public.bookings IS 'Cleaning bookings with owner_id and property_id relationships';
COMMENT ON COLUMN public.bookings.checkout_date IS 'Date when guests check out (depart) - DATE only';
COMMENT ON COLUMN public.bookings.checkout_time IS 'Time when previous guests check out - start of cleaning window';
COMMENT ON COLUMN public.bookings.checkin_date IS 'Date when guests check in (arrive) - DATE only';
COMMENT ON COLUMN public.bookings.checkin_time IS 'Time when new guests check in - end of cleaning window';

-- ============================================================================
-- INDEXES
-- ============================================================================
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);
CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);

CREATE INDEX idx_properties_owner_id ON public.properties(owner_id);
CREATE INDEX idx_properties_active ON public.properties(active);
CREATE INDEX idx_properties_owner_active ON public.properties(owner_id, active);

CREATE INDEX idx_bookings_owner_id ON public.bookings(owner_id);
CREATE INDEX idx_bookings_property_id ON public.bookings(property_id);
CREATE INDEX idx_bookings_status ON public.bookings(status);
CREATE INDEX idx_bookings_dates ON public.bookings(checkout_date, checkin_date);
CREATE INDEX idx_bookings_assigned_cleaner ON public.bookings(assigned_cleaner_id);
CREATE INDEX idx_bookings_owner_status ON public.bookings(owner_id, status);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Timestamp update trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = 'public';

-- Auto-create user profile on signup (with error logging)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, company_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'full_name', NEW.email),
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'owner'::user_role),
    NEW.raw_user_meta_data->>'company_name'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user: % %', SQLERRM, SQLSTATE;
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public', 'auth';

-- Validate assigned cleaner has cleaner role (trigger)
CREATE OR REPLACE FUNCTION public.validate_assigned_cleaner()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.assigned_cleaner_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.user_profiles
      WHERE id = NEW.assigned_cleaner_id AND role = 'cleaner'
    ) THEN
      RAISE EXCEPTION 'assigned_cleaner_id must reference a user with role cleaner';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Admin user creation helper (for initial setup only, not for regular user creation)
CREATE OR REPLACE FUNCTION public.create_admin_user(user_email TEXT, user_name TEXT)
RETURNS UUID AS $$
DECLARE
  new_user_id UUID;
BEGIN
  INSERT INTO public.user_profiles (id, email, name, role, access_level)
  VALUES (gen_random_uuid(), user_email, user_name, 'admin'::user_role, 'full')
  RETURNING id INTO new_user_id;
  RETURN new_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public';

-- Private RLS helper: current user ID
CREATE OR REPLACE FUNCTION private.current_user_id()
RETURNS UUID AS $$
  SELECT auth.uid();
$$ LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = 'private', 'auth';

-- Private RLS helper: get role bypassing RLS (prevents infinite recursion)
CREATE OR REPLACE FUNCTION private.get_user_role_bypass_rls(user_id UUID)
RETURNS user_role AS $$
DECLARE
  user_role_result user_role;
BEGIN
  SET row_security = off;
  SELECT role INTO user_role_result FROM public.user_profiles WHERE id = user_id;
  SET row_security = on;
  RETURN COALESCE(user_role_result, 'owner'::user_role);
EXCEPTION WHEN others THEN
  SET row_security = on;
  RETURN 'owner'::user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS user_role AS $$
  SELECT private.get_user_role_bypass_rls(auth.uid());
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION private.is_owner()
RETURNS BOOLEAN AS $$
  SELECT private.current_user_role() = 'owner';
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION private.is_admin()
RETURNS BOOLEAN AS $$
  SELECT private.current_user_role() = 'admin';
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION private.is_cleaner()
RETURNS BOOLEAN AS $$
  SELECT private.current_user_role() = 'cleaner';
$$ LANGUAGE SQL SECURITY DEFINER;

CREATE OR REPLACE FUNCTION private.validate_property_ownership(property_uuid UUID, owner_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.properties WHERE id = property_uuid AND owner_id = owner_uuid
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = 'private', 'public';

-- ============================================================================
-- TRIGGERS
-- ============================================================================
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TRIGGER validate_cleaner_assignment
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_assigned_cleaner();

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- USER PROFILES POLICIES
-- Non-recursive: uses auth.uid() directly (no function calls that query user_profiles)
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT TO authenticated USING (id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- Admin policies use EXISTS subquery - safe because subquery is allowed
-- by "Users can view own profile" (filters by auth.uid()), no infinite recursion
CREATE POLICY "Admins can view all profiles" ON public.user_profiles
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'::user_role
  ));

CREATE POLICY "Admins can update all profiles" ON public.user_profiles
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'::user_role
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'::user_role
  ));

CREATE POLICY "Admins can insert profiles" ON public.user_profiles
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'::user_role
  ));

CREATE POLICY "Admins can delete profiles" ON public.user_profiles
  FOR DELETE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.user_profiles up
    WHERE up.id = auth.uid() AND up.role = 'admin'::user_role
  ));

-- PROPERTIES POLICIES
CREATE POLICY "Owners can view own properties" ON public.properties
  FOR SELECT TO authenticated
  USING ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Owners can insert own properties" ON public.properties
  FOR INSERT TO authenticated
  WITH CHECK ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Owners can update own properties" ON public.properties
  FOR UPDATE TO authenticated
  USING ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin())
  WITH CHECK ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Owners can delete own properties" ON public.properties
  FOR DELETE TO authenticated
  USING ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Cleaners can view assigned properties" ON public.properties
  FOR SELECT TO authenticated
  USING (private.is_cleaner() AND EXISTS (
    SELECT 1 FROM public.bookings
    WHERE property_id = properties.id AND assigned_cleaner_id = private.current_user_id()
  ));

-- BOOKINGS POLICIES
CREATE POLICY "Owners can view own bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Owners can insert own bookings" ON public.bookings
  FOR INSERT TO authenticated
  WITH CHECK ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Owners can update own bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin())
  WITH CHECK ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Owners can delete own bookings" ON public.bookings
  FOR DELETE TO authenticated
  USING ((private.is_owner() AND owner_id = private.current_user_id()) OR private.is_admin());

CREATE POLICY "Cleaners can view assigned bookings" ON public.bookings
  FOR SELECT TO authenticated
  USING (private.is_cleaner() AND assigned_cleaner_id = private.current_user_id());

CREATE POLICY "Cleaners can update assigned bookings" ON public.bookings
  FOR UPDATE TO authenticated
  USING (private.is_cleaner() AND assigned_cleaner_id = private.current_user_id())
  WITH CHECK (private.is_cleaner() AND assigned_cleaner_id = private.current_user_id());

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA private TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_admin_user(TEXT, TEXT) TO authenticated;
