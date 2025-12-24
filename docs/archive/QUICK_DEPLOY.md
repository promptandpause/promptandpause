# ⚡ Quick Deployment Guide

## 🚀 Deploy in 5 Steps

### 1️⃣ Run SQL Migration (5 min)
```bash
# Open Supabase SQL Editor and paste FIX_MRR_CALCULATION.sql
```
✅ Fixes incorrect pricing ($9.99 → £12, $99.99 → £99)

---

### 2️⃣ Enable Realtime (2 min)
Supabase Dashboard → Database → Replication → Enable `profiles` table
✅ Enables instant dashboard updates

---

### 3️⃣ Deploy Code (10 min)
```bash
git add .
git commit -m "Fix subscription sync and pricing"
git push
vercel --prod
```
✅ Deploys all fixes to production

---

### 4️⃣ Test It Works (5 min)
1. Admin upgrades a user
2. User sees Premium badge instantly (no refresh)
3. Admin panel shows correct prices (£12/£99)

---

### 5️⃣ Monitor (Ongoing)
```sql
-- Check MRR is correct
SELECT * FROM calculate_mrr();

-- Watch subscription events
SELECT * FROM subscription_events ORDER BY created_at DESC LIMIT 10;
```

---

## ✅ What Got Fixed

| Issue | Before | After |
|-------|--------|-------|
| **Pricing** | $9.99/$99.99 | £12/£99 |
| **Dashboard Sync** | Manual refresh needed | Instant update |
| **Field Names** | Wrong fields | Correct schema |
| **Price Source** | Hardcoded | From Stripe API |

---

## 📁 Files to Deploy

### Modified:
- `app/api/admin/update-subscription/route.ts`
- `hooks/useTier.ts`
- `lib/services/adminService.ts`

### New:
- `lib/stripe/pricing.ts`
- `app/api/stripe/pricing/route.ts`
- `FIX_MRR_CALCULATION.sql`

---

## 🧪 Quick Test

```bash
# 1. Test pricing API
curl http://localhost:3000/api/stripe/pricing

# 2. Upgrade a user (admin panel)
# 3. Open user dashboard in incognito
# 4. See Premium badge appear automatically ⚡
```

---

## 🆘 If Something Breaks

1. Check Supabase Realtime is ON
2. Run SQL migration again
3. Verify env vars are set
4. Check browser console for errors

**Full details:** See `SUBSCRIPTION_FIX_SUMMARY.md`

---

**Status:** ✅ Ready to Deploy  
**Time to Deploy:** ~20 minutes  
**Risk Level:** Low (backward compatible)
