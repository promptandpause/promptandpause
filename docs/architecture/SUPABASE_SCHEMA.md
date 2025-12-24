# Supabase Database Schema

This document outlines the complete database schema for **Prompt & Pause** mental health reflection service.

## Overview

The database is structured to support:
- User authentication and profiles
- Reflection journaling with mood tracking
- User preferences and settings
- Subscription management (Freemium + Premium)
- AI-generated prompt history
- Email delivery tracking

---

## Tables

### 1. `users` (extends Supabase auth.users)

Extended user profile information beyond Supabase Auth.

```sql
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC+00:00',
  language_code TEXT DEFAULT 'en',
  subscription_tier TEXT DEFAULT 'freemium' CHECK (subscription_tier IN ('freemium', 'premium')),
  subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'cancelled', 'expired')),
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);
```

**Fields:**
- `id`: UUID, primary key, references auth.users
- `full_name`: User's display name
- `email`: Email address (unique)
- `avatar_url`: Profile picture URL
- `timezone`: User's timezone (e.g., "UTC+00:00")
- `language_code`: Preferred language (e.g., "en", "es", "fr")
- `subscription_tier`: "freemium" or "premium"
- `subscription_status`: "active", "cancelled", or "expired"
- `stripe_customer_id`: Stripe customer ID for payments
- `stripe_subscription_id`: Stripe subscription ID

---

### 2. `user_preferences`

Stores user onboarding choices and prompt delivery preferences.

```sql
CREATE TABLE public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Onboarding data
  reason TEXT, -- What brings them here (e.g., "Work stress", "Anxiety")
  current_mood INTEGER CHECK (current_mood BETWEEN 1 AND 10),
  
  -- Prompt delivery settings
  prompt_time TIME DEFAULT '09:00:00', -- When to send daily prompt
  prompt_frequency TEXT DEFAULT 'daily' CHECK (prompt_frequency IN ('daily', 'weekdays', 'every-other-day', 'twice-weekly', 'weekly', 'custom')),
  custom_days TEXT[], -- For custom schedule: ['monday', 'wednesday', 'friday']
  delivery_method TEXT DEFAULT 'email' CHECK (delivery_method IN ('email', 'slack', 'both')),
  slack_webhook_url TEXT,
  
  -- Focus areas
  focus_areas TEXT[] DEFAULT '{}', -- e.g., ['Career', 'Relationships', 'Self-esteem']
  
  -- Notification preferences
  push_notifications BOOLEAN DEFAULT true,
  daily_reminders BOOLEAN DEFAULT true,
  weekly_digest BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences" ON public.user_preferences
  FOR ALL USING (auth.uid() = user_id);
```

**Fields:**
- `user_id`: References users table
- `reason`: Why they're using the service
- `current_mood`: Initial mood rating (1-10)
- `prompt_time`: Preferred time for daily prompts
- `prompt_frequency`: How often they want prompts
- `custom_days`: Array of days for custom schedule
- `delivery_method`: "email", "slack", or "both"
- `slack_webhook_url`: For Slack integration
- `focus_areas`: Topics they want to reflect on
- `push_notifications`, `daily_reminders`, `weekly_digest`: Boolean flags

---

### 3. `reflections`

Stores user journal reflections.

```sql
CREATE TABLE public.reflections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  prompt_id UUID REFERENCES public.prompts_history(id),
  prompt_text TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  
  mood TEXT NOT NULL, -- Emoji: "😔", "😐", "😊", "😄", "🤔", "😌", "🙏", "💪"
  tags TEXT[] DEFAULT '{}', -- e.g., ['Gratitude', 'Career']
  
  word_count INTEGER NOT NULL,
  feedback TEXT CHECK (feedback IN ('helped', 'irrelevant')),
  
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one reflection per day per user
  UNIQUE(user_id, date)
);

-- Indexes for performance
CREATE INDEX idx_reflections_user_date ON public.reflections(user_id, date DESC);
CREATE INDEX idx_reflections_tags ON public.reflections USING GIN(tags);

-- Enable Row Level Security
ALTER TABLE public.reflections ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own reflections" ON public.reflections
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own reflections" ON public.reflections
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reflections" ON public.reflections
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own reflections" ON public.reflections
  FOR DELETE USING (auth.uid() = user_id);
```

**Fields:**
- `user_id`: References users table
- `prompt_id`: References the prompt that was used
- `prompt_text`: The actual prompt text
- `reflection_text`: User's journal entry
- `mood`: Emoji representing mood
- `tags`: Array of reflection tags
- `word_count`: Number of words in reflection
- `feedback`: User feedback on prompt ("helped" or "irrelevant")
- `date`: Date of reflection (one per day per user)

---

### 4. `moods`

Separate mood tracking table (optional - can be derived from reflections).

```sql
CREATE TABLE public.moods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  reflection_id UUID REFERENCES public.reflections(id) ON DELETE CASCADE,
  
  mood TEXT NOT NULL, -- Emoji
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, date)
);

-- Index
CREATE INDEX idx_moods_user_date ON public.moods(user_id, date DESC);

-- Enable Row Level Security
ALTER TABLE public.moods ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own moods" ON public.moods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own moods" ON public.moods
  FOR ALL USING (auth.uid() = user_id);
```

---

### 5. `prompts_history`

Stores all AI-generated prompts for tracking and avoiding duplicates.

```sql
CREATE TABLE public.prompts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  prompt_text TEXT NOT NULL,
  ai_provider TEXT NOT NULL CHECK (ai_provider IN ('groq', 'openai')),
  ai_model TEXT NOT NULL, -- e.g., "llama-3.1-70b-versatile", "gpt-4o-mini"
  
  personalization_context JSONB, -- Mood, focus areas, recent topics, etc.
  
  date_generated DATE NOT NULL DEFAULT CURRENT_DATE,
  used BOOLEAN DEFAULT false, -- Whether user responded to this prompt
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_prompts_user_date ON public.prompts_history(user_id, date_generated DESC);

-- Enable Row Level Security
ALTER TABLE public.prompts_history ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own prompts" ON public.prompts_history
  FOR SELECT USING (auth.uid() = user_id);
```

**Fields:**
- `user_id`: References users table
- `prompt_text`: The generated prompt
- `ai_provider`: "groq" or "openai"
- `ai_model`: Model used for generation
- `personalization_context`: JSON with user context
- `date_generated`: When prompt was created
- `used`: Whether user completed reflection

---

### 6. `subscriptions`

Tracks Stripe subscription details.

```sql
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  stripe_subscription_id TEXT UNIQUE NOT NULL,
  stripe_customer_id TEXT NOT NULL,
  stripe_price_id TEXT NOT NULL,
  
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid')),
  
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'annual')),
  amount INTEGER NOT NULL, -- Amount in pence (e.g., 1200 for £12.00)
  currency TEXT DEFAULT 'gbp',
  
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at_period_end BOOLEAN DEFAULT false,
  canceled_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id)
);

-- Index
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);

-- Enable Row Level Security
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own subscription" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);
```

---

### 7. `email_delivery_log`

Tracks all email deliveries (for debugging and analytics).

```sql
CREATE TABLE public.email_delivery_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  email_type TEXT NOT NULL CHECK (email_type IN ('daily_prompt', 'weekly_digest', 'welcome', 'subscription_confirm', 'subscription_cancelled')),
  
  resend_email_id TEXT, -- Resend's email ID
  recipient_email TEXT NOT NULL,
  
  status TEXT NOT NULL CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'failed')),
  error_message TEXT,
  
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ
);

-- Index
CREATE INDEX idx_email_log_user ON public.email_delivery_log(user_id, sent_at DESC);

-- Enable Row Level Security
ALTER TABLE public.email_delivery_log ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own email log" ON public.email_delivery_log
  FOR SELECT USING (auth.uid() = user_id);
```

---

## Functions & Triggers

### Auto-update `updated_at` timestamp

```sql
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER user_preferences_updated_at BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER reflections_updated_at BEFORE UPDATE ON public.reflections
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Create user profile on signup

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users insert
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## Indexes Summary

```sql
-- Performance indexes
CREATE INDEX idx_reflections_user_date ON public.reflections(user_id, date DESC);
CREATE INDEX idx_reflections_tags ON public.reflections USING GIN(tags);
CREATE INDEX idx_moods_user_date ON public.moods(user_id, date DESC);
CREATE INDEX idx_prompts_user_date ON public.prompts_history(user_id, date_generated DESC);
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_customer ON public.subscriptions(stripe_customer_id);
CREATE INDEX idx_email_log_user ON public.email_delivery_log(user_id, sent_at DESC);
```

---

## Migration Notes

1. **Run schema in Supabase SQL Editor** in order
2. **Enable Realtime** (optional) for reflections table if you want live updates
3. **Test RLS policies** with different users
4. **Set up Stripe webhooks** to update subscriptions table
5. **Configure Resend webhooks** to update email_delivery_log

---

## Environment Variables Required

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi... # For server-side admin operations
```

---

## Quick Start Commands

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push
```

---

## Data Flow

1. **User signs up** → `auth.users` → Trigger creates `public.users`
2. **Onboarding** → Saves to `user_preferences`
3. **Daily Cron** → Generates prompt → Saves to `prompts_history` → Sends email
4. **User writes reflection** → Saves to `reflections` and `moods`
5. **Stripe payment** → Webhook updates `users` and `subscriptions`

---

## Security Considerations

- ✅ **Row Level Security (RLS)** enabled on all public tables
- ✅ Users can only access their own data
- ✅ Service role key used only for server-side operations
- ✅ Anon key safe to expose in client
- ✅ All sensitive operations use server-side API routes

---

This schema supports all features of Prompt & Pause including:
- ✅ User authentication (email + Google OAuth)
- ✅ Reflection journaling with mood tracking
- ✅ AI-generated personalized prompts
- ✅ Freemium + Premium subscriptions
- ✅ Email delivery tracking
- ✅ Slack integration support
- ✅ Weekly digests and analytics
