# 📋 SQL Migrations Checklist

## ✅ What to Run in Supabase SQL Editor

Run these SQL files **in order**:

---

## 1️⃣ **Main Admin Panel Tables & Views**
**File**: `ADMIN_MIGRATIONS_FINAL.sql`

**What it creates**:
- ✅ All admin tables (activity_logs, cron_jobs, email_logs, support, prompts, settings)
- ✅ `admin_user_stats` view (CRITICAL - fixes Users page)
- ✅ All helper functions (MRR, engagement, email stats, support stats)
- ✅ Seed data (email templates, settings, feature flags)

**Status**: ⚠️ **MUST RUN FIRST**

---

## 2️⃣ **Add Billing Cycle Column**
**File**: `ADD_BILLING_CYCLE_COLUMN.sql`

**What it does**:
- ✅ Adds `billing_cycle` column to `profiles` table
- ✅ Sets default value ('monthly') for existing premium users
- ✅ Creates index for faster filtering

**Status**: ⚠️ **RUN AFTER #1**

---

## 📊 After Running Both Files

Your admin panel will have:

### **Pages That Will Work**:
1. ✅ **Dashboard** - All stats
2. ✅ **Users** - List + Detail pages
3. ✅ **Subscriptions** - List + Detail pages with billing cycle
4. ✅ **Analytics** - Charts and trends
5. ✅ **Activity Logs** - Audit trail
6. ✅ **Cron Jobs** - Job monitoring
7. ✅ **Email Tracking** - Email logs
8. ✅ **Support Tickets** - Ticket management
9. ✅ **Prompt Library** - Prompt CRUD
10. ✅ **System Settings** - Configuration

### **Database Tables Created**:
- `admin_activity_logs`
- `cron_job_runs`
- `email_logs`
- `email_templates`
- `support_tickets`
- `support_responses`
- `prompt_library`
- `system_settings`
- `feature_flags`

### **Views Created**:
- `admin_user_stats` (joins profiles + reflections + prompts_history)

### **Functions Created**:
- `calculate_mrr()`
- `get_engagement_stats(days_back)`
- `get_email_stats()`
- `get_support_stats()`
- `update_updated_at_column()`

---

## 🚀 How to Run

### **Step 1: Open Supabase**
1. Go to your Supabase dashboard
2. Click **SQL Editor** in the sidebar

### **Step 2: Run Migration #1**
1. Click **New Query**
2. Copy **entire contents** of `ADMIN_MIGRATIONS_FINAL.sql`
3. Paste and click **Run**
4. ✅ Should see "Migration Complete!" and verification tables

### **Step 3: Run Migration #2**
1. Click **New Query** again
2. Copy **entire contents** of `ADD_BILLING_CYCLE_COLUMN.sql`
3. Paste and click **Run**
4. ✅ Should see "billing_cycle column added successfully!"

### **Step 4: Verify**
Run this query to check everything:
```sql
-- Check tables exist
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE '%admin%' 
  OR tablename LIKE '%support%'
  OR tablename LIKE '%prompt%'
  OR tablename LIKE '%email%'
  OR tablename = 'system_settings'
  OR tablename = 'feature_flags';

-- Check view exists
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
  AND viewname = 'admin_user_stats';

-- Check billing_cycle column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name = 'billing_cycle';

-- Check your premium users have billing_cycle set
SELECT email, subscription_status, billing_cycle 
FROM profiles 
WHERE subscription_status = 'premium';
```

---

## ✅ Expected Results

After running both migrations, you should have:
- **9 new tables** in your database
- **1 view** (`admin_user_stats`)
- **5 functions**
- **billing_cycle column** in profiles with default values set
- **3 email templates** (welcome, password_reset, subscription_confirmation)
- **3 system settings** (app_name, max_daily_prompts, enable_notifications)
- **3 feature flags** (premium_features, email_notifications, analytics_tracking)

---

## 🔧 If Something Goes Wrong

### **Error: "function already exists"**
✅ That's OK - the migration uses `DROP FUNCTION IF EXISTS` to handle this

### **Error: "table already exists"**
✅ That's OK - the migration uses `CREATE TABLE IF NOT EXISTS`

### **Error: "column already exists"**
✅ That's OK - the migration uses `ADD COLUMN IF NOT EXISTS`

### **Other errors**
Copy the error message and let me know - I'll help fix it!

---

## 📝 After Migrations Complete

1. **Restart your Next.js dev server** (Ctrl+C, then `npm run dev`)
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Visit** `/admin-panel`
4. **Test each page**:
   - Dashboard ✅
   - Users ✅
   - Subscriptions ✅
   - Analytics ✅
   - All other pages ✅

All features should now work perfectly! 🎉
