# Authentication Setup Guide

## 🎉 What's Complete

Your authentication system is **fully integrated** with Supabase! Here's what's ready:

### ✅ Files Created/Updated

1. **`middleware.ts`** - Route protection and auth guards
   - Protects dashboard routes (requires login)
   - Protects onboarding (requires login)
   - Redirects authenticated users away from auth pages
   - Ensures users complete onboarding before accessing dashboard

2. **`app/(auth)/auth/callback/route.ts`** - OAuth callback handler
   - Handles Google OAuth redirect
   - Exchanges code for session
   - Routes users to onboarding or dashboard

3. **`app/(auth)/_components/login-form.tsx`** - Sign in functionality
   - Google OAuth sign in
   - Email/password sign in
   - Loading states
   - Error handling

4. **`app/(auth)/_components/signup-form.tsx`** - Sign up functionality
   - Google OAuth sign up
   - Email/password sign up
   - Password validation
   - Email confirmation handling

---

## 🚀 Next Steps - Supabase Setup

### Step 1: Create Supabase Project (5 minutes)

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization/create one
4. Fill in:
   - **Project Name**: "prompt-and-pause"
   - **Database Password**: (generate strong password - SAVE THIS!)
   - **Region**: Choose closest to you (UK)
   - **Pricing Plan**: Free

5. Wait for project to be created (~2 minutes)

### Step 2: Run Database Schema (5 minutes)

1. In your Supabase project, click "SQL Editor" (left sidebar)
2. Click "New Query"
3. Copy **ALL** the SQL from `SUPABASE_SCHEMA.md`
4. Paste into the editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

### Step 3: Get API Keys (2 minutes)

1. Click "Project Settings" (gear icon in sidebar)
2. Click "API" in the settings menu
3. Copy these values:

```
Project URL: https://xxxxx.supabase.co
anon public key: eyJhbGciOi...
service_role key: eyJhbGciOi...
```

### Step 4: Enable Google OAuth (5 minutes)

1. In Supabase, go to "Authentication" → "Providers"
2. Find "Google" in the list
3. Toggle it to **Enabled**
4. You need Google OAuth credentials:

#### Get Google OAuth Credentials:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or use existing)
3. Go to "APIs & Services" → "Credentials"
4. Click "Create Credentials" → "OAuth 2.0 Client IDs"
5. Choose "Web application"
6. Add **Authorized redirect URIs**:
   ```
   https://xxxxx.supabase.co/auth/v1/callback
   ```
   (Replace xxxxx with your Supabase project ID)

7. Copy **Client ID** and **Client Secret**
8. Paste into Supabase Google Provider settings
9. Save

### Step 5: Configure Site URL (2 minutes)

1. In Supabase, go to "Authentication" → "URL Configuration"
2. Set **Site URL**: `http://localhost:3000` (for development)
3. Add **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/*
   ```
4. Save

### Step 6: Create .env.local (2 minutes)

```bash
# In your project root
cp .env.example .env.local
```

Edit `.env.local` and add your Supabase keys:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# App Config
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

---

## 🧪 Test Authentication

### Test 1: Email Sign Up

```bash
npm run dev
```

1. Go to `http://localhost:3000/auth/signup`
2. Click "Show other options"
3. Enter email and password
4. Click "Sign Up"
5. Check your terminal for Supabase logs
6. You should be redirected to `/onboarding`

### Test 2: Google Sign Up

1. Go to `http://localhost:3000/auth/signup`
2. Click "Continue with Google"
3. Choose your Google account
4. Approve permissions
5. You should be redirected back to `/onboarding`

### Test 3: Complete Flow

```
Sign up → Onboarding (fill out) → Dashboard
```

### Test 4: Sign In

1. Go to `http://localhost:3000/auth/signin`
2. Sign in with credentials from Test 1
3. You should be redirected to `/dashboard` (skip onboarding - already completed)

### Test 5: Protected Routes

1. Open incognito window
2. Try to go to `http://localhost:3000/dashboard`
3. You should be redirected to `/auth/signin`

---

## 🔐 Authentication Flow

### New User (Sign Up)
```
1. /auth/signup
2. Click "Sign Up" or "Continue with Google"
3. → /onboarding (middleware enforces this)
4. Complete onboarding
5. → /dashboard
```

### Returning User (Sign In)
```
1. /auth/signin
2. Enter credentials or use Google
3. → /dashboard (skip onboarding - already completed)
```

### Logged-in User Tries to Access Auth Pages
```
1. Already logged in
2. Tries to go to /auth/signin
3. → Redirected to /dashboard
```

### Logged-out User Tries to Access Dashboard
```
1. Not logged in
2. Tries to go to /dashboard
3. → Redirected to /auth/signin
```

---

## 🎨 User Experience

### After Sign Up (Email)

- **If email confirmation enabled** (default):
  ```
  "Check your email"
  User must click link in email
  Then redirect to /onboarding
  ```

- **If email confirmation disabled**:
  ```
  Immediate redirect to /onboarding
  ```

### After Sign Up (Google)

```
Immediate redirect to /onboarding
No email confirmation needed
```

---

## ⚙️ Optional: Disable Email Confirmation

For faster testing (not recommended for production):

1. Go to Supabase → "Authentication" → "Providers"
2. Click "Email" provider
3. Toggle "Enable email confirmations" to **OFF**
4. Save

Now email signups will immediately create a session and redirect to onboarding.

---

## 🐛 Troubleshooting

### Error: "Invalid login credentials"
- **Check**: Email and password are correct
- **Check**: User exists in Supabase (Auth → Users)

### Error: "redirect_uri_mismatch" (Google OAuth)
- **Check**: Redirect URI in Google Console matches:
  ```
  https://xxxxx.supabase.co/auth/v1/callback
  ```

### Redirects not working
- **Check**: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set
- **Check**: You've restarted dev server after adding env vars
- **Check**: Middleware is working (`middleware.ts` exists)

### "User not found" after signup
- **Check**: Database schema is applied (run `SUPABASE_SCHEMA.md` SQL)
- **Check**: Trigger for creating user profile exists:
  ```sql
  CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  ```

### Stuck in redirect loop
- **Clear cookies**: Browser devtools → Application → Cookies → Delete all for localhost
- **Check**: `user_preferences` table exists and is accessible

---

## 📊 Check Your Data

After successful signup and onboarding:

```sql
-- View users
SELECT * FROM auth.users;

-- View user profiles
SELECT * FROM public.users;

-- View user preferences (from onboarding)
SELECT * FROM public.user_preferences;
```

---

## ✅ Success Criteria

You'll know everything is working when:

- [ ] You can sign up with email
- [ ] You can sign up with Google
- [ ] After signup, you're redirected to onboarding
- [ ] After completing onboarding, you're redirected to dashboard
- [ ] Dashboard shows (even if still using localStorage)
- [ ] You can sign out and sign back in
- [ ] After signing in, you go straight to dashboard (skip onboarding)
- [ ] Trying to access dashboard when logged out redirects to signin
- [ ] User data appears in Supabase Auth → Users
- [ ] User preferences appear in `user_preferences` table

---

## 🎊 What This Unlocks

With authentication working:

✅ Users can sign up and sign in
✅ Onboarding saves to database
✅ Protected routes work
✅ Ready to migrate dashboard to Supabase
✅ Ready to add Stripe subscriptions
✅ Ready to send emails to real users

---

## 📝 Next After Auth Works

Once auth is working:

1. **Migrate Dashboard** - Replace localStorage with Supabase queries
2. **Settings Page** - Remove "John Doe" demo data
3. **Stripe Integration** - Add subscription checkout
4. **Email Delivery** - Send welcome emails, daily prompts

---

**Total Time: ~20 minutes**

The code is ready. You just need to set up Supabase and you'll have a fully functional auth system!
