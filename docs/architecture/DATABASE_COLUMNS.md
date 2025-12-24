# Database Column Naming Convention

**Date**: January 12, 2025  
**Critical**: Column name reference for consistent usage

## Profiles Table - Subscription Columns

### ✅ CORRECT Column Names (Use These)

```typescript
{
  subscription_status: 'free' | 'premium',  // ✅ USE THIS
  stripe_customer_id: string | null,
  stripe_subscription_id: string | null,
  subscription_end_date: Date | null,
  billing_cycle: 'monthly' | 'yearly' | null
}
```

### ❌ INCORRECT Column Names (Don't Use These)

```typescript
{
  tier: 'free' | 'premium',  // ❌ COLUMN DOESN'T EXIST
}
```

---

## Why This Matters

### The Problem We Had:
- Code was trying to use `profiles.tier`
- Database column is actually called `subscription_status`
- This caused errors: `column profiles.tier does not exist`

### The Solution:
- **Database**: Uses `subscription_status`
- **Frontend**: Uses `tier` (from `useTier` hook)
- **API Routes**: Must use `subscription_status` when querying database

---

## Usage Examples

### ✅ Correct - API Route (Database Query)
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('subscription_status, stripe_subscription_id')
  .eq('id', userId)
  .single()

if (profile.subscription_status === 'premium') {
  // User is premium
}
```

### ✅ Correct - Frontend (Using Hook)
```typescript
const { tier, features } = useTier()

if (tier === 'premium') {
  // User is premium
}
```

### ❌ Incorrect - API Route
```typescript
const { data: profile } = await supabase
  .from('profiles')
  .select('tier')  // ❌ Column doesn't exist!
  .eq('id', userId)
```

---

## How useTier Hook Works

The `useTier` hook translates `subscription_status` to `tier` for the frontend:

```typescript
// In hooks/useTier.ts (line 79)
const userTier = profile.subscription_status === 'premium' ? 'premium' : 'free'
setTier(userTier)
```

**Why?**
- `subscription_status` is the database column name
- `tier` is a cleaner name for frontend/UI code
- Hook does the translation automatically

---

## Files Using Correct Columns

### ✅ API Routes (Use `subscription_status`)
- `app/api/subscription/cancel/route.ts` ✅ Fixed
- `app/api/subscription/gift/route.ts` ✅ Fixed
- `hooks/useTier.ts` ✅ Already correct

### ✅ Frontend (Use `tier` from hook)
- `app/dashboard/settings/page.tsx` ✅ Correct (uses `tier` from `useTier()`)
- Any component using `useTier()` hook ✅ Correct

---

## Subscription Status Values

```typescript
type SubscriptionStatus = 
  | 'free'      // Free tier user
  | 'premium'   // Premium subscriber (paid or gifted)
  | 'canceled'  // Subscription cancelled (keeps access until period end)
  | 'trialing'  // In trial period
  | null        // No subscription info
```

**Note**: Currently, we mainly use:
- `'free'` - Free tier
- `'premium'` - Premium tier (both paid and gifted)

---

## Related Database Columns

### Subscription Identification

**To determine if Premium is paid or gifted:**
```typescript
if (profile.subscription_status === 'premium') {
  if (profile.stripe_subscription_id) {
    // Paid subscriber
  } else {
    // Gifted/trial user
  }
}
```

### Column Checklist
- `subscription_status` - The user's current tier
- `stripe_customer_id` - Stripe customer ID (null for gifted)
- `stripe_subscription_id` - Stripe subscription ID (null for gifted)
- `subscription_end_date` - When gifted Premium expires (null for paid)
- `billing_cycle` - 'monthly' or 'yearly' (null for free/gifted)

---

## Quick Reference

| Context | Column Name | Values |
|---------|------------|--------|
| **Database Query** | `subscription_status` | `'free'` or `'premium'` |
| **Frontend (from hook)** | `tier` | `'free'` or `'premium'` |
| **Stripe Customer** | `stripe_customer_id` | `'cus_xxx'` or `null` |
| **Stripe Subscription** | `stripe_subscription_id` | `'sub_xxx'` or `null` |
| **Gifted Expiry** | `subscription_end_date` | `Date` or `null` |

---

## Migration Notes

If you ever need to rename the column:

```sql
-- Rename column (if needed in future)
ALTER TABLE profiles 
RENAME COLUMN subscription_status TO tier;

-- Update RLS policies to use new name
-- Update all API routes
-- Update useTier hook
```

**Current decision**: Keep `subscription_status` in database, use `tier` in frontend via hook.

---

## Testing Checklist

When adding new features that check user tier:

- [ ] API routes use `subscription_status` from database
- [ ] Frontend components use `tier` from `useTier()` hook
- [ ] Don't query for `tier` column (it doesn't exist)
- [ ] Use service role client if RLS might block access
- [ ] Handle both paid and gifted Premium users

---

## Related Documentation

- Hook Implementation: `hooks/useTier.ts`
- Cancel API: `app/api/subscription/cancel/route.ts`
- Gift API: `app/api/subscription/gift/route.ts`
- Gifted Subscriptions: `docs/guides/GIFTED_SUBSCRIPTIONS.md`
