# 🔧 Subscription Sync & Pricing Fix

## Issues Found

### 1. Webhook Using Wrong Database Fields
**Problem**: Stripe webhook is updating fields that don't exist in your schema
- ❌ Using: `subscription_tier`, `stripe_subscription_id`, `stripe_subscription_status`
- ✅ Should use: `subscription_status`, `subscription_id`, `billing_cycle`

### 2. No Real-Time Sync
**Problem**: After admin upgrades/downgrades a user, they need to refresh to see changes
- Need to refresh the `useTier` hook after subscription changes

### 3. Wrong Pricing in Admin Panel
**Problem**: Showing $9.99/$99.99 instead of your actual Stripe prices
- Your actual prices: **£12/month** and **£99/year**
- Should fetch from Stripe API, not hardcode

---

## Fix 1: Stripe Webhook (CRITICAL)

**File**: `app/api/webhooks/stripe/route.ts`

### Update `handleSubscriptionUpdate` function:

```typescript
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('Could not find user for customer:', customerId, profileError)
    return
  }

  const userId = profile.id
  const stripeStatus = subscription.status
  const currentPeriodEnd = new Date(subscription.current_period_end * 1000).toISOString()
  
  // Determine subscription status based on price ID
  const priceId = subscription.items.data[0]?.price.id
  const isMonthly = priceId === process.env.STRIPE_PRICE_MONTHLY
  const isYearly = priceId === process.env.STRIPE_PRICE_ANNUAL
  
  // Set status based on subscription - use YOUR schema fields!
  const subscriptionStatus = (stripeStatus === 'active' || stripeStatus === 'trialing') && (isMonthly || isYearly)
    ? 'premium'
    : stripeStatus === 'canceled'
    ? 'cancelled'
    : 'freemium'
  
  const billingCycle = isYearly ? 'yearly' : 'monthly'

  console.log(`Updating subscription for user ${userId}: status=${subscriptionStatus}, stripe_status=${stripeStatus}, cycle=${billingCycle}`)

  // Update profile with CORRECT field names
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: subscriptionStatus,  // ✅ Your actual field name
      subscription_id: subscription.id,         // ✅ Your actual field name
      billing_cycle: billingCycle,              // ✅ Your actual field name
      subscription_end_date: currentPeriodEnd,
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error updating profile:', updateError)
    throw updateError
  }

  // Log subscription event
  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: subscriptionStatus === 'premium' ? 'upgraded' : 'downgraded',
      old_status: null,
      new_status: subscriptionStatus,
      stripe_event_id: subscription.id,
      metadata: {
        billing_cycle: billingCycle,
        price_id: priceId,
        stripe_status: stripeStatus
      }
    })

  console.log(`Successfully updated user ${userId} to ${subscriptionStatus}`)
}
```

### Update `handleSubscriptionDeleted` function:

```typescript
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string
  
  // Get user ID from customer
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('stripe_customer_id', customerId)
    .single()

  if (profileError || !profile) {
    console.error('Could not find user for customer:', customerId)
    return
  }

  const userId = profile.id

  console.log(`Subscription deleted for user ${userId}, downgrading to freemium`)

  // Downgrade to freemium - use YOUR schema fields!
  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({
      subscription_status: 'cancelled',  // ✅ Your actual field name
      billing_cycle: null,               // Clear billing cycle
      updated_at: new Date().toISOString(),
    })
    .eq('id', userId)

  if (updateError) {
    console.error('Error downgrading user:', updateError)
    throw updateError
  }

  // Log subscription event
  await supabaseAdmin
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: 'cancelled',
      old_status: 'premium',
      new_status: 'cancelled',
      stripe_event_id: subscription.id
    })

  console.log(`Successfully downgraded user ${userId} to cancelled`)
}
```

---

## Fix 2: Real-Time Sync for Admin Panel Changes

### Option A: Realtime Database Subscription (Recommended)

**File**: `hooks/useTier.ts`

Add Supabase realtime subscription:

```typescript
useEffect(() => {
  fetchTierData()

  // Subscribe to changes in user's profile
  const supabase = getSupabaseClient()
  
  // Set up realtime subscription
  const channel = supabase
    .channel('profile-changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user?.id}`,  // Only listen to current user's changes
      },
      (payload) => {
        console.log('Profile updated, refreshing tier...', payload)
        fetchTierData()  // Refresh tier data
      }
    )
    .subscribe()

  // Cleanup subscription
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### Option B: Polling (Simpler, works immediately)

**File**: `hooks/useTier.ts`

Add polling every 10 seconds:

```typescript
useEffect(() => {
  fetchTierData()

  // Poll every 10 seconds to check for changes
  const interval = setInterval(() => {
    fetchTierData()
  }, 10000) // 10 seconds

  return () => clearInterval(interval)
}, [])
```

---

## Fix 3: Correct Pricing in Admin Panel

### Option A: Fetch from Stripe API

**File**: Create `lib/stripe/pricing.ts`

```typescript
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
})

export async function getStripePricing() {
  try {
    // Fetch monthly price
    const monthlyPrice = await stripe.prices.retrieve(
      process.env.STRIPE_PRICE_MONTHLY!,
      { expand: ['currency_options'] }
    )

    // Fetch annual price
    const annualPrice = await stripe.prices.retrieve(
      process.env.STRIPE_PRICE_ANNUAL!,
      { expand: ['currency_options'] }
    )

    return {
      monthly: {
        amount: monthlyPrice.unit_amount! / 100, // Convert from pence to pounds
        currency: monthlyPrice.currency.toUpperCase(),
        formatted: new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: monthlyPrice.currency
        }).format(monthlyPrice.unit_amount! / 100)
      },
      annual: {
        amount: annualPrice.unit_amount! / 100,
        currency: annualPrice.currency.toUpperCase(),
        formatted: new Intl.NumberFormat('en-GB', {
          style: 'currency',
          currency: annualPrice.currency
        }).format(annualPrice.unit_amount! / 100)
      }
    }
  } catch (error) {
    console.error('Error fetching Stripe pricing:', error)
    // Fallback to your actual prices
    return {
      monthly: { amount: 12, currency: 'GBP', formatted: '£12' },
      annual: { amount: 99, currency: 'GBP', formatted: '£99' }
    }
  }
}
```

### Option B: Update SQL Migration with Correct Prices

**File**: `ADMIN_MIGRATIONS_FINAL.sql`

Change the seed data:

```sql
-- Insert default system settings (only if they don't exist)
INSERT INTO public.system_settings (key, value, category, description, is_public)
VALUES 
  ('app_name', '"Prompt & Pause"'::jsonb, 'general', 'Application name', true),
  ('app_description', '"Mental wellness through daily reflection"'::jsonb, 'general', 'Application description', true),
  ('support_email', '"support@promptandpause.com"'::jsonb, 'general', 'Support contact email', true),
  ('monthly_price', '12.00'::jsonb, 'billing', 'Monthly subscription price (GBP)', true),  -- ✅ £12
  ('yearly_price', '99.00'::jsonb, 'billing', 'Yearly subscription price (GBP)', true),   -- ✅ £99
  ('currency', '"GBP"'::jsonb, 'billing', 'Pricing currency', true),                      -- ✅ GBP
  ('free_prompt_limit', '3'::jsonb, 'features', 'Number of prompts for free users per day', true),
  ('email_from_name', '"Prompt & Pause"'::jsonb, 'email', 'Email sender name', false),
  ('email_from_address', '"noreply@promptandpause.com"'::jsonb, 'email', 'Email sender address', false),
  ('daily_reminder_enabled', 'true'::jsonb, 'notifications', 'Enable daily reminder emails', false),
  ('welcome_email_enabled', 'true'::jsonb, 'email', 'Send welcome email to new users', false)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();
```

---

## Testing Checklist

### After Applying Fixes:

1. ✅ **Test Webhook**: Make a test subscription in Stripe
   - Check database: `subscription_status` should be 'premium'
   - Check database: `subscription_id` should have Stripe subscription ID
   - Check database: `billing_cycle` should be 'monthly' or 'yearly'

2. ✅ **Test Admin Panel Upgrade**:
   - Admin upgrades a user to premium
   - User's dashboard should update within 10 seconds (or instantly with realtime)
   - No logout/refresh needed

3. ✅ **Test Admin Panel Downgrade**:
   - Admin downgrades a user
   - User's dashboard should immediately show freemium

4. ✅ **Test Pricing Display**:
   - Admin panel should show £12/month and £99/year
   - Not $9.99/$99.99

---

## Priority Order

1. **HIGHEST**: Fix webhook (Fix #1) - This is breaking subscriptions
2. **HIGH**: Fix pricing (Fix #3) - Wrong pricing shown
3. **MEDIUM**: Add real-time sync (Fix #2) - UX improvement

---

## SQL to Update Existing Wrong Data

If you already have users with wrong data:

```sql
-- Check for wrong field names (these shouldn't exist in your schema)
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
  AND column_name IN ('subscription_tier', 'stripe_subscription_id', 'stripe_subscription_status');

-- If billing_cycle is missing, add it (already in ADD_BILLING_CYCLE_COLUMN.sql)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS billing_cycle TEXT CHECK (billing_cycle IN ('monthly', 'yearly'));
```
