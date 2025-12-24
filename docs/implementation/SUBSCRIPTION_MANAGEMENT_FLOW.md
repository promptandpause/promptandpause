# Subscription Management Flow

**Date**: January 12, 2025  
**Changes**: In-app subscription cancellation instead of Stripe portal redirect

## Overview

Users can now manage their subscriptions directly in the app:
- ✅ **Downgrade to Free** - Handled in-app
- ✅ **Cancel Subscription** - Handled in-app  
- ✅ **Upgrade to Premium** - Redirects to Stripe Checkout (payment required)

## User Flows

### 1. **Upgrade to Premium** 💎
**Trigger:** User clicks "Upgrade to Premium" button

**Flow:**
1. User selects billing cycle (Monthly/Annual)
2. Clicks "Upgrade to Premium"
3. Redirected to **Stripe Checkout** page
4. Enters payment details
5. Completes payment
6. Webhook updates user to Premium tier
7. Redirected back to app

**API Endpoint:** `/api/stripe/create-checkout`

---

### 2. **Downgrade to Free** ⬇️
**Trigger:** Premium user clicks "Switch to Free Tier"

**Flow:**
1. User clicks "Switch to Free Tier" button
2. Confirmation dialog appears with list of features they'll lose
3. User clicks "Yes, downgrade"
4. API cancels subscription with `cancel_at_period_end: true`
5. Success toast shows: "You'll keep Premium until [date]"
6. User stays Premium until end of billing period
7. On period end date, webhook downgrades user to Free tier

**API Endpoint:** `/api/subscription/cancel`

**Benefits:**
- ✅ No redirect to external site
- ✅ Instant feedback
- ✅ User keeps Premium access they paid for
- ✅ Automatic downgrade at period end

---

### 3. **Cancel Subscription** ❌
**Trigger:** Premium user clicks "Cancel Subscription" link

**Flow:**
1. User clicks "Cancel Subscription"
2. Browser confirmation dialog appears
3. User confirms cancellation
4. API cancels subscription with `cancel_at_period_end: true`
5. Success toast shows: "You'll keep Premium until [date]"
6. User stays Premium until end of billing period
7. On period end date, webhook downgrades user to Free tier

**API Endpoint:** `/api/subscription/cancel`

**Same behavior as downgrade** - both use the same cancellation logic

---

## API Endpoints

### `/api/subscription/cancel` (POST)

**Purpose:** Cancel a user's Premium subscription

**Authentication:** Required (Supabase user session)

**Request:**
```typescript
POST /api/subscription/cancel
Content-Type: application/json
// No body required
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "periodEnd": "31 January 2025",
  "cancelAtPeriodEnd": true
}
```

**Response (Error):**
```json
{
  "error": "No active subscription found."
}
```

**Status Codes:**
- `200` - Success
- `400` - No subscription or already on Free tier
- `401` - Not authenticated
- `500` - Server error

**What it does:**
1. Verifies user is authenticated
2. Gets user's profile with `stripe_subscription_id`
3. Validates user is Premium tier
4. Calls Stripe API to set `cancel_at_period_end: true`
5. Returns formatted period end date
6. User keeps Premium until period ends
7. Stripe webhook will downgrade user automatically

---

### `/api/stripe/create-checkout` (POST)

**Purpose:** Create Stripe Checkout session for Premium upgrade

**Still used for upgrades** - requires payment processing

---

### `/api/subscription/portal` (POST)

**Purpose:** Create Stripe Customer Portal session

**Now optional** - only needed if you want users to:
- Update payment method
- View invoice history
- Update billing information

**Not used for cancellation anymore**

---

## Frontend Changes

### Settings Page (`app/dashboard/settings/page.tsx`)

**Updated functions:**

#### `confirmDowngrade()`
- Changed from: Redirect to Stripe portal
- Changed to: Call `/api/subscription/cancel`
- Shows success toast with cancellation date
- Refreshes tier to update UI

#### `handleCancelSubscription()`
- Changed from: Redirect to Stripe portal
- Changed to: Call `/api/subscription/cancel`
- Shows native browser confirmation
- Shows success toast with cancellation date
- Refreshes tier to update UI

---

## Stripe Configuration

### Customer Portal Settings

**You configured:**
- ✅ Business information
- ✅ Payment methods
- ✅ Invoices
- ✅ Subscriptions (proration, downgrades)
- ✅ Cancellations (at end of period)

**But portal is now optional** for basic subscription management

**Portal is still useful for:**
- Updating payment method
- Viewing invoice history
- Updating billing address
- Self-service payment issues

---

## Cancellation Flow Details

### What Happens When User Cancels

**Immediately:**
1. Stripe subscription marked with `cancel_at_period_end: true`
2. User sees confirmation: "You'll keep Premium until [date]"
3. User still has full Premium access

**During Period:**
- User continues to have Premium features
- No charges are made
- Subscription shows as "Cancels on [date]" in Stripe

**At Period End:**
- Stripe webhook fires: `customer.subscription.deleted`
- Webhook handler updates user tier to `free`
- User loses Premium features
- Automatic downgrade - no manual intervention needed

---

## Webhook Events

### `customer.subscription.deleted`

Fires when:
- Subscription period ends after cancellation
- Subscription payment fails (after retries)

Handler should:
- Update user's `tier` to `free` in profiles table
- Log the cancellation
- Send cancellation confirmation email (optional)

---

## User Experience Benefits

### Before (Stripe Portal Redirect):
- ❌ Redirected to external Stripe page
- ❌ Different UI/UX from your app
- ❌ Confusing for users
- ❌ Multiple clicks to cancel

### After (In-App Cancellation):
- ✅ Stay in your app
- ✅ Consistent UI/UX
- ✅ Clear confirmation dialog
- ✅ Immediate feedback
- ✅ One-click cancellation
- ✅ Shows exact date Premium ends

---

## Testing Checklist

### Test Downgrade Flow:
- [ ] Premium user can click "Switch to Free Tier"
- [ ] Confirmation dialog shows features lost
- [ ] Click "Yes, downgrade" cancels subscription
- [ ] Success toast shows correct end date
- [ ] User still has Premium access
- [ ] UI updates to show "Cancels on [date]"
- [ ] At period end, user downgrades to Free

### Test Cancel Flow:
- [ ] Premium user can click "Cancel Subscription"
- [ ] Browser confirmation appears
- [ ] Clicking OK cancels subscription
- [ ] Success toast shows correct end date
- [ ] User still has Premium access
- [ ] Same behavior as downgrade

### Test Upgrade Flow:
- [ ] Free user can click "Upgrade to Premium"
- [ ] Redirects to Stripe Checkout
- [ ] Can complete payment
- [ ] Webhooks updates user to Premium
- [ ] Redirected back to settings

---

## Related Files

- Frontend: `app/dashboard/settings/page.tsx`
- Cancel API: `app/api/subscription/cancel/route.ts`
- Checkout API: `app/api/stripe/create-checkout/route.ts`
- Webhook Handler: `app/api/webhooks/stripe/route.ts`

## Environment Variables Required

```env
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```
