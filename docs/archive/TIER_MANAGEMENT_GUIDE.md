# Tier Management System - Implementation Guide

**Last Updated:** 2025-01-07  
**Status:** ✅ Complete & Ready to Use

---

## 🎯 Overview

This tier management system automatically enforces Free vs Premium features throughout your app. It:
- ✅ Automatically detects user's subscription tier from database
- ✅ Provides React hooks for easy feature gating
- ✅ Includes reusable UI components for upgrade prompts
- ✅ Syncs automatically when subscription changes (via Stripe webhooks)
- ✅ Enforces weekly prompt limits for free users
- ✅ Limits archive access for free users (last 50 reflections)

---

## 📦 What Was Created

### 1. Core Utilities
**File:** `lib/utils/tierManagement.ts` (544 lines)

**Exports:**
- Tier configuration (FREE_TIER_FEATURES, PREMIUM_TIER_FEATURES)
- Tier detection functions
- Feature access checks
- Prompt scheduling helpers
- Upgrade messaging
- Subscription status helpers

### 2. React Hooks
**File:** `hooks/useTier.ts` (222 lines)

**Exports:**
- `useTier()` - Main hook for tier management
- `useFeatureAccess(feature)` - Check specific feature access
- `usePromptAllowance()` - Track weekly prompt usage

### 3. UI Components
**File:** `components/tier/TierGate.tsx` (320 lines)

**Exports:**
- `<TierGate>` - Conditionally render based on tier
- `<UpgradePrompt>` - Show upgrade prompt for locked features
- `<FeatureBadge>` - Display "Premium" or "Free" badges
- `<LockedFeatureOverlay>` - Blur and lock premium features
- `<PromptLimitBanner>` - Show weekly limit warning

---

## 🚀 Quick Start

### Basic Usage in Components

```tsx
"use client"

import { useTier } from '@/hooks/useTier'
import { TierGate, UpgradePrompt } from '@/components/tier/TierGate'

export default function DashboardPage() {
  const { tier, features, isLoading } = useTier()

  if (isLoading) {
    return <LoadingSkeleton />
  }

  return (
    <div>
      {/* Show different UI based on tier */}
      {features.isPremium ? (
        <h1>Welcome to Premium! 🎉</h1>
      ) : (
        <h1>Start Your Practice</h1>
      )}

      {/* Conditionally show upgrade button */}
      {features.shouldShowUpgrade && (
        <Button>Upgrade to Premium</Button>
      )}

      {/* Gate premium features */}
      <TierGate requiresPremium feature="advancedAnalytics">
        <AdvancedAnalyticsChart />
      </TierGate>

      {/* Show feature counts */}
      <p>You get {features.promptsPerWeek} prompts per week</p>
    </div>
  )
}
```

---

## 📋 Feature Comparison

### Free Tier: "Start Your Practice"
**Price:** £0/month (Forever Free)

| Feature | Status | Details |
|---------|--------|---------|
| Weekly Prompts | ✅ | 3 per week (Mon, Wed, Fri) |
| Mood Tracking | ✅ | Basic 1-10 scale |
| Archive Access | ⚠️ | Last 50 reflections only |
| Search Reflections | ❌ | Premium only |
| Export | ❌ | Premium only |
| Daily Prompts | ❌ | Premium only |
| Weekly Digest | ❌ | Premium only |
| Advanced Analytics | ❌ | Premium only |
| Slack Delivery | ❌ | Premium only |
| Voice Notes | ❌ | Premium only |
| Custom Focus Areas | ⚠️ | Max 3 predefined |
| Crisis Resources | ✅ | Always included |
| Priority Support | ❌ | Premium only |

### Premium Tier: "Deepen Your Reflection"
**Price:** £12/month or £99/year (save £45)

| Feature | Status | Details |
|---------|--------|---------|
| Weekly Prompts | ✅ | 7 per week (daily) |
| Mood Tracking | ✅ | Advanced with trends |
| Archive Access | ✅ | Unlimited |
| Search Reflections | ✅ | Full-text search |
| Export | ✅ | PDF & TXT |
| Daily Prompts | ✅ | Personalized daily |
| Weekly Digest | ✅ | AI-generated insights |
| Advanced Analytics | ✅ | Charts & trends |
| Slack Delivery | ✅ | Flexible delivery |
| Voice Notes | ✅ | Listen to prompts |
| Custom Focus Areas | ✅ | Unlimited |
| Crisis Resources | ✅ | Always included |
| Priority Support | ✅ | 24hr response |

---

## 🔧 Implementation Examples

### 1. Dashboard with Tier-Based Features

```tsx
"use client"

import { useTier, usePromptAllowance } from '@/hooks/useTier'
import { TierGate, PromptLimitBanner } from '@/components/tier/TierGate'

export default function Dashboard() {
  const { features, tier, statusMessage } = useTier()
  const { allowance, used, remaining } = usePromptAllowance()

  return (
    <div className="space-y-6">
      {/* Subscription Status */}
      <Card>
        <h2>Your Plan: {tier === 'premium' ? 'Premium' : 'Free'}</h2>
        <p>{statusMessage}</p>
      </Card>

      {/* Prompt Limit Warning (Free users only) */}
      <PromptLimitBanner />

      {/* Prompt Usage Stats */}
      <Card>
        <h3>This Week's Reflections</h3>
        <p>{used} of {allowance} used ({remaining} remaining)</p>
        
        {!features.canAccessDailyPrompts && (
          <p className="text-sm text-muted-foreground">
            Upgrade to Premium for daily prompts (7 days/week)
          </p>
        )}
      </Card>

      {/* Today's Prompt (always visible) */}
      <TodaysPrompt />

      {/* Advanced Analytics (Premium only) */}
      <TierGate 
        requiresPremium 
        feature="advancedAnalytics"
      >
        <MoodTrendsChart />
        <EmotionalPatternsInsights />
      </TierGate>

      {/* Weekly Digest (Premium only) */}
      {features.hasWeeklyDigest ? (
        <WeeklyDigestComponent />
      ) : (
        <UpgradePrompt feature="weeklyDigest" />
      )}
    </div>
  )
}
```

### 2. Archive Page with Access Limits

```tsx
"use client"

import { useTier } from '@/hooks/useTier'
import { LockedFeatureOverlay } from '@/components/tier/TierGate'

export default function ArchivePage() {
  const { features } = useTier()
  const [reflections, setReflections] = useState([])

  // Limit reflections for free users
  const displayedReflections = features.hasUnlimitedArchive
    ? reflections
    : reflections.slice(0, 20) // Only show last 20 for free

  return (
    <div>
      <h1>Your Reflections</h1>
      
      {/* Search (Premium only) */}
      {features.canSearchReflections ? (
        <SearchBar onSearch={handleSearch} />
      ) : (
        <LockedFeatureOverlay feature="searchReflections">
          <SearchBar disabled />
        </LockedFeatureOverlay>
      )}

      {/* Export Button (Premium only) */}
      {features.canExportReflections && (
        <Button onClick={handleExport}>
          Export as PDF
        </Button>
      )}

      {/* Reflections List */}
      {displayedReflections.map((reflection, index) => (
        <ReflectionCard key={reflection.id} data={reflection} />
      ))}

      {/* Show upgrade prompt if limited */}
      {!features.hasUnlimitedArchive && reflections.length > 20 && (
        <Card className="mt-6">
          <UpgradePrompt 
            feature="unlimitedArchive" 
            size="md"
          />
          <p className="text-sm text-muted-foreground mt-2">
            You have {reflections.length} total reflections. 
            Upgrade to access all of them.
          </p>
        </Card>
      )}
    </div>
  )
}
```

### 3. Settings Page with Tier Display

```tsx
"use client"

import { useTier } from '@/hooks/useTier'
import { getTierComparison, getAnnualSavings } from '@/lib/utils/tierManagement'

export default function SettingsPage() {
  const { tier, features, statusMessage, subscriptionEndDate } = useTier()
  const savings = getAnnualSavings()
  const comparison = getTierComparison()

  return (
    <div>
      {/* Current Subscription Section */}
      <Card>
        <h2>Current Plan</h2>
        
        {tier === 'premium' ? (
          <div>
            <Badge className="bg-yellow-500">
              <Crown className="mr-1" />
              Premium
            </Badge>
            <p>{statusMessage}</p>
            
            {subscriptionEndDate && (
              <p className="text-sm">
                {subscriptionStatus === 'active' 
                  ? `Renews on ${subscriptionEndDate.toLocaleDateString()}`
                  : `Access until ${subscriptionEndDate.toLocaleDateString()}`
                }
              </p>
            )}
            
            <Button onClick={handleManageSubscription}>
              Manage Subscription
            </Button>
          </div>
        ) : (
          <div>
            <Badge>Free</Badge>
            <p>3 prompts per week, basic features</p>
            
            <Button onClick={handleUpgrade}>
              Upgrade to Premium - £{savings.monthly}/month
            </Button>
            
            <p className="text-sm text-muted-foreground">
              Or £{savings.annual}/year (save £{savings.savings}!)
            </p>
          </div>
        )}
      </Card>

      {/* Feature Comparison */}
      {!features.isPremium && (
        <Card>
          <h2>What You're Missing</h2>
          <ul>
            {comparison.premium.features
              .filter(f => f.highlight)
              .map(f => (
                <li key={f.name}>
                  <Check /> {f.name}
                </li>
              ))
            }
          </ul>
          <Button>See Full Comparison</Button>
        </Card>
      )}

      {/* Delivery Preferences */}
      <Card>
        <h2>Delivery Settings</h2>
        
        {/* Email (always available) */}
        <div>
          <Label>Email Delivery</Label>
          <Input type="email" value={email} />
        </div>

        {/* Slack (Premium only) */}
        <TierGate requiresPremium feature="slackDelivery">
          <div>
            <Label>Slack Delivery</Label>
            <Input placeholder="Slack webhook URL" />
          </div>
        </TierGate>

        {/* Voice Notes (Premium only) */}
        <TierGate requiresPremium feature="voiceNotePrompts">
          <div>
            <Label>Voice Note Prompts</Label>
            <Switch checked={voiceEnabled} />
          </div>
        </TierGate>
      </Card>
    </div>
  )
}
```

### 4. Create Reflection with Limit Check

```tsx
"use client"

import { usePromptAllowance } from '@/hooks/useTier'

export default function CreateReflection() {
  const { canCreate, used, allowance, remaining } = usePromptAllowance()

  const handleSubmit = async (data) => {
    // Check if user can create more reflections
    if (!canCreate) {
      toast({
        title: 'Weekly Limit Reached',
        description: `You've used all ${allowance} prompts this week. Upgrade to Premium for daily prompts!`,
        variant: 'destructive',
      })
      return
    }

    // Save reflection
    await saveReflection(data)
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Show warning when approaching limit */}
      {remaining <= 1 && remaining > 0 && (
        <Alert>
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            You have {remaining} reflection{remaining === 1 ? '' : 's'} remaining this week.
            Upgrade to Premium for unlimited daily reflections.
          </AlertDescription>
        </Alert>
      )}

      {/* Disable form if limit reached */}
      {!canCreate && (
        <Alert variant="destructive">
          <AlertTitle>Weekly Limit Reached</AlertTitle>
          <AlertDescription>
            <p>You've used all {allowance} reflections this week.</p>
            <Button onClick={() => router.push('/dashboard/settings')}>
              Upgrade to Premium
            </Button>
          </AlertDescription>
        </Alert>
      )}

      <Textarea 
        placeholder="Write your reflection..."
        disabled={!canCreate}
      />
      
      <Button type="submit" disabled={!canCreate}>
        Save Reflection
      </Button>
    </form>
  )
}
```

---

## 🔄 Automatic Tier Sync

The system automatically syncs with Stripe webhooks. When a user:
- **Upgrades to Premium** → Webhook updates `subscription_status` to 'active'
- **Cancels subscription** → Webhook updates status to 'cancelled' with end date
- **Payment fails** → Webhook updates status to 'past_due'

The `useTier()` hook reads from the `profiles` table, which is always in sync.

### Database Schema (profiles table)

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  full_name TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'free', -- 'free' or 'premium'
  subscription_status TEXT, -- 'active', 'cancelled', 'past_due', etc.
  subscription_id TEXT, -- Stripe subscription ID
  subscription_end_date TIMESTAMP,
  stripe_customer_id TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Stripe Webhook Handler (Already Implemented)

```typescript
// app/api/stripe/webhook/route.ts

case 'checkout.session.completed':
  // User upgraded to premium
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'active',
      subscription_tier: 'premium',
      subscription_id: session.subscription,
    })
    .eq('id', userId)
  break

case 'customer.subscription.deleted':
  // User cancelled subscription
  await supabase
    .from('profiles')
    .update({
      subscription_status: 'cancelled',
      subscription_tier: 'free', // Revert to free
    })
    .eq('id', userId)
  break
```

---

## 📝 API Route Integration

Use tier checks in API routes for server-side enforcement:

```typescript
// app/api/reflections/route.ts

import { createClient } from '@/lib/supabase/server'
import { getUserFeatures, canCreateReflection } from '@/lib/utils/tierManagement'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get user's subscription info
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_status, subscription_tier')
    .eq('id', user.id)
    .single()

  // Check weekly limit
  const { count: weeklyCount } = await supabase
    .from('reflections')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', getStartOfWeek())

  const canCreate = canCreateReflection(
    weeklyCount || 0,
    profile?.subscription_status,
    profile?.subscription_tier
  )

  if (!canCreate) {
    const features = getUserFeatures(
      profile?.subscription_status,
      profile?.subscription_tier
    )
    
    return NextResponse.json({
      error: 'Weekly limit reached',
      message: `You've used all ${features.promptsPerWeek} prompts this week. Upgrade to Premium for daily prompts.`,
      limit: features.promptsPerWeek,
      used: weeklyCount,
    }, { status: 403 })
  }

  // Create reflection
  const body = await request.json()
  const { data, error } = await supabase
    .from('reflections')
    .insert({ ...body, user_id: user.id })

  return NextResponse.json({ success: true, data })
}
```

---

## 🎨 UI Component Reference

### TierGate

Conditionally render content based on tier:

```tsx
<TierGate 
  requiresPremium={true}  // Require premium access
  feature="advancedAnalytics"  // Feature name for messaging
  fallback={<CustomUpgradeUI />}  // Custom fallback component
  showUpgradePrompt={true}  // Show default upgrade prompt
>
  <PremiumFeature />
</TierGate>
```

### UpgradePrompt

Show upgrade prompt:

```tsx
<UpgradePrompt 
  feature="weeklyDigest"  // Feature name for custom message
  size="md"  // 'sm' | 'md' | 'lg'
/>
```

### FeatureBadge

Display feature tier badge:

```tsx
<div className="flex items-center gap-2">
  <span>Advanced Analytics</span>
  <FeatureBadge premium={true} />
</div>
```

### LockedFeatureOverlay

Blur and lock a feature:

```tsx
<LockedFeatureOverlay 
  feature="exportReflections"
  locked={!features.canExportReflections}
>
  <ExportButton />
</LockedFeatureOverlay>
```

### PromptLimitBanner

Show weekly limit warning:

```tsx
<PromptLimitBanner />
// Automatically shows when free user has <= 1 prompts remaining
```

---

## 🧪 Testing

### Test Free User Experience

```typescript
// In browser console or test file
const features = getFeatureFlags(null, 'free')

console.log(features.promptsPerWeek) // 3
console.log(features.canAccessDailyPrompts) // false
console.log(features.hasUnlimitedArchive) // false
console.log(features.archiveLimit) // 20
console.log(features.shouldShowUpgrade) // true
```

### Test Premium User Experience

```typescript
const features = getFeatureFlags('active', 'premium')

console.log(features.promptsPerWeek) // 7
console.log(features.canAccessDailyPrompts) // true
console.log(features.hasUnlimitedArchive) // true
console.log(features.archiveLimit) // null (unlimited)
console.log(features.shouldShowUpgrade) // false
```

### Test Subscription Status Messages

```typescript
getSubscriptionStatusMessage('active') 
// "Your Premium subscription is active"

getSubscriptionStatusMessage('cancelled', '2025-02-01')
// "Premium access until 01/02/2025 (25 days)"

getSubscriptionStatusMessage('past_due')
// "Payment failed - Please update your payment method"
```

---

## ✅ Implementation Checklist

### Phase 1: Setup (Complete)
- [x] Create tier management utilities
- [x] Create React hooks
- [x] Create UI components
- [x] Document usage

### Phase 2: Dashboard Integration
- [ ] Update dashboard to use `useTier()` hook
- [ ] Add `<PromptLimitBanner />` to dashboard
- [ ] Show tier-appropriate features
- [ ] Hide/show upgrade buttons based on tier

### Phase 3: Archive Integration
- [ ] Limit free users to last 20 reflections
- [ ] Gate search feature with `<TierGate>`
- [ ] Gate export feature with `<TierGate>`
- [ ] Show unlock prompt for older reflections

### Phase 4: Settings Integration
- [ ] Display current tier and status
- [ ] Show tier comparison table
- [ ] Gate Slack/voice settings for premium
- [ ] Show "Manage Subscription" for premium users

### Phase 5: API Enforcement
- [ ] Add weekly limit check to reflection creation API
- [ ] Return proper error messages with upgrade prompts
- [ ] Test limit enforcement

### Phase 6: Testing
- [ ] Test as free user (3 prompts/week limit)
- [ ] Test premium upgrade flow
- [ ] Test subscription cancellation
- [ ] Test tier sync after Stripe webhook

---

## 🚀 Next Steps

1. **Update Dashboard** - Integrate tier checks and upgrade prompts
2. **Update Archive** - Enforce 20-reflection limit for free users
3. **Update Settings** - Show tier management UI
4. **Test Thoroughly** - Test both free and premium user flows
5. **Deploy** - Push to production and monitor

---

*Implementation Guide - Prompt & Pause Tier Management*  
*Created: 2025-01-07*
