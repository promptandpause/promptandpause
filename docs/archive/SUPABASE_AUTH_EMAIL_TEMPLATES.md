# Supabase Auth Email Templates

Custom branded email templates for Supabase authentication flows.

## 🎯 Overview

Supabase allows custom HTML templates for authentication emails. These templates maintain your brand identity across all user touchpoints with a dark, minimalist aesthetic matching your website.

**Location**: Supabase Dashboard → Authentication → Email Templates

---

## 📧 Template 1: Confirm Signup

**When**: New user signs up and needs to verify email  
**Subject**: `Confirm your signup - Prompt & Pause`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Signup</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #171717; border-radius: 0; overflow: hidden;">
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding: 40px 20px; background: #171717; border-bottom: 1px solid #262626;">
              <img src="{{ .SiteURL }}/logo.svg" alt="Prompt & Pause" style="height: 50px; width: auto; filter: invert(1);" />
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 50px 40px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 24px 0; font-weight: 400; letter-spacing: -0.02em;">Confirm Your Email</h1>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; font-weight: 300;">
                Welcome to Prompt & Pause. We're excited to have you join our community of mindful reflection.
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 32px 0; font-weight: 300;">
                Please confirm your email address to activate your account and start your reflection journey.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 0; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffffff; transition: all 0.3s ease;">
                  Confirm Email Address
                </a>
              </div>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: rgba(255, 255, 255, 0.7); word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 20px 0 0 0;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0 0 8px 0; font-weight: 300;">
                Prompt & Pause • Pause. Reflect. Grow.
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 0;">
                © 2025 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📧 Template 2: Invite User

**When**: Admin invites a user to join  
**Subject**: `You're invited to join Prompt & Pause`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #171717; border-radius: 0; overflow: hidden;">
          <tr>
            <td style="text-align: center; padding: 40px 20px; background: #171717; border-bottom: 1px solid #262626;">
              <img src="{{ .SiteURL }}/logo.svg" alt="Prompt & Pause" style="height: 50px; width: auto; filter: invert(1);" />
            </td>
          </tr>
          
          <tr>
            <td style="padding: 50px 40px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 24px 0; font-weight: 400; letter-spacing: -0.02em;">You're Invited</h1>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; font-weight: 300;">
                You've been invited to join Prompt & Pause, a space for mindful reflection and personal growth.
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 32px 0; font-weight: 300;">
                Click below to accept your invitation and create your account.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 0; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffffff;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="{{ .ConfirmationURL }}" style="color: rgba(255, 255, 255, 0.7); word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0 0 8px 0; font-weight: 300;">
                Prompt & Pause • Pause. Reflect. Grow.
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 0;">
                © 2025 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📧 Template 3: Magic Link

**When**: User requests passwordless signin  
**Subject**: `Your magic link - Prompt & Pause`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Magic Link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #171717; border-radius: 0; overflow: hidden;">
          <tr>
            <td style="text-align: center; padding: 40px 20px; background: #171717; border-bottom: 1px solid #262626;">
              <img src="{{ .SiteURL }}/logo.svg" alt="Prompt & Pause" style="height: 50px; width: auto; filter: invert(1);" />
            </td>
          </tr>
          
          <tr>
            <td style="padding: 50px 40px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 24px 0; font-weight: 400; letter-spacing: -0.02em;">Your Magic Link</h1>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 32px 0; font-weight: 300;">
                Click the button below to securely sign in to your Prompt & Pause account.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 0; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffffff;">
                  Sign In
                </a>
              </div>
              
              <div style="background: #262626; border-left: 3px solid rgba(255, 255, 255, 0.3); padding: 16px; margin: 32px 0;">
                <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                  <strong style="color: rgba(255, 255, 255, 0.9);">Security Notice:</strong> If you didn't request this link, please ignore this email.
                </p>
              </div>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" style="color: rgba(255, 255, 255, 0.7); word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 20px 0 0 0;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0 0 8px 0; font-weight: 300;">
                Prompt & Pause • Pause. Reflect. Grow.
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 0;">
                © 2025 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📧 Template 4: Change Email Address

**When**: User changes their email  
**Subject**: `Confirm your new email - Prompt & Pause`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Email Change</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #171717; border-radius: 0; overflow: hidden;">
          <tr>
            <td style="text-align: center; padding: 40px 20px; background: #171717; border-bottom: 1px solid #262626;">
              <img src="{{ .SiteURL }}/logo.svg" alt="Prompt & Pause" style="height: 50px; width: auto; filter: invert(1);" />
            </td>
          </tr>
          
          <tr>
            <td style="padding: 50px 40px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 24px 0; font-weight: 400; letter-spacing: -0.02em;">Confirm Email Change</h1>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; font-weight: 300;">
                You requested to change your email address for your Prompt & Pause account.
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 32px 0; font-weight: 300;">
                Click below to confirm this change and start using your new email address.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 0; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffffff;">
                  Confirm New Email
                </a>
              </div>
              
              <div style="background: #262626; border-left: 3px solid rgba(255, 255, 255, 0.3); padding: 16px; margin: 32px 0;">
                <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                  <strong style="color: rgba(255, 255, 255, 0.9);">Didn't make this change?</strong> Contact support immediately to secure your account.
                </p>
              </div>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" style="color: rgba(255, 255, 255, 0.7); word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0 0 8px 0; font-weight: 300;">
                Prompt & Pause • Pause. Reflect. Grow.
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 0;">
                © 2025 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📧 Template 5: Reset Password

**When**: User requests password reset  
**Subject**: `Reset your password - Prompt & Pause`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #171717; border-radius: 0; overflow: hidden;">
          <tr>
            <td style="text-align: center; padding: 40px 20px; background: #171717; border-bottom: 1px solid #262626;">
              <img src="{{ .SiteURL }}/logo.svg" alt="Prompt & Pause" style="height: 50px; width: auto; filter: invert(1);" />
            </td>
          </tr>
          
          <tr>
            <td style="padding: 50px 40px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 24px 0; font-weight: 400; letter-spacing: -0.02em;">Reset Your Password</h1>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; font-weight: 300;">
                We received a request to reset your password for your Prompt & Pause account.
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 32px 0; font-weight: 300;">
                Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 0; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffffff;">
                  Reset Password
                </a>
              </div>
              
              <div style="background: #262626; border-left: 3px solid rgba(255, 255, 255, 0.3); padding: 16px; margin: 32px 0;">
                <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                  <strong style="color: rgba(255, 255, 255, 0.9);">Security Notice:</strong> If you didn't request this reset, please ignore this email and your password will remain unchanged.
                </p>
              </div>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" style="color: rgba(255, 255, 255, 0.7); word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 20px 0 0 0;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0 0 8px 0; font-weight: 300;">
                Prompt & Pause • Pause. Reflect. Grow.
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 0;">
                © 2025 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 📧 Template 6: Reauthentication

**When**: User needs to reauthenticate for sensitive operations  
**Subject**: `Confirm your identity - Prompt & Pause`

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm Your Identity</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #000000;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #000000; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background: #171717; border-radius: 0; overflow: hidden;">
          <tr>
            <td style="text-align: center; padding: 40px 20px; background: #171717; border-bottom: 1px solid #262626;">
              <img src="{{ .SiteURL }}/logo.svg" alt="Prompt & Pause" style="height: 50px; width: auto; filter: invert(1);" />
            </td>
          </tr>
          
          <tr>
            <td style="padding: 50px 40px;">
              <h1 style="color: #ffffff; font-size: 32px; margin: 0 0 24px 0; font-weight: 400; letter-spacing: -0.02em;">Confirm Your Identity</h1>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 0 0 16px 0; font-weight: 300;">
                For your security, we need to verify your identity before proceeding with this action.
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                <strong>Email:</strong> {{ .Email }}
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.9); font-size: 16px; line-height: 1.8; margin: 24px 0 32px 0; font-weight: 300;">
                Click the button below to confirm it's you.
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="{{ .SiteURL }}/auth/verify?token={{ .Token }}&type=recovery" style="display: inline-block; background: #ffffff; color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 0; font-weight: 600; font-size: 14px; letter-spacing: 0.05em; text-transform: uppercase; border: 1px solid #ffffff;">
                  Verify Identity
                </a>
              </div>
              
              <div style="background: #262626; border-left: 3px solid rgba(255, 255, 255, 0.3); padding: 16px; margin: 32px 0;">
                <p style="margin: 0; color: rgba(255, 255, 255, 0.7); font-size: 13px;">
                  <strong style="color: rgba(255, 255, 255, 0.9);">Why?</strong> This extra step helps keep your account secure.
                </p>
              </div>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .SiteURL }}/auth/verify?token={{ .Token }}&type=recovery" style="color: rgba(255, 255, 255, 0.7); word-break: break-all; text-decoration: underline;">{{ .SiteURL }}/auth/verify?token={{ .Token }}&type=recovery</a>
              </p>
              
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 13px; margin: 20px 0 0 0;">
                This link will expire in 30 minutes.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="background: #0a0a0a; padding: 30px 20px; text-align: center; border-top: 1px solid #262626;">
              <p style="color: rgba(255, 255, 255, 0.7); font-size: 13px; margin: 0 0 8px 0; font-weight: 300;">
                Prompt & Pause • Pause. Reflect. Grow.
              </p>
              <p style="color: rgba(255, 255, 255, 0.5); font-size: 12px; margin: 0;">
                © 2025 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
```

---

## 🚀 How to Apply These Templates

### Step 1: Access Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Email Templates**

### Step 2: Update Each Template
For each template type:
1. Click on the template name
2. Replace the default HTML with the branded template above
3. Update the subject line
4. Click **Save**

### Step 3: Test
1. Trigger each auth flow in your app
2. Check inbox for branded emails
3. Verify all links work correctly
4. Test on multiple email clients

---

## 🎨 Customization Variables

Supabase provides these template variables (varies by template type):

**Common variables:**
- `{{ .Email }}` - User's email address
- `{{ .SiteURL }}` - Your app URL
- `{{ .Token }}` - Auth token
- `{{ .TokenHash }}` - Auth token hash
- `{{ .Data }}` - Additional data object

**Confirm Signup / Invite / Magic Link / Change Email / Reset Password:**
- `{{ .ConfirmationURL }}` - Pre-built confirmation link

**Reauthentication (different variables):**
- `{{ .Token }}` - Token to construct custom URL
- No `{{ .ConfirmationURL }}` - must build manually

---

## ✅ Checklist

- [ ] Logo is accessible at `your-domain.com/logo.svg`
- [ ] All 6 templates updated in Supabase
- [ ] Subject lines customized
- [ ] Templates tested for each auth flow
- [ ] Mobile rendering verified
- [ ] Links work correctly
- [ ] Dark theme (#000000, #171717) applied consistently
- [ ] Reauthentication template uses correct token-based URL construction

---

*Last Updated: 2025-10-09*
