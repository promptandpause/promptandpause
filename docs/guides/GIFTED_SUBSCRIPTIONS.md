# Gifted Subscriptions Guide

**Date**: January 12, 2025  
**Purpose**: How to grant and manage gifted Premium subscriptions

## Overview

Your app supports **two types of Premium users**:

### 1. **Paid Subscribers** 💳
- Have `stripe_subscription_id` in profiles table
- Pay monthly (£12) or annually (£99)
- Managed through Stripe
- Cancel at end of billing period

### 2. **Gifted/Trial Users** 🎁
- **No** `stripe_subscription_id` in profiles table
- Have `subscription_end_date` set
- Free Premium access
- Cancel immediately (or expire automatically)

---

## How to Grant Gifted Subscriptions

### Method 1: Via API (Recommended)

**Endpoint:** `POST /api/subscription/gift`

**Requirements:**
- Must be logged in as admin (`ADMIN_EMAIL` in .env)

**Request:**
```bash
POST https://yourapp.com/api/subscription/gift
Content-Type: application/json

{
  "userId": "user-uuid-here",
  "durationDays": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Gifted Premium subscription granted for 30 days",
  "userId": "user-uuid-here",
  "endDate": "12 February 2025",
  "endDateISO": "2025-02-12T20:12:33.000Z"
}
```

**Common durations:**
- `7` - 1 week trial
- `30` - 1 month gift
- `90` - 3 months gift
- `180` - 6 months gift
- `365` - 1 year gift

---

### Method 2: Direct Database Update

**In Supabase SQL Editor:**

```sql
-- Grant 30-day Premium access to a user
UPDATE profiles
SET 
  subscription_status = 'premium',
  subscription_end_date = NOW() + INTERVAL '30 days'
WHERE id = 'user-uuid-here';
```

**Important:** Don't set `stripe_subscription_id` - leave it NULL to indicate it's gifted!

---

## How Users Cancel Gifted Subscriptions

When a gifted user clicks "Switch to Free Tier" or "Cancel Subscription":

### What Happens:
1. API detects no `stripe_subscription_id`
2. Immediately downgrades to Free tier
3. Shows message: "Your gifted Premium access has been removed"
4. No Stripe interaction needed

### Code Flow:
```typescript
// In /api/subscription/cancel
if (profile.stripe_subscription_id) {
  // Paid: Cancel at period end via Stripe
} else {
  // Gifted: Downgrade immediately
  await supabase
    .from('profiles')
    .update({ 
      subscription_status: 'free',
      subscription_end_date: null 
    })
    .eq('id', user.id)
}
```

---

## Automatic Expiration

**Set up a cron job** to automatically downgrade expired gifted subscriptions:

### SQL Query:
```sql
-- Downgrade users whose gifted subscription has expired
UPDATE profiles
SET 
  subscription_status = 'free',
  subscription_end_date = NULL
WHERE 
  subscription_status = 'premium'
  AND stripe_subscription_id IS NULL
  AND subscription_end_date < NOW();
```

### Cron Job (runs daily):
Create `/api/cron/expire-gifted-subs/route.ts`:

```typescript
export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      subscription_status: 'free',
      subscription_end_date: null 
    })
    .lt('subscription_end_date', new Date().toISOString())
    .is('stripe_subscription_id', null)
    .eq('subscription_status', 'premium')
    .select()

  return NextResponse.json({
    success: true,
    expired: data?.length || 0
  })
}
```

---

## Use Cases

### 1. **Free Trials**
```bash
# Grant 7-day trial to new user
POST /api/subscription/gift
{
  "userId": "new-user-id",
  "durationDays": 7
}
```

### 2. **Promotional Giveaways**
```bash
# Contest winner gets 3 months free
POST /api/subscription/gift
{
  "userId": "winner-id",
  "durationDays": 90
}
```

### 3. **Beta Testers**
```bash
# Beta testers get 6 months free
POST /api/subscription/gift
{
  "userId": "beta-tester-id",
  "durationDays": 180
}
```

### 4. **Referral Rewards**
```bash
# User refers friend, gets 1 month free
POST /api/subscription/gift
{
  "userId": "referrer-id",
  "durationDays": 30
}
```

### 5. **Apology/Compensation**
```bash
# Service disruption compensation
POST /api/subscription/gift
{
  "userId": "affected-user-id",
  "durationDays": 14
}
```

---

## Checking Subscription Type

### In Dashboard:

**Paid Subscriber:**
```
Subscription Status: premium
Stripe Customer ID: cus_xxxxx
Stripe Subscription ID: sub_xxxxx
Subscription End Date: null
```

**Gifted User:**
```
Subscription Status: premium
Stripe Customer ID: null
Stripe Subscription ID: null
Subscription End Date: 2025-02-12
```

### In Code:

```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_status, stripe_subscription_id, subscription_end_date')
  .eq('id', userId)
  .single()

if (profile.subscription_status === 'premium') {
  if (profile.stripe_subscription_id) {
    console.log('Paid subscriber')
  } else {
    console.log('Gifted subscriber')
    console.log('Expires:', profile.subscription_end_date)
  }
}
```

---

## Database Schema

Make sure your `profiles` table has:

```sql
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMPTZ;
```

This column:
- **NULL** for paid subscribers and free users
- **Set to date** for gifted subscriptions

---

## Admin UI (Future Enhancement)

You could add to your admin panel:

```tsx
<form onSubmit={handleGiftSubscription}>
  <input 
    type="text" 
    placeholder="User ID" 
    value={userId}
    onChange={e => setUserId(e.target.value)}
  />
  <select value={duration} onChange={e => setDuration(e.target.value)}>
    <option value="7">1 Week</option>
    <option value="30">1 Month</option>
    <option value="90">3 Months</option>
    <option value="180">6 Months</option>
    <option value="365">1 Year</option>
  </select>
  <button type="submit">Grant Premium</button>
</form>
```

---

## Testing

### Test Gifted Subscription Flow:

1. **Grant Premium:**
   ```bash
   POST /api/subscription/gift
   {
     "userId": "test-user-id",
     "durationDays": 1
   }
   ```

2. **Verify user has Premium access**
   - Check dashboard
   - Try Premium features

3. **Cancel as user:**
   - Click "Switch to Free Tier"
   - Should downgrade immediately
   - See: "Your gifted Premium access has been removed"

4. **Verify user is now Free tier**

---

## Security Notes

- ✅ Only admin can grant subscriptions (checked via `ADMIN_EMAIL`)
- ✅ Users can't gift themselves Premium
- ✅ Gifted subs don't bypass payment for upgrades
- ✅ No Stripe interaction = no payment info collected

---

## Related Files

- Gift API: `app/api/subscription/gift/route.ts`
- Cancel API: `app/api/subscription/cancel/route.ts`
- Settings Page: `app/dashboard/settings/page.tsx`

## Environment Variables

```env
ADMIN_EMAIL=promptpause@gmail.com
```
