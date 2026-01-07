# 🔧 Technical Documentation - Prompt & Pause

**Complete Developer Reference**  
**Last Updated**: December 24, 2025  
**Version**: 1.0

---

## 📚 Table of Contents

1. [Tech Stack Overview](#tech-stack-overview)
2. [Architecture](#architecture)
3. [API Routes Reference](#api-routes-reference)
4. [Middleware & Authentication](#middleware--authentication)
5. [Database Schema](#database-schema)
6. [Cron Jobs](#cron-jobs)
7. [Services & Utilities](#services--utilities)
8. [Environment Variables](#environment-variables)
9. [Deployment](#deployment)
10. [Development Workflow](#development-workflow)

---

## 🏗️ Tech Stack Overview

### Frontend
```typescript
Framework: Next.js 15 (App Router)
Language: TypeScript 5.x
UI Library: React 18
Styling: Tailwind CSS 3.x
Components: shadcn/ui
Animations: Framer Motion
Icons: Lucide React
Charts: Recharts
Forms: React Hook Form
State: React Context API
```

### Backend
```typescript
Runtime: Node.js 20+
API: Next.js API Routes (App Router)
Database: PostgreSQL (via Supabase)
ORM: Supabase Client
Authentication: Supabase Auth
Storage: Supabase Storage
RLS: Row Level Security (enabled)
```

### AI & Integrations
```typescript
AI Providers:
  - OpenAI GPT-4/3.5
  - Google Gemini Pro
  - OpenRouter (fallback)
  - Hugging Face (fallback)

Email: Resend
Webhooks: Slack
Analytics: Vercel Analytics
Payments: Stripe (configured, not active)
```

### DevOps
```typescript
Hosting: Vercel
Cron: Vercel Cron
CI/CD: Vercel Git Integration
Monitoring: Vercel Analytics + Logs
Environment: Production, Preview, Development
```

---

## 🏛️ Architecture

### Project Structure
```
PandP/
├── app/                          # Next.js App Router
│   ├── (auth)/                  # Auth group routes
│   │   ├── auth/                # Auth pages
│   │   │   ├── login/
│   │   │   ├── signup/
│   │   │   ├── verify/
│   │   │   └── reset-password/
│   ├── admin-panel/             # Admin dashboard
│   │   ├── login/
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── support/
│   │   └── settings/
│   ├── dashboard/               # Main app
│   │   ├── page.tsx            # Dashboard home
│   │   ├── archive/            # Reflection archive
│   │   ├── analytics/          # Analytics (premium)
│   │   ├── settings/           # User settings
│   │   └── components/         # Dashboard components
│   ├── homepage/                # Landing pages
│   │   ├── page.tsx            # Homepage
│   │   ├── about/
│   │   ├── features/
│   │   └── pricing/
│   ├── api/                     # API Routes
│   │   ├── admin/              # Admin APIs
│   │   ├── analytics/          # Analytics APIs
│   │   ├── cron/               # Cron job endpoints
│   │   ├── emails/             # Email APIs
│   │   ├── integrations/       # Integration APIs
│   │   ├── onboarding/         # Onboarding API
│   │   ├── premium/            # Premium feature APIs
│   │   ├── prompts/            # Prompt generation
│   │   ├── reflections/        # Reflection CRUD
│   │   ├── settings/           # Settings APIs
│   │   ├── subscription/       # Subscription management
│   │   ├── support/            # Support tickets
│   │   ├── user/               # User management
│   │   └── webhooks/           # Webhook handlers
│   ├── layout.tsx              # Root layout
│   └── globals.css             # Global styles
├── components/                  # Shared components
│   ├── ui/                     # shadcn/ui components
│   ├── subscription/           # Subscription components
│   └── ...
├── lib/                        # Libraries & utilities
│   ├── supabase/              # Supabase clients
│   ├── services/              # Business logic services
│   ├── utils/                 # Utility functions
│   ├── types/                 # TypeScript types
│   └── context/               # React contexts
├── hooks/                      # Custom React hooks
├── contexts/                   # Global contexts
├── database/                   # SQL migrations
├── proxy.ts                    # Middleware
└── vercel.json                # Vercel config
```

### Data Flow
```
User Request
    ↓
Middleware (proxy.ts)
    ↓
    ├─→ Auth Check (Supabase)
    ├─→ Email Verification Check
    ├─→ Onboarding Check
    ├─→ Admin Access Check
    ├─→ Maintenance Mode Check
    ↓
Next.js Route Handler
    ↓
API Route (if applicable)
    ↓
Service Layer
    ↓
Supabase Database (with RLS)
    ↓
Response to Client
```

---

## 🛣️ API Routes Reference

### Authentication Routes
*Handled by Supabase Auth - no custom routes needed*

**Endpoints:**
- `POST /auth/v1/signup` - User registration
- `POST /auth/v1/token?grant_type=password` - Login
- `POST /auth/v1/verify` - Email verification
- `POST /auth/v1/recover` - Password reset
- `GET /auth/v1/callback` - OAuth callback

### User Management

#### `GET /api/user/profile`
**Description**: Get current user's profile  
**Auth**: Required  
**Response**:
```typescript
{
  id: string
  email: string
  full_name: string
  subscription_tier: 'free' | 'premium'
  subscription_status: 'active' | 'inactive'
  is_trial: boolean
  trial_end_date: string | null
  created_at: string
}
```

#### `PATCH /api/user/profile`
**Description**: Update user profile  
**Auth**: Required  
**Body**:
```typescript
{
  full_name?: string
  avatar_url?: string
}
```

#### `GET /api/user/stats`
**Description**: Get user statistics  
**Auth**: Required  
**Response**:
```typescript
{
  total_reflections: number
  current_streak: number
  total_words: number
  achievements_unlocked: number
}
```

#### `DELETE /api/user/account`
**Description**: Delete user account  
**Auth**: Required  
**Response**: `{ success: boolean }`

### Onboarding

#### `POST /api/onboarding`
**Description**: Complete user onboarding and activate trial  
**Auth**: Required  
**Body**:
```typescript
{
  full_name: string
  reason: string
  focus_areas: string[]
  daily_reminders: boolean
  reminder_time?: string
  timezone?: string
}
```
**Response**:
```typescript
{
  success: boolean
  message: string
  data: {
    profile: Profile
    preferences: UserPreferences
  }
}
```

### Prompts

#### `GET /api/prompts/today`
**Description**: Get today's prompt (generates if needed)  
**Auth**: Required  
**Query Params**: None  
**Response**:
```typescript
{
  success: boolean
  prompt: string
  focus_area: string | null
  provider: string
  model: string
}
```

#### `POST /api/prompts/generate`
**Description**: Generate a new prompt (admin/testing)  
**Auth**: Required  
**Body**:
```typescript
{
  focus_area?: string
  force?: boolean
}
```

#### `GET /api/prompts/history`
**Description**: Get prompt generation history  
**Auth**: Required  
**Query**: `?limit=10&offset=0`

### Reflections

#### `GET /api/reflections`
**Description**: Get all reflections for user  
**Auth**: Required  
**Query Params**:
- `startDate` (optional): ISO date string
- `endDate` (optional): ISO date string
**Response**:
```typescript
{
  success: boolean
  data: Reflection[]
  count: number
}
```

#### `POST /api/reflections`
**Description**: Create new reflection  
**Auth**: Required  
**Body**:
```typescript
{
  prompt_text: string
  reflection_text: string
  mood: MoodType
  tags: string[]
  word_count?: number
}
```
**Response**:
```typescript
{
  success: boolean
  message: string
  data: Reflection
}
```

#### `GET /api/reflections/[id]`
**Description**: Get single reflection  
**Auth**: Required  
**Response**: `{ success: boolean, data: Reflection }`

#### `PATCH /api/reflections/[id]`
**Description**: Update reflection  
**Auth**: Required  
**Body**:
```typescript
{
  reflection_text?: string
  mood?: MoodType
  tags?: string[]
}
```

#### `DELETE /api/reflections/[id]`
**Description**: Delete reflection  
**Auth**: Required  
**Response**: `{ success: boolean }`

#### `GET /api/reflections/stats`
**Description**: Get reflection statistics  
**Auth**: Required  
**Response**:
```typescript
{
  total: number
  thisWeek: number
  thisMonth: number
  averageWordCount: number
  longestStreak: number
  currentStreak: number
}
```

### Premium Features

#### `GET /api/premium/mood-analytics`
**Description**: Get mood analytics with charts  
**Auth**: Required (Premium only)  
**Query**: `?days=30`  
**Response**:
```typescript
{
  success: boolean
  data: {
    overall: { mood: string, count: number, percentage: number }[]
    daily: { date: string, mood: string, score: number }[]
    mostCommon: string | null
    trend: 'improving' | 'declining' | 'stable'
    weeklyAverage: number
    monthlyAverage: number
  }
}
```

#### `GET /api/premium/weekly-insights`
**Description**: Get AI-generated weekly insights  
**Auth**: Required (Premium only)  
**Response**:
```typescript
{
  success: boolean
  data: {
    weekStart: string
    weekEnd: string
    totalReflections: number
    currentStreak: number
    averageWordCount: number
    topTags: { tag: string, count: number }[]
    moodDistribution: { mood: string, count: number }[]
    insights: {
      summary: string
      keyInsights: string[]
      recommendations: string[]
    }
  }
}
```

#### `GET /api/premium/export`
**Description**: Export reflections (PDF/CSV)  
**Auth**: Required (Premium only)  
**Query**: `?format=pdf&startDate=...&endDate=...`

#### `GET /api/premium/achievements`
**Description**: Get user achievements  
**Auth**: Required (Premium only)  
**Response**:
```typescript
{
  success: boolean
  data: {
    unlocked: Achievement[]
    locked: Achievement[]
    progress: { [key: string]: number }
  }
}
```

### Settings

#### `GET /api/settings`
**Description**: Get user settings  
**Auth**: Required  
**Response**:
```typescript
{
  success: boolean
  data: {
    preferences: UserPreferences
    profile: Profile
  }
}
```

#### `PATCH /api/settings`
**Description**: Update user settings  
**Auth**: Required  
**Body**:
```typescript
{
  daily_reminders?: boolean
  reminder_time?: string
  timezone?: string
  weekly_digest?: boolean
  push_notifications?: boolean
  delivery_method?: 'email' | 'slack' | 'both'
  theme?: 'light' | 'dark' | 'system'
  language?: 'en' | 'es' | 'fr'
}
```

### Subscription

#### `GET /api/subscription/status`
**Description**: Get subscription status  
**Auth**: Required  
**Response**:
```typescript
{
  tier: 'free' | 'premium'
  status: 'active' | 'inactive'
  isTrial: boolean
  trialEndDate: string | null
  trialDaysRemaining: number | null
}
```

#### `POST /api/subscription/upgrade`
**Description**: Upgrade to premium  
**Auth**: Required  
**Body**: `{ plan: 'monthly' | 'yearly' }`

#### `POST /api/subscription/cancel`
**Description**: Cancel subscription  
**Auth**: Required  
**Response**: `{ success: boolean }`

#### `GET /api/subscription/portal`
**Description**: Get Stripe customer portal URL  
**Auth**: Required  
**Response**: `{ url: string }`

### Integrations

#### `POST /api/integrations/slack/connect`
**Description**: Connect Slack workspace  
**Auth**: Required  
**Body**: `{ webhook_url: string }`

#### `DELETE /api/integrations/slack/disconnect`
**Description**: Disconnect Slack  
**Auth**: Required

#### `POST /api/integrations/slack/test`
**Description**: Test Slack connection  
**Auth**: Required

#### `GET /api/integrations/status`
**Description**: Get all integration statuses  
**Auth**: Required  
**Response**:
```typescript
{
  slack: { connected: boolean, webhook_url?: string }
}
```

### Analytics

#### `GET /api/analytics/dashboard`
**Description**: Get dashboard analytics  
**Auth**: Required  
**Response**:
```typescript
{
  reflections: {
    total: number
    thisWeek: number
    thisMonth: number
  }
  streaks: {
    current: number
    longest: number
  }
  moods: {
    distribution: { mood: string, count: number }[]
    trend: 'improving' | 'declining' | 'stable'
  }
}
```

### Support

#### `POST /api/support/ticket`
**Description**: Create support ticket  
**Auth**: Required  
**Body**:
```typescript
{
  subject: string
  message: string
  priority: 'low' | 'medium' | 'high'
  category: string
}
```

#### `GET /api/support/tickets`
**Description**: Get user's support tickets  
**Auth**: Required

### Admin Routes

#### `POST /api/admin/verify-access`
**Description**: Verify admin credentials  
**Body**: `{ email: string, password: string }`  
**Response**: `{ success: boolean, role: string }`

#### `GET /api/admin/dashboard/stats`
**Description**: Get admin dashboard statistics  
**Auth**: Admin required  
**Response**:
```typescript
{
  users: {
    total: number
    active: number
    newThisWeek: number
    premiumCount: number
  }
  reflections: {
    total: number
    thisWeek: number
    averagePerUser: number
  }
  revenue: {
    mrr: number
    arr: number
  }
}
```

#### `GET /api/admin/users`
**Description**: Get all users (paginated)  
**Auth**: Admin required  
**Query**: `?page=1&limit=50&search=...`

#### `GET /api/admin/users/[id]`
**Description**: Get user details  
**Auth**: Admin required

#### `PATCH /api/admin/users/[id]`
**Description**: Update user (subscription, status, etc.)  
**Auth**: Admin required

#### `DELETE /api/admin/users/[id]`
**Description**: Delete user account  
**Auth**: Admin required

#### `GET /api/admin/support/tickets`
**Description**: Get all support tickets  
**Auth**: Admin required

#### `PATCH /api/admin/support/[id]`
**Description**: Update ticket status  
**Auth**: Admin required  
**Body**: `{ status: 'open' | 'in_progress' | 'resolved' | 'closed' }`

#### `GET /api/admin/maintenance/status`
**Description**: Get maintenance mode status  
**Auth**: Admin required

#### `POST /api/admin/maintenance/enable`
**Description**: Enable maintenance mode  
**Auth**: Super Admin required  
**Body**: `{ message: string, estimated_duration?: string }`

#### `POST /api/admin/maintenance/disable`
**Description**: Disable maintenance mode  
**Auth**: Super Admin required

#### `GET /api/admin/email-templates`
**Description**: Get all email templates  
**Auth**: Admin required

#### `PATCH /api/admin/email-templates/[id]`
**Description**: Update email template  
**Auth**: Admin required

#### `GET /api/admin/cron-jobs`
**Description**: Get cron job status and history  
**Auth**: Admin required

#### `GET /api/admin/analytics/engagement`
**Description**: Get user engagement analytics  
**Auth**: Admin required

### Cron Job Endpoints

#### `GET /api/cron/send-daily-prompts`
**Description**: Send daily prompts to users  
**Auth**: Cron secret required  
**Schedule**: Every hour (`0 * * * *`)  
**Process**:
1. Get all users with daily reminders enabled
2. Filter by timezone (current hour)
3. Check if prompt already sent today
4. Generate/fetch today's prompt
5. Send via email and/or Slack
6. Log delivery

#### `GET /api/cron/regenerate-weekly-insights`
**Description**: Generate weekly insights for premium users  
**Auth**: Cron secret required  
**Schedule**: Mon/Fri at 6 AM UTC (`0 6 * * 1,5`)  
**Process**:
1. Get all premium users
2. Fetch last 7 days of reflections
3. Generate AI insights
4. Cache in database
5. Send weekly digest email

#### `GET /api/cron/check-trial-expiry`
**Description**: Check trials expiring soon and send warnings  
**Auth**: Cron secret required  
**Schedule**: Daily at 9 AM UTC (`0 9 * * *`)  
**Process**:
1. Find trials expiring in 3 days → send warning
2. Find trials expiring in 1 day → send final warning
3. Log notifications sent

#### `GET /api/cron/expire-trials`
**Description**: Expire trials that have ended  
**Auth**: Cron secret required  
**Schedule**: Daily at midnight UTC (`0 0 * * *`)  
**Process**:
1. Find trials with `trial_end_date < NOW()`
2. Set `is_trial = false`
3. Downgrade to free tier
4. Send trial expired email
5. Log expirations

#### `GET /api/cron/send-welcome-emails`
**Description**: Process email queue for welcome emails  
**Auth**: Cron secret required  
**Schedule**: Every 5 minutes (`*/5 * * * *`)  
**Process**:
1. Get pending emails from queue
2. Send via Resend
3. Mark as sent or failed
4. Retry failed emails (max 3 attempts)
5. Log results

### Webhook Endpoints

#### `POST /api/webhooks/stripe`
**Description**: Handle Stripe webhook events  
**Auth**: Stripe signature verification  
**Events**:
- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_succeeded`
- `invoice.payment_failed`

#### `POST /api/webhooks/slack`
**Description**: Handle Slack webhook events  
**Auth**: Slack signature verification

### Health Check

#### `GET /api/health`
**Description**: Health check endpoint  
**Auth**: None  
**Response**:
```typescript
{
  status: 'ok',
  timestamp: string,
  database: 'connected' | 'error',
  version: string
}
```

---

## 🔐 Middleware & Authentication

### Middleware (`proxy.ts`)

**Location**: `/proxy.ts`  
**Runs on**: All requests except static assets

**Flow**:
```typescript
1. Check if admin login page → bypass all checks
2. Check if static asset → bypass
3. Check if maintenance page → allow
4. Create Supabase client
5. Get user session
6. Check maintenance mode (redirect non-admins)
7. Check if authenticated
   ├─ No → redirect to /login
   └─ Yes → continue
8. Check email verification (email/password users only)
   ├─ Not verified → redirect to /verify
   └─ Verified → continue
9. Check onboarding completion
   ├─ Not completed → redirect to /onboarding
   └─ Completed → continue
10. Check admin routes
    ├─ Admin route + not admin → 403
    └─ Admin route + is admin → continue
11. Allow request
```

**Bypassed Routes**:
- `/_next/*` - Next.js internals
- `/static/*` - Static assets
- `/api/auth/*` - Auth endpoints
- `/api/admin/verify-access` - Admin login
- `/maintenance` - Maintenance page
- `/admin-panel/login` - Admin login page
- Static files (images, fonts, etc.)

**Protected Routes**:
- `/dashboard/*` - Requires auth + onboarding
- `/admin-panel/*` - Requires admin role
- All API routes (except auth)

### Authentication Flow

**Email/Password Signup**:
```
1. User submits signup form
2. Supabase creates auth user
3. Sends verification email
4. User clicks verification link
5. Email verified → redirect to onboarding
6. Complete onboarding → activate trial
7. Redirect to dashboard
```

**Google OAuth**:
```
1. User clicks "Sign in with Google"
2. Redirected to Google consent screen
3. Google redirects back with token
4. Supabase creates/updates user
5. Email auto-verified (OAuth)
6. Check if onboarding completed
   ├─ No → redirect to onboarding
   └─ Yes → redirect to dashboard
```

**Admin Login**:
```
1. Navigate to /admin-panel/login
2. Submit credentials
3. POST /api/admin/verify-access
4. Verify against admin_users table (bcrypt)
5. Set admin session cookie
6. Redirect to admin dashboard
```

### Row Level Security (RLS)

**Enabled on all tables**

**Example Policy** (`reflections` table):
```sql
-- Users can only read their own reflections
CREATE POLICY "Users can read own reflections"
ON reflections FOR SELECT
USING (auth.uid() = user_id);

-- Users can only insert their own reflections
CREATE POLICY "Users can insert own reflections"
ON reflections FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reflections
CREATE POLICY "Users can update own reflections"
ON reflections FOR UPDATE
USING (auth.uid() = user_id);

-- Users can only delete their own reflections
CREATE POLICY "Users can delete own reflections"
ON reflections FOR DELETE
USING (auth.uid() = user_id);
```

**Service Role Bypass**:
- Cron jobs use service role key
- Admin operations use service role key
- Bypasses RLS for system operations

---

## 🗄️ Database Schema

### Core Tables

#### `profiles`
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  subscription_tier TEXT DEFAULT 'free',
  subscription_status TEXT DEFAULT 'inactive',
  is_trial BOOLEAN DEFAULT false,
  trial_start_date TIMESTAMPTZ,
  trial_end_date TIMESTAMPTZ,
  stripe_customer_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_preferences`
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  onboarding_completed BOOLEAN DEFAULT false,
  user_reason TEXT,
  focus_areas TEXT[],
  daily_reminders BOOLEAN DEFAULT true,
  reminder_time TIME DEFAULT '09:00:00',
  timezone TEXT DEFAULT 'UTC',
  weekly_digest BOOLEAN DEFAULT true,
  push_notifications BOOLEAN DEFAULT false,
  delivery_method TEXT DEFAULT 'email',
  theme TEXT DEFAULT 'system',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `reflections`
```sql
CREATE TABLE reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  reflection_text TEXT NOT NULL, -- Encrypted if ENCRYPTION_KEY set
  mood TEXT NOT NULL,
  tags TEXT[],
  word_count INTEGER,
  date DATE DEFAULT CURRENT_DATE,
  feedback TEXT, -- 'helped' | 'irrelevant'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `prompts_history`
```sql
CREATE TABLE prompts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  prompt_text TEXT NOT NULL,
  focus_area TEXT,
  provider TEXT, -- 'openai' | 'gemini' | 'openrouter'
  model TEXT,
  date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `moods`
```sql
CREATE TABLE moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  mood TEXT NOT NULL,
  reflection_id UUID REFERENCES reflections(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);
```

#### `achievements`
```sql
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT, -- 'streak' | 'reflection_count' | 'special'
  requirement INTEGER,
  icon TEXT,
  rarity TEXT, -- 'common' | 'rare' | 'epic' | 'legendary'
  unlock_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `user_achievements`
```sql
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);
```

#### `weekly_insights_cache`
```sql
CREATE TABLE weekly_insights_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  insights JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);
```

### Email System Tables

#### `email_queue`
```sql
CREATE TABLE email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  email_type TEXT NOT NULL, -- 'welcome' | 'trial_warning' | etc.
  status TEXT DEFAULT 'pending', -- 'pending' | 'sent' | 'failed'
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);
```

#### `email_logs`
```sql
CREATE TABLE email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  email TEXT NOT NULL,
  template TEXT NOT NULL,
  status TEXT, -- 'sent' | 'failed'
  provider TEXT DEFAULT 'resend',
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `email_templates`
```sql
CREATE TABLE email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB, -- Available template variables
  is_active BOOLEAN DEFAULT true,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Admin Tables

#### `admin_users`
```sql
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt hashed
  role TEXT DEFAULT 'admin', -- 'admin' | 'super_admin'
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `support_tickets`
```sql
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'open', -- 'open' | 'in_progress' | 'resolved' | 'closed'
  priority TEXT DEFAULT 'medium', -- 'low' | 'medium' | 'high'
  category TEXT,
  assigned_to UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `maintenance_mode`
```sql
CREATE TABLE maintenance_mode (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT false,
  message TEXT,
  estimated_duration TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_by UUID REFERENCES admin_users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `cron_job_runs`
```sql
CREATE TABLE cron_job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_name TEXT NOT NULL,
  status TEXT, -- 'success' | 'error'
  duration_ms INTEGER,
  error_message TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- Performance indexes
CREATE INDEX idx_reflections_user_date ON reflections(user_id, date DESC);
CREATE INDEX idx_reflections_date ON reflections(date DESC);
CREATE INDEX idx_moods_user_date ON moods(user_id, date DESC);
CREATE INDEX idx_prompts_history_user_date ON prompts_history(user_id, date DESC);
CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX idx_email_queue_status ON email_queue(status, created_at);
CREATE INDEX idx_support_tickets_status ON support_tickets(status, created_at DESC);
CREATE INDEX idx_profiles_trial ON profiles(is_trial, trial_end_date);
```

---

## ⏰ Cron Jobs

### Configuration (`vercel.json`)

```json
{
  "crons": [
    {
      "path": "/api/cron/send-daily-prompts",
      "schedule": "0 * * * *"
    },
    {
      "path": "/api/cron/regenerate-weekly-insights",
      "schedule": "0 6 * * 1,5"
    },
    {
      "path": "/api/cron/check-trial-expiry",
      "schedule": "0 9 * * *"
    },
    {
      "path": "/api/cron/expire-trials",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-welcome-emails",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

### Job Details

#### 1. Send Daily Prompts
**Schedule**: Every hour  
**Cron**: `0 * * * *`  
**File**: `/app/api/cron/send-daily-prompts/route.ts`

**Logic**:
```typescript
1. Get current UTC hour
2. Query users with:
   - daily_reminders = true
   - reminder_time matches current hour in their timezone
3. For each user:
   a. Check if prompt already sent today
   b. Generate/fetch today's prompt
   c. Send via delivery_method (email/slack/both)
   d. Log delivery
4. Return summary
```

**Security**: Requires `CRON_SECRET` header

#### 2. Regenerate Weekly Insights
**Schedule**: Monday and Friday at 6 AM UTC  
**Cron**: `0 6 * * 1,5`  
**File**: `/app/api/cron/regenerate-weekly-insights/route.ts`

**Logic**:
```typescript
1. Get all premium users
2. For each user:
   a. Fetch last 7 days of reflections
   b. Calculate statistics
   c. Generate AI insights
   d. Cache in weekly_insights_cache
   e. Send weekly digest email
3. Return summary
```

**Security**: Requires `CRON_SECRET` header

#### 3. Check Trial Expiry
**Schedule**: Daily at 9 AM UTC  
**Cron**: `0 9 * * *`  
**File**: `/app/api/cron/check-trial-expiry/route.ts`

**Logic**:
```typescript
1. Find trials expiring in 3 days
   → Send "3 days left" warning email
2. Find trials expiring in 1 day
   → Send "1 day left" final warning email
3. Log notifications sent
4. Return summary
```

**Security**: Requires `CRON_SECRET` header

#### 4. Expire Trials
**Schedule**: Daily at midnight UTC  
**Cron**: `0 0 * * *`  
**File**: `/app/api/cron/expire-trials/route.ts`

**Logic**:
```typescript
1. Find trials where trial_end_date < NOW()
2. For each expired trial:
   a. Set is_trial = false
   b. Set subscription_tier = 'free'
   c. Set subscription_status = 'inactive'
   d. Send trial expired email
3. Log expirations
4. Return summary
```

**Security**: Requires `CRON_SECRET` header

#### 5. Send Welcome Emails
**Schedule**: Every 5 minutes  
**Cron**: `*/5 * * * *`  
**File**: `/app/api/cron/send-welcome-emails/route.ts`

**Logic**:
```typescript
1. Get pending emails from email_queue
2. For each email:
   a. Send via Resend
   b. If success:
      - Mark as 'sent'
      - Set sent_at timestamp
   c. If failure:
      - Increment attempts
      - If attempts < max_attempts:
        - Keep as 'pending'
      - Else:
        - Mark as 'failed'
        - Log error
3. Return summary
```

**Security**: Requires `CRON_SECRET` header

### Monitoring Cron Jobs

**View Logs**:
```sql
SELECT * FROM cron_job_runs
ORDER BY created_at DESC
LIMIT 100;
```

**Check Success Rate**:
```sql
SELECT 
  job_name,
  COUNT(*) as total_runs,
  SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) as successful,
  AVG(duration_ms) as avg_duration_ms
FROM cron_job_runs
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY job_name;
```

---

## 🛠️ Services & Utilities

### Core Services

#### `lib/supabase/server.ts`
```typescript
// Server-side Supabase client
export async function createClient()
export async function createServiceRoleClient()
```

#### `lib/supabase/client.ts`
```typescript
// Client-side Supabase client
export const supabase = createBrowserClient()
```

#### `lib/services/aiService.ts`
```typescript
// AI prompt generation
export async function generatePrompt(context: GeneratePromptContext): Promise<string>
export async function generateWithOpenAI(prompt: string): Promise<string>
export async function generateWithGemini(prompt: string): Promise<string>
export async function generateWithOpenRouter(prompt: string): Promise<string>
```

#### `lib/services/emailService.ts`
```typescript
// Email sending
export async function sendWelcomeEmail(email: string, displayName: string)
export async function sendTrialWarningEmail(email: string, daysLeft: number)
export async function sendTrialExpiredEmail(email: string)
export async function sendDailyPromptEmail(email: string, prompt: string)
export async function sendWeeklyDigestEmail(email: string, userId: string, name: string, digest: WeeklyDigest)
```

#### `lib/services/reflectionService.ts`
```typescript
// Reflection CRUD operations
export async function createReflection(data: CreateReflectionData)
export async function getReflections(userId: string, filters?: Filters)
export async function getReflectionById(id: string, userId: string)
export async function updateReflection(id: string, userId: string, data: UpdateData)
export async function deleteReflection(id: string, userId: string)
```

#### `lib/services/analyticsServiceServer.ts`
```typescript
// Server-side analytics
export async function calculateMoodTrendsServer(userId: string, days: number)
export async function generateWeeklyDigestServer(userId: string)
export async function getStreakData(userId: string)
```

#### `lib/services/adminUserService.ts`
```typescript
// Admin authentication
export async function verifyAdminCredentials(email: string, password: string)
export async function isAdminUser(userId: string): Promise<boolean>
export async function isSuperAdmin(userId: string): Promise<boolean>
```

### Utility Functions

#### `lib/utils/tierManagement.ts`
```typescript
export function getUserTier(status: string, tier: string): 'free' | 'premium'
export function canCreateReflection(weeklyCount: number, status: string, tier: string): boolean
export function getWeeklyPromptAllowance(status: string, tier: string): number
export function hasFeatureAccess(feature: string, tier: string): boolean
```

#### `lib/utils/crypto.ts`
```typescript
export function encryptIfPossible(text: string): string
export function decryptIfEncrypted(text: string): string
```

#### `lib/utils/timezone.ts`
```typescript
export function getUserTimezone(): string
export function convertToUserTimezone(date: Date, timezone: string): Date
export function getHourInTimezone(timezone: string): number
```

### Custom Hooks

#### `hooks/useTier.ts`
```typescript
export function useTier(): UseTierResult {
  // Returns user tier, trial status, feature flags
}
```

#### `hooks/useReflections.ts`
```typescript
export function useReflections() {
  // Manages reflection state and CRUD operations
}
```

#### `hooks/useAchievements.ts`
```typescript
export function useAchievements() {
  // Manages achievement unlocking and progress
}
```

### Contexts

#### `contexts/ThemeContext.tsx`
```typescript
export const ThemeProvider
export const useTheme
// Manages dark/light theme
```

#### `contexts/LanguageContext.tsx`
```typescript
export const LanguageProvider
export const useLanguage
// Manages i18n
```

#### `lib/context/GlobalSyncContext.tsx`
```typescript
export const GlobalSyncProvider
// Syncs data across tabs
```

---

## 🔑 Environment Variables

### Required Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx...
SUPABASE_SERVICE_ROLE_KEY=eyJxxx...

# AI Providers (at least one required)
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=AIzxxx
OPENROUTER_API_KEY=sk-or-xxx
HUGGINGFACE_API_KEY=hf_xxx

# Email
RESEND_API_KEY=re_xxx

# Cron Security
CRON_SECRET=your_random_secret_string

# Optional
ENCRYPTION_KEY=32_character_hex_string
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

### Optional Variables

```env
# Stripe (if using payments)
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Analytics
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=xxx

# Feature Flags
NEXT_PUBLIC_ENABLE_PAYMENTS=false
NEXT_PUBLIC_ENABLE_MOBILE_APP=false
```

---

## 🚀 Deployment

### Vercel Deployment

**Prerequisites**:
1. GitHub repository
2. Vercel account
3. Environment variables ready

**Steps**:
```bash
1. Push code to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy
```

**Automatic Features**:
- ✅ Cron jobs configured from `vercel.json`
- ✅ Edge functions for API routes
- ✅ Automatic HTTPS
- ✅ Preview deployments for PRs
- ✅ Analytics enabled

### Database Setup

**Run migrations in order**:
```sql
1. database/create_admin_users_table.sql
2. database/create_support_tickets_tables.sql
3. database/create_maintenance_mode_table.sql
4. database/setup_7day_trial.sql
5. database/setup_email_queue.sql
6. database/seed_all_email_templates.sql
7. database/admin_dashboard_stats_functions.sql
```

### Post-Deployment Checklist

- [ ] Verify environment variables
- [ ] Test authentication flow
- [ ] Test email sending
- [ ] Verify cron jobs running
- [ ] Check database connections
- [ ] Test admin login
- [ ] Monitor error logs
- [ ] Set up alerts

---

## 💻 Development Workflow

### Local Development

```bash
# Install dependencies
npm install

# Run dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check

# Linting
npm run lint
```

### Code Structure Best Practices

**API Routes**:
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }
    
    // Your logic here
    
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
```

**Components**:
```typescript
// components/example.tsx
'use client'

import { useTheme } from '@/contexts/ThemeContext'

export default function Example() {
  const { theme } = useTheme()
  
  return (
    <div className={theme === 'dark' ? 'bg-black' : 'bg-white'}>
      {/* Component content */}
    </div>
  )
}
```

### Testing

**Manual Testing Checklist**:
- [ ] Signup flow (email + Google)
- [ ] Email verification
- [ ] Onboarding completion
- [ ] Prompt generation
- [ ] Reflection creation
- [ ] Analytics display
- [ ] Achievement unlocking
- [ ] Settings updates
- [ ] Admin dashboard
- [ ] Cron job execution

### Debugging

**Common Issues**:

1. **API Route 404**
   - Restart dev server
   - Check file naming (`route.ts`)
   - Verify folder structure

2. **Database Connection Error**
   - Check Supabase credentials
   - Verify RLS policies
   - Check service role key

3. **Email Not Sending**
   - Verify Resend API key
   - Check domain verification
   - Review email logs

4. **Cron Job Not Running**
   - Verify `CRON_SECRET` header
   - Check Vercel cron logs
   - Ensure route is accessible

---

## 📞 Support & Resources

**Documentation**:
- Next.js: https://nextjs.org/docs
- Supabase: https://supabase.com/docs
- Tailwind CSS: https://tailwindcss.com/docs
- shadcn/ui: https://ui.shadcn.com

**Internal Docs**:
- `README.md` - Project overview
- `PROJECT_STATUS.md` - Current status
- `QUICK_START.md` - Setup guide
- `CAREERS.md` - Job listings

**Contact**:
- Technical Issues: GitHub Issues
- Questions: developer@promptandpause.com

---

**Last Updated**: December 24, 2025  
**Maintained By**: Development Team  
**Version**: 1.0
