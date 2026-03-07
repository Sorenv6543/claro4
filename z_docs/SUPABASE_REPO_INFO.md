# 📊 Supabase Repository Complete Information

**Project**: Claro3 - Multi-tenant Property Cleaning Scheduler  
**Database**: PostgreSQL 15  
**RLS Status**: ✅ Configured  
**Environment**: Local Development  

---

## 🏗️ **Project Configuration**

### **Local Development Setup** (`supabase/config.toml`)

```toml
project_id = "claro"

[api]
enabled = true
port = 54321
schemas = ["public", "storage", "graphql_public"]
max_rows = 1000

[db]
port = 54322
shadow_port = 54320
major_version = 15

[realtime]
enabled = true

[studio]
enabled = true
port = 54323
api_url = "http://localhost:54321"

[inbucket]
enabled = true
port = 54324

[storage]
enabled = true
file_size_limit = "50MiB"

[auth]
enabled = true
site_url = "http://localhost:3000"
additional_redirect_urls = ["https://localhost:3000"]
jwt_expiry = 3600
enable_refresh_token_rotation = true
enable_signup = true
```

### **Port Mapping**

| Service | Port | Purpose |
|---------|------|---------|
| PostgreSQL Database | 54322 | Database server |
| REST API | 54321 | Supabase API endpoint |
| Studio | 54323 | Admin dashboard |
| Email (Inbucket) | 54324 | Email testing |
| Shadow DB | 54320 | Migration diff database |

---

## 📋 **Database Schema**

### **Data Types (Enums)**

```sql
-- User role types
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'cleaner');

-- Booking classification
CREATE TYPE booking_type AS ENUM ('standard', 'turn');

-- Booking lifecycle
CREATE TYPE booking_status AS ENUM ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled');

-- Property classification
CREATE TYPE property_type AS ENUM ('apartment', 'house', 'condo', 'townhouse');

-- Pricing models
CREATE TYPE pricing_tier AS ENUM ('basic', 'standard', 'premium', 'luxury');

-- Priority levels
CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'urgent');

-- UI preferences
CREATE TYPE theme_preference AS ENUM ('light', 'dark', 'system');
```

### **Tables**

#### **1. user_profiles** (extends auth.users)
```
Columns:
├── id (UUID) - PRIMARY KEY, references auth.users(id)
├── email (TEXT) - UNIQUE
├── name (TEXT)
├── role (user_role) - 'owner', 'admin', or 'cleaner'
├── company_name (TEXT) - Optional
├── notifications_enabled (BOOLEAN)
├── timezone (TEXT)
├── theme (theme_preference)
├── language (TEXT)
├── access_level (TEXT) - 'full' or 'limited'
├── skills (TEXT[]) - For cleaners
├── max_daily_bookings (INTEGER) - For cleaners
├── location_lat (DECIMAL)
├── location_lng (DECIMAL)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Indexes:
├── idx_user_profiles_role
└── idx_user_profiles_email

Triggers:
└── update_user_profiles_updated_at
```

**RLS Policies:**
- Users see their own profile
- Users can update their own profile
- Admins see and manage all profiles

---

#### **2. properties** (owner-owned resources)
```
Columns:
├── id (UUID) - PRIMARY KEY
├── owner_id (UUID) - FOREIGN KEY to user_profiles
├── name (TEXT)
├── address (TEXT)
├── bedrooms (INTEGER)
├── bathrooms (INTEGER)
├── square_feet (INTEGER)
├── property_type (property_type)
├── cleaning_duration (INTEGER) - in minutes, default 120
├── special_instructions (TEXT)
├── pricing_tier (pricing_tier)
├── active (BOOLEAN)
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Indexes:
├── idx_properties_owner_id
├── idx_properties_active
└── idx_properties_owner_active

Triggers:
└── update_properties_updated_at
```

**RLS Policies:**
- Owners see their own properties
- Owners can create/update/delete their properties
- Admins see and manage all properties
- Cleaners see properties with assigned bookings

---

#### **3. bookings** (cleaning tasks)
```
Columns:
├── id (UUID) - PRIMARY KEY
├── property_id (UUID) - FOREIGN KEY to properties
├── owner_id (UUID) - FOREIGN KEY to user_profiles
├── checkin_date (TIMESTAMPTZ)
├── checkout_date (TIMESTAMPTZ)
├── booking_type (booking_type) - 'standard' or 'turn'
├── status (booking_status)
├── guest_count (INTEGER)
├── notes (TEXT)
├── priority (priority_level)
├── assigned_cleaner_id (UUID) - FOREIGN KEY to user_profiles
├── created_at (TIMESTAMPTZ)
└── updated_at (TIMESTAMPTZ)

Constraints:
├── checkin_date >= checkout_date
└── assigned_cleaner_id must be a user with role='cleaner'

Indexes:
├── idx_bookings_owner_id
├── idx_bookings_property_id
├── idx_bookings_status
├── idx_bookings_dates
├── idx_bookings_assigned_cleaner
└── idx_bookings_owner_status

Triggers:
└── update_bookings_updated_at
```

**RLS Policies:**
- Owners see bookings for their properties
- Owners can create/update/delete their bookings
- Admins see and manage all bookings
- Cleaners see bookings assigned to them
- Cleaners can update status/notes of assigned bookings

---

## 🔐 **Row Level Security (RLS) Model**

### **Security Functions** (SECURITY DEFINER)

```sql
-- Get current authenticated user ID
private.current_user_id() → UUID

-- Get current user's role
private.current_user_role() → user_role

-- Check if current user is owner
private.is_owner() → BOOLEAN

-- Check if current user is admin
private.is_admin() → BOOLEAN

-- Check if current user is cleaner
private.is_cleaner() → BOOLEAN

-- Validate property ownership
private.validate_property_ownership(property_id, owner_id) → BOOLEAN

-- Test RLS isolation
private.test_rls_isolation() → TABLE(test_name, passed, details)
```

### **Multi-Tenant Architecture**

```
┌─────────────────────────────────────────────┐
│          Authentication (Supabase Auth)     │
├─────────────────────────────────────────────┤
│           User Session (JWT Token)          │
├─────────────────────────────────────────────┤
│     auth.uid() - Current Authenticated User │
├─────────────────────────────────────────────┤
│     RLS Policies - Data Isolation           │
│     ├── Owner Filter: owner_id = auth.uid() │
│     ├── Admin Access: role = 'admin'        │
│     └── Cleaner Access: assigned_cleaner_id │
├─────────────────────────────────────────────┤
│    Database Row Level Security Enforced     │
│    (no data escapes to client without RLS)  │
└─────────────────────────────────────────────┘
```

### **Access Control Matrix**

| Resource | Owner | Admin | Cleaner |
|----------|-------|-------|---------|
| Own Profiles | R/W | R/W/D | R/W |
| All Profiles | ❌ | R/W/D | ❌ |
| Own Properties | R/W/D | R/W/D | ❌ |
| Assigned Property Details | ❌ | R/W/D | R (only assigned) |
| Own Bookings | R/W/D | R/W/D | ❌ |
| Assigned Bookings | ❌ | R/W/D | R/U (assigned only) |

---

## 📂 **Migration Files**

### **001_initial_schema.sql** ✅
- Creates enum types (user_role, booking_type, etc.)
- Creates private schema for security functions
- Creates 3 main tables: user_profiles, properties, bookings
- Sets up critical performance indexes
- Creates auto-update triggers for timestamps
- Creates handle_new_user() trigger for auth integration
- Creates security definer functions for RLS

**Size**: ~400 lines  
**Purpose**: Schema foundation

---

### **002_rls_policies.sql** ✅
- Creates RLS policies for user_profiles table (6 policies)
- Creates RLS policies for properties table (6 policies)
- Creates RLS policies for bookings table (6 policies)
- Creates validation and testing functions
- Comprehensive documentation in SQL comments

**Size**: ~280 lines  
**Purpose**: Security enforcement

---

### **003_convert_role_to_enum.sql** ✅
- Converts existing role data to enum type
- Ensures type safety and consistency

---

### **003_replace_rls_policies.sql** ✅
- Updates RLS policies (refinement)
- Improves policy logic

---

### **004_fix_rls_recursion.sql** ✅
- Fixes recursive RLS issues
- Uses SECURITY DEFINER functions to prevent recursion
- Performance optimization

---

### **010_fix_user_profiles_rls_recursion.sql** ✅
- Final RLS recursion fix for user_profiles table
- Ensures is_admin() can check role without infinite recursion

---

### **Old Migrations** (Reference Only)
```
supabase/old migrations/
├── combined_migration.sql
├── debug_signup_issue.sql
├── fix_handle_new_user_trigger.sql
├── FIX_MISSING_ENUMS.sql
├── fix_signup_complete.sql
├── APPLY_THIS_FIX.sql
├── check_logs.sql
└── config.toml
```

---

## 🎯 **Migration Application Order**

```
1. 001_initial_schema.sql         (Primary schema)
   ↓
2. 002_rls_policies.sql           (Enable RLS)
   ↓
3. 003_convert_role_to_enum.sql   (Data cleanup)
   ↓
4. 003_replace_rls_policies.sql   (Refine RLS)
   ↓
5. 004_fix_rls_recursion.sql      (Fix recursion)
   ↓
6. 010_fix_user_profiles_rls_recursion.sql (Final fix)
```

---

## 🔗 **Relationships & Constraints**

### **Foreign Keys**
```
user_profiles.id ←─── auth.users.id (ON DELETE CASCADE)
        ↑
        │
        ├─── properties.owner_id
        ├─── bookings.owner_id
        └─── bookings.assigned_cleaner_id

properties.id ←─── bookings.property_id (ON DELETE CASCADE)
```

### **Business Rule Constraints**

```sql
-- Booking dates must be valid
checkin_date >= checkout_date

-- Assigned cleaner must actually be a cleaner
assigned_cleaner_id IS NULL OR 
  EXISTS(SELECT 1 FROM user_profiles 
         WHERE id = assigned_cleaner_id AND role = 'cleaner')
```

---

## 📊 **Performance Optimization**

### **Critical Indexes**
```sql
-- User queries
idx_user_profiles_role              -- Role-based filtering
idx_user_profiles_email             -- Email lookups

-- Property queries
idx_properties_owner_id             -- Owner filtering
idx_properties_active               -- Active/inactive filtering
idx_properties_owner_active         -- Combined (most common)

-- Booking queries
idx_bookings_owner_id               -- Owner filtering
idx_bookings_property_id            -- Property lookup
idx_bookings_status                 -- Status filtering
idx_bookings_dates                  -- Date range queries
idx_bookings_assigned_cleaner       -- Cleaner assignment
idx_bookings_owner_status           -- Combined (owner + status)
```

### **Security Definer Functions**
- Prevent RLS recursion
- Cache `auth.uid()` for performance
- Run with elevated privileges (controlled access)

---

## 🚀 **Deployment Readiness**

### **For Local Development (Docker)**
```bash
supabase start                      # Start local instance
supabase db reset                   # Apply all migrations
supabase db push                    # Push new migrations
supabase status                     # Check services
supabase stop                       # Stop instance
```

### **For Production (Supabase Cloud)**
1. Create project at https://app.supabase.com
2. Run migrations in SQL Editor
3. Update environment variables
4. Deploy application

---

## 📋 **Current Status**

| Item | Status | Details |
|------|--------|---------|
| Schema | ✅ Ready | 3 tables with enums and constraints |
| RLS Policies | ✅ Ready | 18 policies (6 per table) |
| Indexes | ✅ Ready | 12 performance indexes |
| Functions | ✅ Ready | Security definer functions optimized |
| Triggers | ✅ Ready | Auto-update timestamps + auth trigger |
| Migrations | ✅ Ready | 6 migrations to apply |
| Config | ✅ Ready | Local dev config in place |
| Documentation | ✅ Ready | SQL comments + guides |

---

## 🔄 **Frontend Integration**

### **Connection Points**

```typescript
// Plugin initialization
src/plugins/supabase.ts
├── Creates Supabase client
├── Reads env variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
└── Configures auth flow (PKCE)

// Auth composable
src/composables/supabase/useSupabaseAuth.ts
├── Signs up new users
├── Handles login/logout
├── Manages session
└── Syncs auth state with stores

// Data composables
src/composables/supabase/
├── useSupabaseBookings.ts
├── useSupabaseProperties.ts
└── useRealtimeSync.ts (for subscriptions)
```

### **Real-Time Features Ready**
- Postgres Change subscriptions configured
- Realtime service enabled on port (custom)
- RLS policies automatically enforce permissions on subscriptions

---

## 📞 **Quick Reference**

### **Environment Variables Needed**
```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_ANON_KEY=<from-supabase-start>
VITE_SUPABASE_SERVICE_ROLE_KEY=<from-supabase-start>
```

### **Key SQL Queries**

```sql
-- Check RLS enabled
SELECT * FROM pg_tables 
WHERE schemaname = 'public' AND rowsecurity = true;

-- View active policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';

-- Check auth user
SELECT auth.uid();

-- Check user role
SELECT role FROM user_profiles WHERE id = auth.uid();
```

### **Test RLS**
```sql
SELECT private.test_rls_isolation();
```

---

## 🎯 **Next Steps**

### **Option 1: Local Development**
```bash
docker run -d postgres:15    # If Docker available
supabase start
supabase db reset
pnpm dev
```

### **Option 2: Cloud Setup**
1. Go to https://app.supabase.com
2. Create new project
3. Copy SQL from migrations to SQL Editor
4. Update .env.local
5. pnpm dev

### **Option 3: Continue with Pinia (Current)**
```bash
pnpm dev  # Uses in-memory stores
```

---

## 📚 **Documentation Files**

- **[SUPABASE_SETUP_NO_DOCKER.md](SUPABASE_SETUP_NO_DOCKER.md)** - Alternative setup options
- **[SUPABASE_SETUP_AUDIT.md](SUPABASE_SETUP_AUDIT.md)** - Audit results
- **[PINIA_DEVELOPMENT_GUIDE.md](PINIA_DEVELOPMENT_GUIDE.md)** - Current in-memory setup
- **[docs/supabase-migration-plan.md](docs/supabase-migration-plan.md)** - Full migration plan
- **[PROJECT_INDEX.md](PROJECT_INDEX.md)** - Codebase structure

---

**Generated**: 2026-02-21  
**Project**: Claro3 Property Cleaning Scheduler  
**Status**: ✅ Ready for Development
