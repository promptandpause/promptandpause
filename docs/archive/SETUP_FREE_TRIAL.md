# Setup Instructions: 7-Day Free Trial System

## Quick Start

Follow these steps to deploy the 7-day free trial system to your production environment.

---

## 1. Database Migration

Run the updated database trigger in Supabase SQL Editor:

```sql
-- Function to create profile on user signup (called via database webhook or trigger)
-- Automatically grants 7-day premium trial to all new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email, 
    full_name, 
    subscription_status, 
    subscription_end_date
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    'premium',  -- Start with premium access
    NOW() + INTERVAL '7 days'  -- 7-day free trial
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Verify**: Check that existing trigger still references this function:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## 2. Environment Variables

Add to your production environment (Vercel, Netlify, etc.):

```bash
# Optional but recommended - secure your cron endpoint
CRON_SECRET=generate_a_random_secret_here_use_openssl_rand_base64_32

# Required - email service (already configured if you have existing emails)
RESEND_API_KEY=re_xxxxxxxxxxxxx
RESEND_FROM_EMAIL=prompts@promptandpause.com
```

**Generate CRON_SECRET** (optional):
```bash
openssl rand -base64 32
```

---

## 3. Deploy Code Changes

Push your changes to deploy:

```bash
git add .
git commit -m "Add 7-day free trial system"
git push origin main
```

Vercel will automatically:
- Deploy the new cron job (`/api/cron/check-trial-expiry`)
- Configure the cron schedule from `vercel.json`
- Set up the endpoint to run daily at 9 AM UTC

---

## 4. Verify Cron Job

After deployment:

1. **Go to Vercel Dashboard** → Your Project → Cron Jobs
2. **Verify** you see: `/api/cron/check-trial-expiry` scheduled for `0 9 * * *`
3. **Test manually** (optional):
   ```bash
   curl -X POST https://your-app.vercel.app/api/cron/check-trial-expiry \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

---

## 5. Test with New Signup

Create a test account:

1. Sign up as a new user
2. Check database:
   ```sql
   SELECT id, email, subscription_status, subscription_end_date 
   FROM profiles 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```
3. You should see:
   - `subscription_status = 'premium'`
   - `subscription_end_date` = ~7 days from now

4. Check dashboard - trial banner should appear

---

## 6. Import Banner Component

Add the trial banner to your dashboard layout:

### Option A: Add to main dashboard layout
Edit `app/dashboard/layout.tsx`:

```typescript
import { TrialExpiryBanner } from './components/trial-expiry-banner'
import { getSupabaseServerClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }) {
  const supabase = getSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, subscription_status, subscription_end_date, subscription_id')
    .eq('id', user.id)
    .single()

  // Calculate days remaining
  let daysRemaining = 999
  let isExpired = false
  
  if (profile?.subscription_end_date) {
    const endDate = new Date(profile.subscription_end_date)
    const now = new Date()
    const diffTime = endDate.getTime() - now.getTime()
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    isExpired = daysRemaining < 0
  }

  // Only show for trial users (premium but no Stripe subscription)
  const showBanner = profile?.subscription_status === 'premium' && !profile?.subscription_id

  return (
    <div>
      {showBanner && (
        <TrialExpiryBanner 
          daysRemaining={daysRemaining}
          isExpired={isExpired}
          userName={profile?.full_name || null}
        />
      )}
      {children}
    </div>
  )
}
```

### Option B: Add to main dashboard page
Edit `app/dashboard/page.tsx` to include the banner at the top.

---

## 7. Test Trial Expiration (Optional)

To test the expiration flow without waiting 7 days:

```sql
-- Manually expire a test user's trial
UPDATE profiles 
SET subscription_end_date = NOW() - INTERVAL '1 day'
WHERE email = 'your-test-email@example.com';
```

Then trigger cron:
```bash
curl -X POST http://localhost:3000/api/cron/check-trial-expiry \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

Check:
- ✅ User downgraded to `freemium`
- ✅ Email received
- ✅ Event logged in `subscription_events` table

---

## 8. Monitor & Verify

### Check Cron Logs
Vercel Dashboard → Functions → Filter by `/api/cron/check-trial-expiry`

### Check Email Logs
Resend Dashboard → Emails → Filter by subject "Your 7-Day Premium Trial Has Ended"

### Check Database
```sql
-- View subscription events
SELECT * FROM subscription_events 
WHERE event_type = 'downgraded' 
ORDER BY created_at DESC 
LIMIT 10;

-- Current trial users
SELECT email, subscription_end_date 
FROM profiles 
WHERE subscription_status = 'premium' 
  AND subscription_id IS NULL;
```

---

## Rollback (If Needed)

If you need to revert:

1. **Restore old database trigger**:
   ```sql
   CREATE OR REPLACE FUNCTION public.handle_new_user()
   RETURNS TRIGGER AS $$
   BEGIN
     INSERT INTO public.profiles (id, email, full_name)
     VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)));
     RETURN NEW;
   END;
   $$ LANGUAGE plpgsql SECURITY DEFINER;
   ```

2. **Remove cron from vercel.json**:
   ```json
   {
     "crons": [
       // Remove the check-trial-expiry entry
     ]
   }
   ```

3. **Redeploy**

---

## Support Checklist

Before going live, ensure:

- [ ] Database trigger updated
- [ ] Environment variables set (CRON_SECRET optional, RESEND_* required)
- [ ] Code deployed to production
- [ ] Cron job visible in Vercel dashboard
- [ ] Trial banner component integrated in dashboard
- [ ] Test signup verified (user gets premium + 7-day end date)
- [ ] Email template tested (sent successfully)
- [ ] Cron manually triggered successfully
- [ ] Monitoring/alerts set up for cron failures

---

## Next Steps

1. **Monitor first week**: Watch trial signups and conversions
2. **Collect feedback**: Ask users about trial experience
3. **Optimize timing**: Consider A/B testing 5-day vs 7-day vs 14-day trials
4. **Add analytics**: Track trial-to-paid conversion rate

---

**Questions?** Check the full documentation: `docs/7_DAY_FREE_TRIAL.md`
