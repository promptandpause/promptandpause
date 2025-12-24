# Email Verification Flow

## Overview

The application now differentiates between OAuth (Google SSO) and email/password authentication for email verification.

## User Flows

### Google SSO Users (OAuth)
```
Sign up with Google
    ↓
Google verifies email ✅
    ↓
Redirect to /onboarding
    ↓
Complete onboarding
    ↓
Access /dashboard
```

**No email verification required** - Google already verifies the email address.

### Email/Password Users
```
Sign up with email/password
    ↓
Receive verification email
    ↓
Redirect to /auth/verify
    ↓
Click link in email
    ↓
Email verified ✅
    ↓
Redirect to /onboarding
    ↓
Complete onboarding
    ↓
Access /dashboard
```

**Email verification required** - Users must verify their email before accessing onboarding or dashboard.

## Implementation Details

### Proxy Middleware (`proxy.ts`)

**Global Check (Lines 168-194):**
```typescript
// Check if email is verified (only required for email/password signups, not OAuth)
// OAuth providers (Google, etc.) already verify emails
const isOAuthUser = user.app_metadata?.provider !== 'email'
const isEmailVerified = user.email_confirmed_at !== null

if (!isOAuthUser && !isEmailVerified) {
  console.log('[PROXY] Email not verified - redirecting to verify page')
  return NextResponse.redirect(new URL('/auth/verify', request.url))
}
```

**Onboarding Protection (Lines 267-280):**
```typescript
// Check if email is verified (only for email/password users)
const isOAuthUser = user.app_metadata?.provider !== 'email'
const isEmailVerified = user.email_confirmed_at !== null

if (!isOAuthUser && !isEmailVerified) {
  console.log('[PROXY] Onboarding access denied - email not verified')
  return NextResponse.redirect(new URL('/auth/verify', request.url))
}
```

### Verify Page (`app/auth/verify/page.tsx`)

**Features:**
- Auto-detects if user is already verified
- Redirects to `/onboarding` after verification (not dashboard)
- Allows resending verification email
- Shows verification status with visual feedback

**After Verification:**
```typescript
if (user && user.email_confirmed_at) {
  setVerified(true)
  toast({
    title: "Email verified!",
    description: "Your email has been verified successfully.",
  })
  // Redirect to onboarding after 2 seconds
  setTimeout(() => router.push('/onboarding'), 2000)
}
```

## User Metadata

### OAuth Users (Google SSO)
```json
{
  "app_metadata": {
    "provider": "google",
    "providers": ["google"]
  },
  "email_confirmed_at": "2024-01-01T00:00:00.000Z" // Auto-set by Google
}
```

### Email/Password Users
```json
{
  "app_metadata": {
    "provider": "email",
    "providers": ["email"]
  },
  "email_confirmed_at": null // Until they click verification link
}
```

## Detection Logic

```typescript
// Check if user signed up with OAuth or email/password
const isOAuthUser = user.app_metadata?.provider !== 'email'

// Possible values:
// - 'email' = Email/password signup
// - 'google' = Google SSO
// - 'github' = GitHub OAuth (if enabled)
// - etc.
```

## Protected Routes

### Requires Email Verification (Email/Password Users Only):
- `/onboarding`
- `/dashboard`
- `/dashboard/*` (all dashboard routes)
- Any protected route except `/auth/verify`

### Always Accessible:
- `/` (homepage)
- `/auth/signin`
- `/auth/signup`
- `/auth/verify`
- `/auth/callback`
- `/auth/forgot-password`

### OAuth Users:
- Skip `/auth/verify` entirely
- Go directly to `/onboarding` after signup
- Then to `/dashboard` after completing onboarding

## Console Logs

**Email/Password User (Unverified):**
```
[PROXY] Email not verified - redirecting to verify page
```

**Email/Password User (Verified, No Onboarding):**
```
[PROXY] Global onboarding check - redirecting to onboarding
```

**OAuth User (No Onboarding):**
```
[PROXY] Global onboarding check - redirecting to onboarding
```

**Any User (Onboarding Complete):**
```
// No redirect, access granted
```

## Supabase Configuration

### Email Templates

Ensure Supabase has email verification enabled:

1. Go to **Authentication > Email Templates**
2. Enable **Confirm signup** template
3. Customize the email template if needed
4. Set redirect URL to: `https://yourdomain.com/auth/callback`

### Auth Settings

1. Go to **Authentication > Settings**
2. Enable **Email Confirmations**
3. Set **Confirm email** to `true`
4. Configure OAuth providers (Google, etc.)

## Testing

### Test Email/Password Flow:
1. Sign up with email/password
2. Should redirect to `/auth/verify`
3. Check email for verification link
4. Click link → redirects to `/onboarding`
5. Complete onboarding → access `/dashboard`

### Test Google SSO Flow:
1. Sign up with Google
2. Should skip `/auth/verify`
3. Go directly to `/onboarding`
4. Complete onboarding → access `/dashboard`

### Test Unverified Access:
1. Sign up with email/password
2. Try to access `/dashboard` directly
3. Should redirect to `/auth/verify`
4. Try to access `/onboarding` directly
5. Should redirect to `/auth/verify`

## Edge Cases

### User Deletes Verification Email:
- Can request resend on `/auth/verify` page
- Enter email and click "Resend Verification Email"

### User Already Verified:
- `/auth/verify` page auto-detects and redirects to onboarding
- No manual action needed

### OAuth User Tries to Access Verify Page:
- Will be redirected based on onboarding status
- No verification needed

## Security

✅ Email/password users cannot bypass verification
✅ OAuth users don't need verification (already verified by provider)
✅ Middleware enforces verification at global level
✅ No client-side bypass possible
✅ Server-side checks in proxy middleware
