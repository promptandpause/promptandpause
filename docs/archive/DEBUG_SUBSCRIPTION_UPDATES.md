# 🔍 Debug Subscription Updates Not Showing

## Step 1: Check Database (Most Important!)

### Open Supabase Dashboard
1. Go to your Supabase project
2. Click **"Table Editor"** in the left menu
3. Click on **"profiles"** table
4. Find your user's email: `promptpause@gmail.com`

### What to Check:
- ✅ `subscription_status` = `premium`
- ✅ `billing_cycle` = `gift_trial`
- ✅ `subscription_end_date` = (a future date)
- ✅ `updated_at` = (recent timestamp)

---

## Step 2: Run SQL Queries

### Copy this into **Supabase SQL Editor**:

```sql
-- Check your specific user
SELECT 
  id,
  email,
  full_name,
  subscription_status,
  billing_cycle,
  subscription_end_date,
  updated_at,
  NOW() as current_time
FROM profiles
WHERE email = 'promptpause@gmail.com';
```

### Expected Result:
```
subscription_status: "premium"
billing_cycle: "gift_trial"
subscription_end_date: "2025-11-09 02:58:23.811"
updated_at: (recent time)
```

---

## Step 3: Check User Dashboard

### Open Browser Console (F12) on User Dashboard

Look for these logs:
```
🔌 [useTier] Setting up Realtime subscription for user: 703a8574-...
📡 [useTier] Realtime channel status: SUBSCRIBED
🔄 [useTier] Starting polling fallback (every 10s)
🔍 [useTier] Polling for subscription changes...
```

### Wait 10 seconds and you should see:
```
🔍 [useTier] Polling for subscription changes...
```

The dashboard should update within 10 seconds.

---

## Step 4: Force Refresh Dashboard

### Try These:

**Option 1: Hard Refresh**
- Windows: `Ctrl + Shift + R`
- Mac: `Cmd + Shift + R`

**Option 2: Clear Cache**
1. Open DevTools (F12)
2. Right-click the refresh button
3. Click "Empty Cache and Hard Reload"

**Option 3: Incognito Mode**
- Open dashboard in incognito/private window
- This bypasses all caching

---

## Step 5: Check Realtime is Working

### In Supabase Dashboard:

1. Go to **Database** → **Replication**
2. Check if **Realtime** is enabled
3. Look for **"profiles"** table in the list
4. Make sure **UPDATE** events are enabled

### If Realtime is NOT enabled:
That's OK! The polling fallback will handle it (updates every 10 seconds).

---

## Step 6: Manual Update Test

### Run this in Supabase SQL Editor:

```sql
-- Manually update the user to trigger a change
UPDATE profiles
SET updated_at = NOW()
WHERE email = 'promptpause@gmail.com';

-- Check if it updated
SELECT email, subscription_status, updated_at
FROM profiles
WHERE email = 'promptpause@gmail.com';
```

Then check if dashboard updates within 10 seconds.

---

## Step 7: Check for Errors

### User Dashboard Console (F12):

Look for any red errors like:
- ❌ `Failed to fetch profile`
- ❌ `Error in useTier`
- ❌ `401 Unauthorized`

### Admin Panel Console:

Check if the update actually succeeded:
```
✅ [Admin] Subscription updated successfully
```

---

## 🔧 Common Issues & Fixes

### Issue 1: Database Updated But Dashboard Not Showing

**Cause**: Caching or browser not polling

**Fix**:
```javascript
// Open browser console on dashboard and run:
window.location.reload(true)
```

---

### Issue 2: "Constraint Violation" Error

**Cause**: `gift_trial` not allowed in database

**Fix**: Run the constraint migration:
```sql
ALTER TABLE public.profiles
DROP CONSTRAINT IF EXISTS profiles_billing_cycle_check;

ALTER TABLE public.profiles
ADD CONSTRAINT valid_billing_cycle 
CHECK (billing_cycle IN ('monthly', 'yearly', 'gift_trial'));
```

---

### Issue 3: Polling Not Working

**Check**: Look for this in console:
```
🔄 [useTier] Starting polling fallback (every 10s)
```

If you DON'T see this, the hook isn't running. Try:
1. Hard refresh the page
2. Clear browser cache
3. Redeploy the code

---

### Issue 4: User Not Logged In

**Check**:
```sql
-- See if user ID exists
SELECT id, email FROM auth.users 
WHERE email = 'promptpause@gmail.com';
```

If no result, user needs to sign in again.

---

## 🧪 Test Subscription Update End-to-End

### Complete Test:

1. **Admin Panel**: Gift 1 month trial
2. **Check Database**: 
   ```sql
   SELECT subscription_status, billing_cycle 
   FROM profiles 
   WHERE email = 'promptpause@gmail.com';
   ```
   Should show: `premium` and `gift_trial`

3. **User Dashboard**: 
   - Open in incognito mode
   - Login as the user
   - Open console (F12)
   - Wait 10 seconds
   - Should see Premium badge

---

## 📊 Verification Checklist

- [ ] Database shows `subscription_status = 'premium'`
- [ ] Database shows `billing_cycle = 'gift_trial'`
- [ ] Database shows `subscription_end_date` is set
- [ ] `updated_at` timestamp is recent
- [ ] Browser console shows polling logs
- [ ] No errors in console
- [ ] Hard refresh was done
- [ ] Waiting at least 10 seconds

---

## 🆘 Still Not Working?

### Get Full Debug Info:

**1. Run this SQL:**
```sql
SELECT 
  id,
  email,
  subscription_status,
  billing_cycle,
  subscription_end_date,
  updated_at,
  NOW() - updated_at as time_since_update
FROM profiles
WHERE email = 'promptpause@gmail.com';
```

**2. Check Browser Console:**
- Copy ALL logs (especially ones with `[useTier]`)

**3. Check Network Tab:**
- Filter for `profiles`
- Look for API calls
- Check response data

**4. Try Direct Database Update:**
```sql
-- Force set to premium
UPDATE profiles
SET 
  subscription_status = 'premium',
  billing_cycle = 'gift_trial',
  subscription_end_date = NOW() + INTERVAL '1 month',
  updated_at = NOW()
WHERE email = 'promptpause@gmail.com';
```

Then hard refresh dashboard and wait 10 seconds.

---

## 🎯 Quick Debug Commands

### Check if update reached database:
```sql
SELECT email, subscription_status, billing_cycle, updated_at
FROM profiles
WHERE email = 'promptpause@gmail.com';
```

### Check recent changes:
```sql
SELECT * FROM subscription_events 
WHERE user_id = '703a8574-bed3-4276-9bae-d6f78834c4ae'
ORDER BY created_at DESC LIMIT 5;
```

### Check if realtime is working:
Look for websocket connection in Network tab (filter: WS)

---

**Most Common Fix**: Hard refresh (`Ctrl+Shift+R`) and wait 10 seconds! 🚀
