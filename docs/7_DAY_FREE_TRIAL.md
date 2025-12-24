# 7-Day Premium Free Trial Implementation

## Overview
All new users automatically receive a **7-day premium trial** when they sign up for Prompt & Pause. This is implemented purely in the database without creating Stripe subscriptions, providing a seamless onboarding experience.

---

## How It Works

### 1. Signup Process
When a user signs up (via email/password or Google OAuth):

1. **Database Trigger** (`handle_new_user()`) automatically creates a profile with:
   - `subscription_status = 'premium'`
   - `subscription_end_date = NOW() + 7 days`

2. User immediately gets access to **all premium features**:
   - Daily personalized prompts (7 days/week)
   - Unlimited reflection archive
   - Weekly AI insights
   - Advanced mood analytics
   - Export reflections
   - Custom focus areas
   - Priority support

### 2. During Trial Period
- Users see a **friendly banner** in their dashboard:
  - **Days 1-4**: Blue info banner ("Enjoying Your Premium Trial?")
  - **Days 5-6**: Yellow warning banner ("X Days Left")
  - **Last Day**: Amber urgent banner ("Last Day of Premium Trial")

- Banner is **dismissible** and shows:
  - Time remaining
  - Encouragement message
  - "Upgrade" CTA button linking to pricing page

### 3. Trial Expiration
**Daily Cron Job** (`/api/cron/check-trial-expiry`) runs at 9 AM UTC:

1. **Finds expired trials**: Users with `subscription_status='premium'`, `subscription_end_date < NOW()`, and no Stripe subscription
2. **Downgrades to freemium**: Updates `subscription_status='freemium'`
3. **Sends email notification**: Branded email explaining what happened and inviting upgrade
4. **Logs event**: Records downgrade in `subscription_events` table

### 4. After Trial Ends
User is automatically moved to **Free Tier** with access to:
- 3 personalized prompts per week
- Basic mood tracking
- Access to last 50 reflections
- Email delivery at chosen time

---

## Implementation Files

### Database
- **`sql/supabase-schema.sql`**: Updated `handle_new_user()` trigger to grant 7-day trial

### Email Templates
- **`lib/services/emailService.ts`**: 
  - `sendTrialExpiredEmail()` function
  - `generateTrialExpiredEmailHTML()` branded template
  - Matches existing email style with gold accent colors

### UI Components
- **`app/dashboard/components/trial-expiry-banner.tsx`**:
  - Responsive banner with 3 visual states (info/warning/urgent)
  - Dismissible with smooth animations
  - Mobile-friendly design

### Business Logic
- **`lib/utils/tierManagement.ts`**: 
  - Updated all tier detection functions to respect `subscription_end_date`
  - `getUserTier()` now checks if trial has expired
  - All dependent functions updated with new signature

### Cron Job
- **`app/api/cron/check-trial-expiry/route.ts`**:
  - Processes expired trials daily
  - Downgrades users
  - Sends emails
  - Logs events
  - Secured with `CRON_SECRET` environment variable

### Configuration
- **`vercel.json`**: Added cron schedule `"0 9 * * *"` (daily at 9 AM UTC)

---

## Environment Variables

Add to `.env.local` and production:

```bash
# Cron job security (optional but recommended)
CRON_SECRET=your_random_secret_key_here

# Email service (required for trial expiry emails)
RESEND_API_KEY=re_xxxxx
RESEND_FROM_EMAIL=prompts@promptandpause.com
```

---

## Testing

### Manual Test Flow

1. **Sign up** as a new user
2. **Verify trial status** in database:
   ```sql
   SELECT id, email, subscription_status, subscription_end_date 
   FROM profiles 
   WHERE email = 'test@example.com';
   ```
   Should show: `subscription_status='premium'`, `subscription_end_date` 7 days from now

3. **Check dashboard** - you should see the trial banner

4. **Test early expiration** (for testing only):
   ```sql
   UPDATE profiles 
   SET subscription_end_date = NOW() - INTERVAL '1 day'
   WHERE email = 'test@example.com';
   ```

5. **Trigger cron manually**:
   ```bash
   curl -X POST http://localhost:3000/api/cron/check-trial-expiry \
     -H "Authorization: Bearer YOUR_CRON_SECRET"
   ```

6. **Verify results**:
   - User downgraded to `freemium`
   - Email sent
   - Event logged in `subscription_events`

### Automated Testing
```bash
# Test signup flow
npm run test:e2e -- --spec "signup.spec.ts"

# Test tier management
npm run test:unit -- tierManagement.test.ts

# Test email template
npm run test:email -- trial-expired
```

---

## Upgrading During Trial

If a user upgrades to premium **during the trial**:

1. Stripe webhook creates subscription
2. `subscription_id` and `stripe_customer_id` populated
3. `subscription_end_date` updated to Stripe's period end
4. User keeps premium access seamlessly
5. Stripe takes over billing after trial ends

**No interruption** - trial transitions smoothly to paid subscription.

---

## Banner Display Logic

```typescript
// Days 1-7: Show banner if daysRemaining <= 7
if (daysRemaining > 7) return null

// Trial expired
if (isExpired) {
  // Red urgent banner with "Upgrade to Premium" CTA
}

// Days 1-3 remaining
else if (daysRemaining <= 3) {
  // Yellow warning banner with "Upgrade Now" CTA
}

// Days 4-7 remaining
else {
  // Blue info banner with "View Plans" CTA
}
```

---

## Email Template Preview

**Subject**: `Your 7-Day Premium Trial Has Ended`

**Content**:
- Friendly greeting with user's name
- Explanation that trial ended
- Info box showing free tier features
- Premium features reminder with pricing
- Clear "Upgrade to Premium" CTA button
- Branded with gold accent color and Prompt & Pause logo

**Style**: Matches all existing email templates (welcome, daily prompt, weekly digest)

---

## Database Schema

### Profiles Table
```sql
subscription_status TEXT DEFAULT 'freemium'
  -- Values: 'freemium', 'premium', 'cancelled'
  
subscription_end_date TIMESTAMP WITH TIME ZONE
  -- Set to NOW() + 7 days on signup
  -- Updated when Stripe subscription starts
  
subscription_id TEXT
  -- NULL for trial users
  -- Populated when user upgrades to Stripe subscription
```

### Subscription Events Table
```sql
INSERT INTO subscription_events (
  user_id,
  event_type,      -- 'downgraded'
  old_status,      -- 'premium'
  new_status,      -- 'freemium'
  metadata         -- { reason: 'trial_expired', trial_end_date: '...' }
)
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Trial Signup Rate**: % of new users starting trial
2. **Trial-to-Paid Conversion**: % upgrading before trial ends
3. **Trial Usage**: Average reflections during trial period
4. **Email Open Rate**: Trial expiry email engagement
5. **Upgrade Timing**: When during trial users upgrade

### Query Examples

```sql
-- Users currently on trial
SELECT COUNT(*) 
FROM profiles 
WHERE subscription_status = 'premium' 
  AND subscription_id IS NULL 
  AND subscription_end_date > NOW();

-- Trial conversion rate (last 30 days)
SELECT 
  COUNT(*) FILTER (WHERE subscription_id IS NOT NULL) * 100.0 / 
  COUNT(*) as conversion_rate
FROM profiles
WHERE created_at > NOW() - INTERVAL '30 days';

-- Expired trials needing processing
SELECT COUNT(*) 
FROM profiles 
WHERE subscription_status = 'premium' 
  AND subscription_end_date < NOW() 
  AND subscription_id IS NULL;
```

---

## Troubleshooting

### Issue: Cron not running
- **Check**: Vercel dashboard → Cron Jobs tab
- **Verify**: Environment variables set in production
- **Test**: Trigger manually via curl

### Issue: Emails not sending
- **Check**: Resend API key configured
- **Verify**: `RESEND_FROM_EMAIL` is verified in Resend dashboard
- **Test**: Send test email via API route

### Issue: Users not downgraded
- **Check**: Cron logs in Vercel
- **Verify**: Database query returns expected users
- **Debug**: Run cron locally with test data

### Issue: Banner not showing
- **Check**: User's `subscription_end_date` in database
- **Verify**: Trial expiry banner component imported in dashboard layout
- **Test**: Calculate `daysRemaining` manually

---

## Future Enhancements

### Potential Improvements

1. **Trial Extension**: Allow admin to extend trials for specific users
2. **Trial Analytics Dashboard**: Visual reports on trial conversions
3. **A/B Testing**: Test different trial lengths (5 days vs 7 days vs 14 days)
4. **Reminder Emails**: Send email at day 5 ("2 days left!")
5. **Exit Survey**: Ask why users didn't upgrade
6. **Grace Period**: Give 1-2 extra days after expiry before hard downgrade
7. **Referral Bonus**: Extended trial for referring friends

---

## Support

For issues or questions:
- Check logs: Vercel → Functions → `/api/cron/check-trial-expiry`
- Database queries: Supabase → SQL Editor
- Email delivery: Resend Dashboard
- Contact: dev@promptandpause.com

---

## Changelog

### 2025-11-24 - Initial Implementation
- ✅ Database trigger for automatic 7-day trial
- ✅ Trial expiry banner component (3 visual states)
- ✅ Branded email template for trial expiration
- ✅ Cron job for automatic processing
- ✅ Updated tier management logic
- ✅ Vercel cron configuration

---

*Last Updated: 2025-11-24*  
*Maintained by: Development Team*
