# Discounts & Gift Subscriptions - Backend Architecture

**Date:** January 7, 2026  
**Status:** Implementation Ready

---

## Executive Summary

This document defines the backend architecture for:
1. **Student & NHS Discounts** (40% off premium)
2. **Gift Subscriptions** (1, 3, 6 months)

All implementations follow industry-standard Stripe patterns with auditable SQL migrations and no manual DB edits.

---

## 1. Student & NHS Discount System

### Business Logic

**Pricing:**
- Monthly: £7.20 (40% off £12)
- Yearly: £59 (40% off £99)

**Key Principle:** Discounts are **distinct Stripe prices**, not coupons.

### Database Schema

**New columns in `profiles`:**
```sql
discount_type TEXT CHECK (discount_type IN ('student', 'nhs', NULL))
discount_verified_at TIMESTAMPTZ
discount_expires_at TIMESTAMPTZ
```

**New table: `discount_invitations`**
```sql
CREATE TABLE discount_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  admin_id UUID REFERENCES profiles(id),
  discount_type TEXT NOT NULL CHECK (discount_type IN ('student', 'nhs')),
  stripe_checkout_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
```

### Stripe Configuration

**New Stripe Products:**
1. "Premium (Student)" - £7.20/month, £59/year
2. "Premium (NHS)" - £7.20/month, £59/year

**Price IDs (add to env vars):**
```
STRIPE_PRICE_STUDENT_MONTHLY=price_xxx
STRIPE_PRICE_STUDENT_ANNUAL=price_xxx
STRIPE_PRICE_NHS_MONTHLY=price_xxx
STRIPE_PRICE_NHS_ANNUAL=price_xxx
```

### Admin Flow

1. **Admin triggers invite:** `POST /api/admin/discounts/invite`
   - Body: `{ user_id, discount_type, billing_cycle }`
   - Admin auth verified
   - Creates discount invitation record
   - Generates Stripe checkout session with discount price
   - Sends email to user with checkout link
   - Expires in 7 days

2. **User completes checkout:**
   - Stripe webhook: `checkout.session.completed`
   - Updates `profiles`: sets `discount_type`, `discount_verified_at`
   - Updates invitation status to 'completed'
   - Sets `subscription_status = 'premium'`, `subscription_tier = 'premium'`

3. **Discount tracking:**
   - All actions logged to `subscription_events` table
   - Admin can view discount redemption status

### Enforcement

- Discount is enforced by **Stripe price ID**, not application logic
- User sees "Premium (Student)" or "Premium (NHS)" in Stripe dashboard
- Application treats discounted users identically to regular premium
- `discount_type` column is metadata for reporting only

---

## 2. Gift Subscription System

### Business Logic

**Pricing:**
- 1 month: £15
- 3 months: £36
- 6 months: £69

**Key Principles:**
- Buyer does NOT need an account
- Recipient MUST have an account to redeem
- Gifts are single-use with expiry
- Cannot stack indefinitely

### Database Schema

**New table: `gift_subscriptions`**
```sql
CREATE TABLE gift_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Purchase info
  stripe_payment_intent_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  purchaser_email TEXT NOT NULL,
  purchaser_name TEXT,
  
  -- Gift details
  duration_months INTEGER NOT NULL CHECK (duration_months IN (1, 3, 6)),
  amount_paid INTEGER NOT NULL, -- in pence
  
  -- Redemption
  redemption_token TEXT UNIQUE NOT NULL,
  recipient_email TEXT,
  recipient_user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'redeemed', 'expired', 'refunded')),
  
  -- Timestamps
  purchased_at TIMESTAMPTZ DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  
  -- Metadata
  gift_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**New columns in `profiles`:**
```sql
gift_subscription_end_date TIMESTAMPTZ
is_gift_subscription BOOLEAN DEFAULT false
```

### Stripe Configuration

**New Stripe Products:**
- "Gift Subscription - 1 Month" - £15 one-time payment
- "Gift Subscription - 3 Months" - £36 one-time payment
- "Gift Subscription - 6 Months" - £69 one-time payment

**Price IDs (add to env vars):**
```
STRIPE_PRICE_GIFT_1_MONTH=price_xxx
STRIPE_PRICE_GIFT_3_MONTHS=price_xxx
STRIPE_PRICE_GIFT_6_MONTHS=price_xxx
```

### Purchase Flow

1. **Buyer initiates:** `POST /api/gifts/create-checkout`
   - Body: `{ duration_months, recipient_email, gift_message, purchaser_name, purchaser_email }`
   - No auth required (buyer doesn't need account)
   - Creates Stripe checkout session (mode: 'payment', not 'subscription')
   - Stores pending gift record
   - Returns checkout URL

2. **Payment completes:**
   - Stripe webhook: `checkout.session.completed` (mode=payment)
   - Updates gift status to 'pending' (awaiting redemption)
   - Generates secure redemption token (32-char random)
   - Sends gift email to recipient
   - Sends purchase confirmation to buyer

### Redemption Flow

1. **User redeems:** `POST /api/gifts/redeem`
   - Body: `{ redemption_token }`
   - Auth required (must be signed in)
   - Verifies:
     - Token is valid
     - Not already redeemed
     - Not expired
     - User email matches recipient_email (if provided)
   
2. **Activation logic:**
   - If user has NO existing subscription:
     - Set `subscription_status = 'premium'`
     - Set `gift_subscription_end_date = NOW() + duration_months`
     - Set `is_gift_subscription = true`
   
   - If user has ACTIVE paid subscription:
     - **Option A (Recommended):** Queue gift for after current subscription ends
     - **Option B:** Add time to current subscription (stacking)
     - **Option C:** Reject redemption, offer refund
   
   - If user has EXPIRED/FREE subscription:
     - Same as "no subscription" case
   
3. **Post-redemption:**
   - Update gift record: `status = 'redeemed'`, `redeemed_at = NOW()`, `recipient_user_id = user.id`
   - Log to `subscription_events`
   - Send confirmation email to user

### Expiry Handling

**Gift expiry (unused gift):**
- Gifts expire 12 months after purchase
- Cron job: `POST /api/cron/expire-gifts` (daily)
- Updates expired gifts to `status = 'expired'`
- No refunds for expired gifts (stated in T&Cs)

**Gift subscription expiry (after redemption):**
- Existing cron: `POST /api/cron/expire-trials` already handles subscription downgrades
- Extend to check `gift_subscription_end_date`
- When gift period ends:
  - Set `subscription_status = 'free'`
  - Set `is_gift_subscription = false`
  - Clear `gift_subscription_end_date`
  - Send "gift expired" email

---

## 3. Webhook Handler Updates

### New Events to Handle

**`checkout.session.completed`** (updated)
```typescript
// Check session.mode
if (session.mode === 'subscription') {
  // Existing subscription logic
  // PLUS: Check if discount price ID → set discount_type
} else if (session.mode === 'payment') {
  // Gift purchase logic
  // Update gift_subscriptions table
}
```

**Discount detection:**
```typescript
const priceId = subscription.items.data[0]?.price.id
let discount_type = null

if (priceId === process.env.STRIPE_PRICE_STUDENT_MONTHLY || 
    priceId === process.env.STRIPE_PRICE_STUDENT_ANNUAL) {
  discount_type = 'student'
} else if (priceId === process.env.STRIPE_PRICE_NHS_MONTHLY || 
           priceId === process.env.STRIPE_PRICE_NHS_ANNUAL) {
  discount_type = 'nhs'
}

await supabase.from('profiles').update({
  subscription_status: 'premium',
  discount_type,
  discount_verified_at: discount_type ? new Date().toISOString() : null
})
```

---

## 4. API Routes

### Discount Routes

**`POST /api/admin/discounts/invite`**
- Auth: Admin only
- Creates discount invitation
- Generates Stripe checkout
- Sends email
- Returns: `{ success, invitation_id }`

**`GET /api/admin/discounts/invitations`**
- Auth: Admin only
- Lists all discount invitations
- Filters: status, discount_type, user_id

### Gift Routes

**`POST /api/gifts/create-checkout`**
- Auth: None (public endpoint)
- Creates Stripe checkout session
- Returns: `{ checkoutUrl }`

**`POST /api/gifts/redeem`**
- Auth: Required (user must be signed in)
- Validates token
- Activates gift subscription
- Returns: `{ success, subscription_end_date }`

**`GET /api/gifts/status/:token`**
- Auth: None (public endpoint)
- Returns gift status (for recipient to check before creating account)
- Returns: `{ valid, expired, redeemed, duration_months }`

**`GET /api/admin/gifts`**
- Auth: Admin only
- Lists all gift purchases
- Filters: status, purchaser_email

### Cron Route

**`POST /api/cron/expire-gifts`**
- Auth: Bearer token (CRON_SECRET)
- Expires unredeemed gifts older than 12 months
- Logs expiry events

---

## 5. Email Templates

### Discount Emails

**`discount_invitation.html`** (to user)
- Subject: "Your [Student/NHS] discount is ready"
- Content:
  - Personal greeting
  - Discount details (40% off, £7.20/month or £59/year)
  - Checkout link (expires in 7 days)
  - What happens next
  - Support contact

### Gift Emails

**`gift_purchase_confirmation.html`** (to buyer)
- Subject: "Gift subscription purchased"
- Content:
  - Thank you message
  - Gift details (duration, amount)
  - Redemption instructions to share with recipient
  - Gift code (for buyer to forward)

**`gift_redemption.html`** (to recipient)
- Subject: "You've received a gift subscription!"
- Content:
  - Gift notification
  - Duration and value
  - Redemption link
  - Requirement to create account first
  - Expiry date (12 months)

**`gift_activated.html`** (to recipient after redemption)
- Subject: "Gift subscription activated"
- Content:
  - Confirmation
  - Subscription end date
  - What happens when it ends (downgrade to free)
  - No billing until gift expires

**`gift_expiring_soon.html`** (to recipient, 7 days before)
- Subject: "Your gift subscription ends soon"
- Content:
  - Expiry reminder
  - Option to subscribe
  - What to expect after expiry

---

## 6. Edge Cases

### Discount System

**Q: User already has premium subscription?**
- A: Discount invitation is blocked. Admin must cancel existing subscription first.

**Q: User redeems discount but then cancels?**
- A: `discount_type` persists in profile (for reporting). Next subscription is full price unless admin sends new discount invite.

**Q: Discount invitation expires unused?**
- A: Invitation status set to 'expired'. Admin can create new invitation.

**Q: User tries to use discount checkout link after expiry?**
- A: Stripe session will be expired (Stripe handles this automatically after 24 hours).

### Gift System

**Q: Recipient has no account?**
- A: Email prompts them to create account first. Token remains valid until expiry.

**Q: Recipient has active paid subscription?**
- A: **Recommended approach:** Queue gift to activate after current subscription ends. Alternative: reject redemption with explanation.

**Q: Recipient has active trial?**
- A: Gift immediately replaces trial. Trial is cancelled, gift subscription activated.

**Q: Gift expires unredeemed?**
- A: No refund (stated in purchase flow). Buyer can contact support for special cases.

**Q: User redeems gift, then immediately cancels?**
- A: No refunds. Gift period runs to completion. No recurring billing.

**Q: Buyer requests refund?**
- A: If unredeemed within 14 days: Admin can mark as 'refunded' via Stripe dashboard. If redeemed: No refunds (stated in T&Cs).

**Q: Token stolen/shared?**
- A: First redemption wins. Single-use tokens prevent reuse. Email verification (if provided) adds security layer.

**Q: User tries to redeem multiple gifts?**
- A: **Recommended:** Stack gifts sequentially (e.g., 3 months + 6 months = 9 months total). Alternative: Limit to one active gift at a time.

---

## 7. Subscription Events Logging

All actions logged to `subscription_events` table:

**New event types:**
- `discount_invited`
- `discount_activated`
- `gift_purchased`
- `gift_redeemed`
- `gift_expired`
- `gift_subscription_ended`

**Example:**
```sql
INSERT INTO subscription_events (
  user_id,
  event_type,
  old_status,
  new_status,
  stripe_event_id,
  metadata
) VALUES (
  'user-uuid',
  'discount_activated',
  'free',
  'premium',
  'evt_xxx',
  '{"discount_type": "student", "billing_cycle": "yearly"}'::jsonb
);
```

---

## 8. Environment Variables

**Add to `.env` and Vercel:**

```bash
# Student Discount Prices
STRIPE_PRICE_STUDENT_MONTHLY=price_xxx
STRIPE_PRICE_STUDENT_ANNUAL=price_xxx

# NHS Discount Prices
STRIPE_PRICE_NHS_MONTHLY=price_xxx
STRIPE_PRICE_NHS_ANNUAL=price_xxx

# Gift Subscription Prices (one-time payments)
STRIPE_PRICE_GIFT_1_MONTH=price_xxx
STRIPE_PRICE_GIFT_3_MONTHS=price_xxx
STRIPE_PRICE_GIFT_6_MONTHS=price_xxx
```

---

## 9. Deployment Checklist

### Pre-deployment

- [ ] Create Stripe products and prices
- [ ] Add all price IDs to `.env.local` (test mode)
- [ ] Add all price IDs to Vercel env vars (production)
- [ ] Run SQL migrations (discount_invitations, gift_subscriptions tables)
- [ ] Add RLS policies to new tables
- [ ] Create email templates in Supabase
- [ ] Update cron job schedule (add expire-gifts)

### Testing (Stripe Test Mode)

- [ ] Test admin discount invite flow
- [ ] Test discount checkout completion
- [ ] Test gift purchase (no account)
- [ ] Test gift redemption (signed-in user)
- [ ] Test gift expiry cron
- [ ] Test webhook handling for both flows
- [ ] Verify email delivery

### Production Deployment

- [ ] Switch Stripe to live mode
- [ ] Update live Stripe webhook endpoint
- [ ] Deploy code to Vercel
- [ ] Verify webhook signatures work
- [ ] Add cron job to cron-job.org: `POST /api/cron/expire-gifts` (daily at 2 AM)
- [ ] Monitor first real transaction

### Post-deployment

- [ ] Document admin discount invite process
- [ ] Create support runbook for gift issues
- [ ] Monitor Stripe dashboard for new products
- [ ] Set up alerts for failed webhooks

---

## 10. Security Considerations

**Discount System:**
- ✅ Admin-only routes protected by `checkAdminAuth()`
- ✅ No user self-service discount application (prevents abuse)
- ✅ Discount invitations expire (7 days)
- ✅ All actions logged and auditable

**Gift System:**
- ✅ Redemption tokens are cryptographically random (32 chars)
- ✅ Single-use tokens (status check prevents reuse)
- ✅ Email verification optional but recommended
- ✅ No account = no redemption (prevents token farming)
- ✅ Expiry enforcement (12 months)
- ✅ Rate limiting on gift purchase endpoint (prevent spam)

**General:**
- ✅ All Stripe webhooks verify signatures
- ✅ RLS enabled on all new tables
- ✅ No sensitive data in URLs (tokens in request body only)
- ✅ Subscription events table provides full audit trail

---

## 11. Future Enhancements (Out of Scope)

- Bulk discount invite CSV upload
- Gift subscription scheduling (send on specific date)
- Custom gift amounts
- Referral credit system
- Automatic discount renewal (annual re-verification)

---

**Status:** Architecture complete. Ready for SQL migrations and implementation.
