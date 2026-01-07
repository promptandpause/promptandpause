# Implementation Roadmap - Backend Integration

## ✅ Completed Tasks (3/16)

### 1. Environment Setup ✅
- Created `.env.example` with all required variables
- Updated `.gitignore` to exclude all environment files
- **Next Step:** Copy `.env.example` to `.env.local` and fill in your actual API keys

### 2. Install Required Dependencies ✅
- Installed: `@supabase/supabase-js`, `@supabase/ssr`, `@stripe/stripe-js`, `stripe`, `groq-sdk`, `openai`, `resend`
- All packages ready to use

### 3. Database & Type Definitions ✅
- Created `SUPABASE_SCHEMA.md` with complete database schema
- Updated `lib/types/reflection.ts` with all Supabase-compatible types
- **Next Step:** Run the SQL schema in your Supabase SQL Editor

---

## 🚧 In Progress (Current Files Created)

### Supabase Clients
- ✅ `lib/supabase/client.ts` - Browser/client-side operations
- ✅ `lib/supabase/server.ts` - Server-side operations & admin functions

### AI Service
- ✅ `lib/services/aiService.ts` - Groq + OpenAI prompt generation with fallback

---

## 📋 Remaining Tasks

### 4. Service Layer Refactor (HIGH PRIORITY)

**Files to Create:**

```
lib/services/
├── emailService.ts          # Resend email delivery
├── stripeService.ts         # Stripe payments & subscriptions
├── userService.ts           # User CRUD operations
├── reflectionService.ts     # Refactor to use Supabase (currently uses localStorage)
└── analyticsService.ts      # Weekly digest, streaks, stats
```

**Key Changes:**
- Replace all `localStorage` calls in `reflectionService.ts` with Supabase queries
- Add email templates and send functions
- Add Stripe checkout and webhook handlers
- Add user preference management

---

### 5. Authentication Integration (HIGH PRIORITY)

**Files to Update:**

```
app/(auth)/
├── login/page.tsx           # Connect to Supabase Auth
├── _components/login-form.tsx # Add Supabase sign-in logic
├── signup/page.tsx          # Connect to Supabase Auth
├── signup-form.tsx          # Add Supabase sign-up logic
├── forgot-password/page.tsx # Add password reset flow
├── verify/page.tsx          # Email verification
└── change-password/page.tsx # Password change
```

**New Files to Create:**

```
app/(auth)/
├── auth/callback/route.ts   # Auth callback handler (required for OAuth)
└── _components/*            # Shared auth UI
```

**Implementation:**
- Google OAuth integration
- Email/password authentication
- Session management
- Redirect logic after auth

---

### 6. User Onboarding Flow

**File to Update:**
- `app/onboarding/page.tsx`

**Changes:**
- Save answers to `user_preferences` table in Supabase
- Call API route to store preferences
- Redirect to dashboard after completion

**New API Route:**
- `app/api/onboarding/route.ts` - Save user preferences

---

### 7. Dashboard & Component Data Migration (CRITICAL)

**Components to Update (Remove localStorage, add Supabase):**

```
app/dashboard/
├── page.tsx                              # Main dashboard
├── components/
│   ├── todays-prompt.tsx                 # Fetch daily prompt from Supabase
│   ├── mood-tracker.tsx                  # Save/fetch moods to/from Supabase
│   ├── weekly-digest.tsx                 # Calculate from Supabase data
│   ├── quick-stats.tsx                   # Fetch user stats from Supabase
│   └── activity-calendar.tsx             # Fetch activity from Supabase
├── archive/page.tsx                      # Fetch reflections from Supabase
└── settings/page.tsx                     # Update to save to Supabase
```

**Key Changes:**
- Replace all `reflectionService` calls with API calls or direct Supabase queries
- Remove demo/static data (e.g., "John Doe", hardcoded prompts)
- Fetch user-specific data based on `auth.uid()`

---

### 8. API Routes Enhancement & Expansion

**Current API Routes (Need Refactoring):**
- `app/api/reflections/route.ts` - Remove mock data, query Supabase
- `app/api/settings/route.ts` - Remove mock data, query Supabase

**New API Routes to Create:**

```
app/api/
├── auth/
│   └── callback/route.ts                 # OAuth callback
├── reflections/
│   ├── route.ts                          # GET all, POST new
│   ├── [id]/route.ts                     # GET/PATCH/DELETE single reflection
│   └── feedback/route.ts                 # Update feedback
├── prompts/
│   ├── today/route.ts                    # Get today's prompt
│   └── generate/route.ts                 # Generate new prompt (admin/cron)
├── user/
│   ├── profile/route.ts                  # GET/PATCH profile
│   └── preferences/route.ts              # GET/PATCH preferences
├── subscription/
│   ├── create-checkout/route.ts          # Create Stripe checkout session
│   ├── portal/route.ts                   # Stripe customer portal
│   └── status/route.ts                   # Check subscription status
├── webhooks/
│   ├── stripe/route.ts                   # Stripe webhook handler
│   └── resend/route.ts                   # Resend webhook handler (optional)
├── cron/
│   └── daily-prompts/route.ts            # Triggered by GitHub Actions/Vercel Cron
└── analytics/
    ├── weekly-digest/route.ts            # Get weekly digest data
    └── stats/route.ts                    # Get user statistics
```

---

### 9. Middleware & Auth Guards

**File to Create:**
- `middleware.ts` (root level)

**Implementation:**
- Check authentication status
- Redirect unauthenticated users from `/dashboard/*` to `/auth/signin`
- Allow public access to `/`, `/auth/*`, `/homepage/*`

**Example:**

```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: CookieOptions) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // Protect dashboard routes
  if (request.nextUrl.pathname.startsWith('/dashboard') && !user) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  // Redirect authenticated users away from auth pages
  if (request.nextUrl.pathname.startsWith('/auth') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

### 10. Stripe Payments & Subscription Logic

**Implementation Steps:**

1. **Create Products & Prices in Stripe Dashboard:**
   - Monthly: £12/month
   - Annual: £120/year (save £24)

2. **Implement Checkout Flow:**
   - `POST /api/subscription/create-checkout` - Create session
   - Redirect to Stripe Checkout
   - Handle success/cancel redirects

3. **Webhook Handler:**
   - `POST /api/webhooks/stripe`
   - Listen for events:
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
   - Update `users` and `subscriptions` tables

4. **Update UI:**
   - Show subscription status in Settings
   - Enable/disable premium features based on `subscription_tier`
   - Add "Upgrade" button for freemium users

---

### 11. Email Delivery Implementation

**Email Templates to Create:**

```
lib/emails/
├── welcome.tsx              # React Email component for welcome
├── daily-prompt.tsx         # Daily prompt email
├── weekly-digest.tsx        # Weekly summary
└── subscription.tsx         # Subscription confirmations
```

**Email Service (`lib/services/emailService.ts`):**

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendDailyPrompt(email: string, prompt: string) {
  return resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to: email,
    subject: '✨ Your Daily Reflection Prompt',
    html: `<h2>${prompt}</h2>`,
  })
}
```

---

### 12. AI Prompt Generation Integration

**Implementation:**
- ✅ AI service already created
- Create API route: `POST /api/prompts/generate`
- Fetch user context (preferences, recent moods, tags)
- Call `aiService.generatePrompt(context)`
- Save to `prompts_history` table
- Return prompt to user

---

### 13. Scheduled Task & Cron Jobs

**Cron Job Setup:**

**Option 1: GitHub Actions (Free)**

Create `.github/workflows/daily-prompts.yml`:

```yaml
name: Daily Prompts

on:
  schedule:
    - cron: '0 7 * * *'  # 7am UTC (8am UK)
  workflow_dispatch:  # Manual trigger for testing

jobs:
  send-prompts:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Prompt Generation
        run: |
          curl -X POST https://your-domain.com/api/cron/daily-prompts \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Option 2: Vercel Cron (Free on Hobby plan)**

Add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-prompts",
      "schedule": "0 7 * * *"
    }
  ]
}
```

**Cron Endpoint (`app/api/cron/daily-prompts/route.ts`):**

1. Verify `CRON_SECRET` header
2. Fetch all active users needing prompts today
3. For each user:
   - Generate personalized prompt
   - Save to `prompts_history`
   - Send email via Resend
   - Log delivery to `email_delivery_log`

---

### 14. Error Handling & Loading States

**Add to all components:**
- Loading skeletons (use `@/components/ui/skeleton`)
- Error boundaries
- Toast notifications for errors
- Retry logic for failed API calls

**Example:**

```typescript
const { data, error, isLoading } = useSWR('/api/reflections', fetcher)

if (isLoading) return <Skeleton />
if (error) return <ErrorState retry={() => mutate()} />
return <DataView data={data} />
```

---

### 15. Testing & Validation

**Checklist:**

- [ ] Sign up with email
- [ ] Sign up with Google OAuth
- [ ] Complete onboarding flow
- [ ] View dashboard with real data
- [ ] Create reflection
- [ ] View archive
- [ ] Update settings
- [ ] Upgrade to Premium (Stripe test mode)
- [ ] Receive email prompt (test Resend)
- [ ] Test cron job manually
- [ ] Verify RLS policies (can't access other users' data)

---

### 16. Documentation

**Update Files:**
- `README.md` - Setup instructions, deployment guide
- `API_DOCS.md` - API endpoint documentation
- `CONTRIBUTING.md` - Development workflow

---

## 🚀 Quick Start After Setup

### 1. Set Up Supabase

```bash
# 1. Create Supabase project at supabase.com
# 2. Copy SQL from SUPABASE_SCHEMA.md
# 3. Run in Supabase SQL Editor
# 4. Enable Google OAuth in Authentication > Providers
# 5. Copy API keys to .env.local
```

### 2. Set Up Stripe

```bash
# 1. Create products & prices in Stripe Dashboard
# 2. Copy API keys to .env.local
# 3. Set up webhook endpoint: https://your-domain.com/api/webhooks/stripe
# 4. Copy webhook secret to .env.local
```

### 3. Set Up Resend

```bash
# 1. Verify your domain in Resend
# 2. Copy API key to .env.local
# 3. Set RESEND_FROM_EMAIL
```

### 4. Test Locally

```bash
npm run dev
# Open http://localhost:3000
# Sign up and test all features
```

---

## 📝 Priority Order

**Week 1:**
1. Supabase setup & schema
2. Authentication integration
3. Middleware & auth guards
4. Basic dashboard with real data

**Week 2:**
5. Reflection CRUD (create, read, update, delete)
6. User preferences & settings
7. AI prompt generation
8. Email delivery

**Week 3:**
9. Stripe subscription flow
10. Webhook handlers
11. Cron jobs
12. Testing & bug fixes

**Week 4:**
13. Polish UI/UX
14. Performance optimization
15. Documentation
16. Deploy to production

---

## 🛠️ Development Tips

1. **Test with Stripe test mode** - Use test card: `4242 4242 4242 4242`
2. **Use Supabase local dev** - `supabase start` for local database
3. **Enable Supabase Studio** - Visual database editor
4. **Monitor Resend dashboard** - Check email delivery logs
5. **Use Vercel Preview deployments** - Test before prod

---

## 🔗 Useful Links

- [Supabase Docs](https://supabase.com/docs)
- [Stripe API Reference](https://stripe.com/docs/api)
- [Resend Documentation](https://resend.com/docs)
- [Groq API Docs](https://console.groq.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)

---

## 🆘 Need Help?

If you encounter issues:
1. Check `.env.local` - All keys configured?
2. Check Supabase RLS policies - Users can access their data?
3. Check Stripe webhook logs - Events being received?
4. Check Resend logs - Emails sending?
5. Check browser console - Frontend errors?
6. Check Vercel logs - Backend errors?

---

**Current Status:** 3/16 tasks complete (~19%)
**Next Priority:** Service Layer Refactor (emailService, stripeService, userService)
