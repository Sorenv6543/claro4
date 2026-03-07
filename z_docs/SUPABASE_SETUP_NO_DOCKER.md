# 🚀 Supabase Setup Without Docker

**Alternative Options for Development & Testing**

---

## **Option 1: Supabase Cloud (Recommended) ⭐**

### **Benefits:**
- ✅ No Docker required
- ✅ Production-like environment
- ✅ Real-time subscriptions work perfectly
- ✅ Free tier available (500MB database)
- ✅ Easy to scale to production
- ✅ Includes all features (Auth, RLS, Real-time, etc.)

### **Setup (5 minutes):**

#### **Step 1: Create Supabase Project**
1. Go to: https://app.supabase.com
2. Sign up (free account)
3. Click "New Project"
4. Configure:
   - Project name: `claro3`
   - Database password: (generate strong one)
   - Region: (choose closest to you)
5. Wait for database to initialize (~2 min)

#### **Step 2: Get Connection Keys**
1. Navigate to: **Settings → API**
2. Copy these values:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public key** → `VITE_SUPABASE_ANON_KEY`
   - **service_role secret** → `VITE_SUPABASE_SERVICE_ROLE_KEY`

#### **Step 3: Create `.env.local`**
```bash
# Create from template
cp .env.local.example .env.local

# Edit .env.local:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_ENVIRONMENT=development
```

#### **Step 4: Apply Migrations**
```bash
# You need to manually run migration SQL files in Supabase Studio
# OR use this guide below (Step 5)
```

#### **Step 5: Run Database Migrations**

**Option A: Via Supabase SQL Editor (Simple)**
1. Go to: https://app.supabase.com → Your Project → SQL Editor
2. Click "New Query"
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into SQL Editor
5. Click "Run"
6. Repeat for `002_rls_policies.sql`
7. Repeat for any other migration files

**Option B: Via Supabase CLI (Without Docker) - Windows**
```bash
# Install Supabase CLI (if not already installed)
npm install -g supabase

# Link to your Supabase project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

#### **Step 6: Test Connection**
```bash
# Start your app
pnpm dev

# You should see:
# ✅ 🔗 Connecting to Supabase: https://your-project.supabase.co
```

---

## **Option 2: PostgreSQL Database + Supabase CLI (Advanced)**

### **For Windows Users:**

#### **Step 1: Install PostgreSQL**
1. Download: https://www.postgresql.org/download/windows/
2. Run installer
3. Remember the password you set
4. Default port: 5432

#### **Step 2: Create Database**
```bash
# Open PostgreSQL command line (pgAdmin or psql)
psql -U postgres

# Create database
CREATE DATABASE claro3;
\q
```

#### **Step 3: Apply Migrations Manually**
```bash
# Connect to your database
psql -U postgres -d claro3 -f supabase/migrations/001_initial_schema.sql
psql -U postgres -d claro3 -f supabase/migrations/002_rls_policies.sql
# Repeat for other migrations
```

#### **Step 4: Configure Environment**
```env
VITE_SUPABASE_URL=http://localhost:5432
VITE_SUPABASE_ANON_KEY=dummy-key-for-local
VITE_SUPABASE_SERVICE_ROLE_KEY=dummy-key-for-local
VITE_ENVIRONMENT=development
```

#### **Step 5: Update Frontend**
You'll need to mock auth locally since you're not using Supabase's auth system. This requires modifications to:
- `src/plugins/supabase.ts`
- `src/composables/supabase/useSupabaseAuth.ts`

**This is more complex - see Option 1 instead**

---

## **Option 3: Use Existing Pinia Stores (Quick Testing) ⚡**

### **Skip Supabase for Now**

If you just want to continue development without database changes:

#### **Current Setup Already Works:**
- ✅ Frontend is using Pinia stores
- ✅ In-memory state management
- ✅ Works without Supabase
- ✅ Good for UI/feature development

#### **To Use Current System:**
```bash
# Just start your dev server
pnpm dev

# Your app will work with mock data in Pinia stores
# When ready, migrate to Supabase later
```

#### **When to Switch to Supabase:**
- [ ] Ready for real authentication
- [ ] Need multi-user testing
- [ ] Need real-time updates
- [ ] Deploying to production
- [ ] Need persistent database

---

## **Comparison Table**

| Feature | Cloud (Option 1) | Local DB (Option 2) | Pinia Only (Option 3) |
|---------|------------------|---------------------|----------------------|
| Setup Time | 5 min | 15 min | 2 min |
| Docker Needed | ❌ No | ❌ No | ❌ No |
| Production Ready | ✅ Yes | ❌ No | ❌ No |
| Real-Time | ✅ Works | ❌ Manual setup | ❌ No |
| Authentication | ✅ Full Supabase | ❌ Manual | ❌ Mock |
| RLS Policies | ✅ Enforced | ✅ Enforced | ❌ Frontend only |
| Cost | 💰 Free tier | 💰 Free | 💰 Free |
| Recommended | ⭐⭐⭐ | ⭐⭐ | ⭐ |

---

## 🎯 **RECOMMENDATION: Use Option 1 (Supabase Cloud)**

### **Why:**
1. ✅ Simplest setup (no Docker needed)
2. ✅ Works exactly like production
3. ✅ Free tier is generous ($0-50/mo)
4. ✅ No local infrastructure to maintain
5. ✅ Perfect for testing before production
6. ✅ Real RLS policies enforcement

### **Next Steps if You Choose Option 1:**
```
1. Create account at https://app.supabase.com
2. Create new project
3. Get API keys from Settings → API
4. Create .env.local with keys
5. Run migrations via SQL Editor
6. Test with: pnpm dev
```

---

## 🚀 **Quick Start: Choose Your Path**

### **Path A: Supabase Cloud (Recommended)** ⭐
```bash
# 1. Go to https://app.supabase.com
# 2. Create project and get keys
# 3. Create .env.local with your keys
# 4. Run migrations in SQL Editor
# 5. Start dev server
pnpm dev
```

### **Path B: Stick with Pinia Stores (For Now)**
```bash
# Just run dev - everything works as-is
pnpm dev
```

## 📞 **Troubleshooting**

### **"Cannot find Supabase project"**
- Check your `.env.local` has correct URL and keys
- Verify project exists at https://app.supabase.com
- Make sure project is not paused

### **"RLS policies not working"**
- Run migrations in SQL Editor: `Settings → SQL Editor`
- Copy/paste from `supabase/migrations/002_rls_policies.sql`
- Run the script

### **"Auth not working"**
- Check email auth is enabled: Project Settings → Auth Providers
- Enable email provider if disabled

### **"Real-time not working"**
- Check Realtime is enabled: Project Settings → Realtime
- Verify RLS policies exist

---

## 📚 **Resources**

- **Supabase Dashboard**: https://app.supabase.com
- **Supabase Docs**: https://supabase.com/docs
- **Free Tier**: 500MB database, 2GB file storage, 50k monthly active users



