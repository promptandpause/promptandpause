# Stripe Customer Portal Setup Guide

**Date**: January 12, 2025  
**Issue**: Customer Portal configuration required for subscription management  
**Status**: ⚠️ Action Required

## Problem

When users try to downgrade or manage their subscription, they see an error:
```
No configuration provided and your live mode default configuration has not been created.
```

This means the Stripe Customer Portal hasn't been configured yet in your Stripe Dashboard.

## Solution: Configure Stripe Customer Portal

### Step 1: Access Stripe Dashboard

1. Go to: https://dashboard.stripe.com/settings/billing/portal
2. Make sure you're in **Live Mode** (toggle in top right corner)

### Step 2: Configure Portal Settings

Configure the following sections:

#### **1. Business Information**
- Add your business name: "Prompt & Pause"
- Add your business logo (optional)
- Add support email: `support@promptandpause.com`
- Add support phone (optional)
- Add Terms of Service link (optional)
- Add Privacy Policy link (optional)

#### **2. Features**
Enable these features for customers:

✅ **Update payment method** - Allow customers to update their card
✅ **Cancel subscription** - Allow customers to cancel (important for downgrade)
✅ **Update subscription** - Allow customers to switch plans
- ✅ Switch to different plan
- ✅ Change billing cycle (monthly/yearly)

**Cancellation settings:**
- When to cancel: **At the end of the billing period** (recommended)
- Cancellation reasons: Enable feedback collection
- Customer retention: Optional - add a retention message

#### **3. Appearance**
- **Colors**: Match your brand colors
- **Font**: Choose a font that matches your app
- **Button style**: Rounded or square

#### **4. Test Your Configuration**
- Use the preview button to see how it looks
- Try the portal in test mode first before activating in live mode

### Step 3: Save Configuration

1. Review all settings
2. Click **"Save"** or **"Activate"** at the top of the page
3. The portal is now live!

## Testing

After setup, test the portal:

### Test Mode (Recommended First)
1. Switch to **Test Mode** in Stripe Dashboard
2. Create a test subscription in your app
3. Try accessing the customer portal from Settings
4. Verify you can:
   - View subscription details
   - Cancel subscription
   - Update payment method

### Live Mode
1. Switch to **Live Mode**
2. Test with a real (or test card in live mode)
3. Verify portal access works correctly

## What Users Can Do in the Portal

Once configured, users can:
- ✅ View their subscription details
- ✅ Cancel their subscription (downgrades to free at period end)
- ✅ Update payment method
- ✅ Switch between monthly and yearly billing
- ✅ View invoices and payment history
- ✅ Update billing information

## Code Changes Made

### API Route (`app/api/subscription/portal/route.ts`)
- Added better error handling for unconfigured portal
- Returns helpful error message with setup URL
- Status code 503 (Service Unavailable) when portal not configured

### Frontend (`app/dashboard/settings/page.tsx`)
- Updated `confirmDowngrade` function to handle portal errors gracefully
- Updated `handleCancelSubscription` with same error handling
- Shows user-friendly message: "Please contact support@promptandpause.com"

## Error Messages

### Before Configuration
Users see:
> "Portal Setup Required  
> The customer portal is being set up. Please contact support@promptandpause.com to manage your subscription."

### After Configuration
Users are redirected to Stripe Customer Portal where they can:
- Manage their subscription
- Cancel/downgrade
- Update payment details

## Important Notes

1. **Test Mode First**: Always test in Stripe Test Mode before going live
2. **Two Configurations**: You need to configure both Test Mode AND Live Mode separately
3. **Return URL**: Already configured in code to return to `/dashboard/settings`
4. **Cancellation**: Set to "end of period" so users keep Premium until their billing cycle ends
5. **Support Email**: Users may email support if they can't access the portal

## Troubleshooting

### "Portal not configured" error persists
- Make sure you saved the configuration
- Verify you're in the correct mode (Test vs Live)
- Check that the configuration is activated

### Users can't cancel
- Verify "Cancel subscription" is enabled in portal settings
- Check cancellation behavior is set correctly

### Portal doesn't load
- Check your `NEXT_PUBLIC_APP_URL` environment variable
- Verify return URL is correct
- Check Stripe customer ID exists for the user

## Quick Setup Checklist

- [ ] Access https://dashboard.stripe.com/settings/billing/portal
- [ ] Switch to Live Mode
- [ ] Add business information
- [ ] Enable "Cancel subscription" feature
- [ ] Set cancellation to "at end of period"
- [ ] Enable "Update payment method"
- [ ] Save/Activate configuration
- [ ] Test in Test Mode first
- [ ] Test in Live Mode
- [ ] Verify downgrade flow works

## Support

If you need help:
- Stripe Documentation: https://stripe.com/docs/billing/subscriptions/customer-portal
- Stripe Support: Available in your dashboard

## Related Files

- API Route: `app/api/subscription/portal/route.ts`
- Settings Page: `app/dashboard/settings/page.tsx`
- Environment: `.env.local` (STRIPE_SECRET_KEY, NEXT_PUBLIC_APP_URL)
