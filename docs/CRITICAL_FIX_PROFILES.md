# CRITICAL: Profiles Table 400 Error Fix

## The Problem

**Symptoms:**
```
POST https://.../rest/v1/profiles 400 (Bad Request)
[useTier] Profile not found, creating default profile
[useTier] Error fetching profile: {code: 'PGRST116', details: 'The result contains 0 rows'}
```

**Root Cause:**
1. Profile doesn't exist in database (PGRST116 error)
2. Code tries to auto-create profile
3. INSERT fails with HTTP 400 Bad Request
4. This creates an infinite loop of failed attempts

**Why 400 Error:**
- Missing required columns in INSERT statement
- RLS policies blocking INSERT
- Table schema mismatch
- Missing permissions

## Immediate Fix Required

### Step 1: Run SQL to Fix Table

Execute `fix_profiles_table.sql` in Supabase SQL Editor:

```sql
-- This will:
-- 1. Create profiles table with correct schema
-- 2. Set up RLS policies for INSERT/SELECT/UPDATE
-- 3. Grant proper permissions
-- 4. Add indexes and triggers
```

### Step 2: Manually Create Profile for Test User

```sql
-- Replace with actual user ID from logs: ca18568f-adb8-46d9-9e0e-66ae85bbc1c3
INSERT INTO profiles (id, email, subscription_status, subscription_tier, created_at, updated_at)
VALUES (
  'ca18568f-adb8-46d9-9e0e-66ae85bbc1c3',
  (SELECT email FROM auth.users WHERE id = 'ca18568f-adb8-46d9-9e0e-66ae85bbc1c3'),
  'free',
  'freemium',
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  subscription_status = 'free',
  subscription_tier = 'freemium',
  updated_at = NOW();
```

### Step 3: Verify Fix

```sql
-- Check profile exists
SELECT * FROM profiles WHERE id = 'ca18568f-adb8-46d9-9e0e-66ae85bbc1c3';

-- Should return 1 row with subscription_status = 'free'
```

## Why This Happened

The auto-creation code was added but the database wasn't set up to accept it:

1. **Missing RLS Policy for INSERT:**
   - Code runs as authenticated user
   - RLS blocks INSERT if no policy exists
   - Need: `CREATE POLICY "Users can insert own profile"`

2. **Schema Mismatch:**
   - Code tries to insert: `id`, `email`, `subscription_status`, `subscription_tier`, `created_at`, `updated_at`
   - Table might be missing columns or have different constraints

3. **Permission Issues:**
   - `authenticated` role might not have INSERT permission
   - Need: `GRANT ALL ON profiles TO authenticated`

## Expected Behavior After Fix

### Before:
```
[useTier] Profile not found, creating default profile
POST /profiles 400 ❌
[useTier] Profile not found, creating default profile
POST /profiles 400 ❌
(infinite loop)
```

### After:
```
[useTier] Profile not found, creating default profile
POST /profiles 201 ✅
✅ Profile created successfully
[useTier] Calculated tier: free
```

## Testing

1. **Clear browser cache and reload**
2. **Check console - should see:**
   ```
   ✅ Profile created successfully
   [useTier] Calculated tier: free
   ```
3. **No more 400 errors**
4. **No more PGRST116 errors**

## Prevention

The `fix_profiles_table.sql` includes:
- ✅ Proper RLS policies for all operations
- ✅ Service role policy for server-side operations
- ✅ All required columns with defaults
- ✅ Proper permissions for authenticated users
- ✅ Indexes for performance
- ✅ Auto-update trigger for `updated_at`

## Additional Issues in Logs

### 406 Errors on moods table
```
/rest/v1/moods?select=*&user_id=eq...&date=eq.2025-12-22 406 (Not Acceptable)
```

**Cause:** Same issue - missing RLS policies or schema problems on `moods` table.

**Fix:** Apply same pattern to `moods` table if needed.

### 500 Errors on /api/user/profile
```
api/user/profile 500 (Internal Server Error)
```

**Cause:** `getUserProfile` function can't create profile due to 400 error.

**Fix:** Will resolve automatically once profiles table is fixed.

## Run This NOW

1. Open Supabase SQL Editor
2. Run `fix_profiles_table.sql`
3. Run manual INSERT for test user
4. Refresh browser
5. Errors should stop

The 400 error is blocking everything. Fix the database schema first, then the auto-creation code will work.
