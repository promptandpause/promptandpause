-- ============================================================================
-- SUPABASE AUTH EMAIL TEMPLATES - DARK MODE FIX
-- ============================================================================
-- Updated to support dark mode email clients (iOS Mail, Gmail, Outlook)
-- Adds CSS media queries for prefers-color-scheme: dark
-- Ensures text is always readable regardless of device theme
-- ============================================================================

-- NOTE: These templates need to be manually copied to Supabase Dashboard
-- Go to: Authentication → Email Templates
-- Update each template with the HTML below

-- ============================================================================
-- TEMPLATE 1: CONFIRM SIGNUP
-- Subject: Confirm your email - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Confirm Your Email</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a202c !important; }
      .email-card { background-color: #2d3748 !important; }
      .email-header { background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%) !important; }
      .email-title { color: #86efac !important; }
      .email-text { color: #e2e8f0 !important; }
      .email-muted { color: #a0aec0 !important; }
      .email-link { color: #86efac !important; }
      .email-info-box { background-color: #374151 !important; border-left-color: #86efac !important; }
      .email-info-text { color: #e2e8f0 !important; }
    }
    [data-ogsc] .email-body { background-color: #1a202c !important; }
    [data-ogsc] .email-card { background-color: #2d3748 !important; }
    [data-ogsc] .email-title { color: #86efac !important; }
    [data-ogsc] .email-text { color: #e2e8f0 !important; }
  </style>
</head>
<body class="email-body" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="email-card" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <!-- Header with Logo -->
          <tr>
            <td class="email-header" style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 class="email-title" style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Confirm Your Email</h1>
              
              <p class="email-text" style="color: #1a1a1a; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                Welcome to Prompt & Pause. We're excited to have you join our community of mindful reflection.
              </p>
              
              <p class="email-text" style="color: #1a1a1a; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                Please confirm your email address to activate your account and start your reflection journey.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Confirm Email Address
                </a>
              </div>
              
              <p class="email-muted" style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" class="email-link" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p class="email-muted" style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
                This link will expire in 24 hours.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="height: 4px; background: linear-gradient(180deg, #f4f0eb 0%, #1e293b 100%);"></td>
          </tr>
          <tr>
            <td style="background: #1e293b; padding: 32px 20px; text-align: center;">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 28px; width: auto; filter: brightness(0) invert(1); opacity: 0.9;" />
              </a>
              <p style="color: #ffffff; font-size: 14px; margin: 16px 0 8px 0; opacity: 0.9;">
                Pause. Reflect. Grow.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0; opacity: 0.7;">
                © 2026 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
*/

-- ============================================================================
-- TEMPLATE 2: MAGIC LINK
-- Subject: Your sign-in link - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Your Sign-in Link</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a202c !important; }
      .email-card { background-color: #2d3748 !important; }
      .email-header { background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%) !important; }
      .email-title { color: #86efac !important; }
      .email-text { color: #e2e8f0 !important; }
      .email-muted { color: #a0aec0 !important; }
      .email-link { color: #86efac !important; }
      .email-info-box { background-color: #374151 !important; border-left-color: #86efac !important; }
      .email-info-text { color: #e2e8f0 !important; }
    }
    [data-ogsc] .email-body { background-color: #1a202c !important; }
    [data-ogsc] .email-card { background-color: #2d3748 !important; }
    [data-ogsc] .email-title { color: #86efac !important; }
    [data-ogsc] .email-text { color: #e2e8f0 !important; }
  </style>
</head>
<body class="email-body" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="email-card" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td class="email-header" style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 class="email-title" style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Your Sign-in Link</h1>
              
              <p class="email-text" style="color: #1a1a1a; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                Click the button below to securely sign in to your Prompt & Pause account.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Sign In
                </a>
              </div>
              
              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
                <tr>
                  <td class="email-info-box" style="background: linear-gradient(135deg, #f8f6f3 0%, #ffffff 100%); padding: 16px 20px; border-left: 3px solid #384c37; border-radius: 0 8px 8px 0;">
                    <p class="email-info-text" style="margin: 0; color: #1a1a1a; font-size: 14px; line-height: 1.5;">
                      <strong>Security Notice:</strong> If you didn't request this link, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p class="email-muted" style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" class="email-link" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p class="email-muted" style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="height: 4px; background: linear-gradient(180deg, #f4f0eb 0%, #1e293b 100%);"></td>
          </tr>
          <tr>
            <td style="background: #1e293b; padding: 32px 20px; text-align: center;">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 28px; width: auto; filter: brightness(0) invert(1); opacity: 0.9;" />
              </a>
              <p style="color: #ffffff; font-size: 14px; margin: 16px 0 8px 0; opacity: 0.9;">
                Pause. Reflect. Grow.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0; opacity: 0.7;">
                © 2026 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
*/

-- ============================================================================
-- TEMPLATE 3: RESET PASSWORD
-- Subject: Reset your password - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>Reset Your Password</title>
  <style>
    :root { color-scheme: light dark; supported-color-schemes: light dark; }
    @media (prefers-color-scheme: dark) {
      .email-body { background-color: #1a202c !important; }
      .email-card { background-color: #2d3748 !important; }
      .email-header { background: linear-gradient(180deg, #2d3748 0%, #1a202c 100%) !important; }
      .email-title { color: #86efac !important; }
      .email-text { color: #e2e8f0 !important; }
      .email-muted { color: #a0aec0 !important; }
      .email-link { color: #86efac !important; }
      .email-warning-box { background-color: #4a3728 !important; border-left-color: #fcd34d !important; }
      .email-warning-text { color: #fcd34d !important; }
    }
    [data-ogsc] .email-body { background-color: #1a202c !important; }
    [data-ogsc] .email-card { background-color: #2d3748 !important; }
    [data-ogsc] .email-title { color: #86efac !important; }
    [data-ogsc] .email-text { color: #e2e8f0 !important; }
  </style>
</head>
<body class="email-body" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" class="email-body" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" class="email-card" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td class="email-header" style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 class="email-title" style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Reset Your Password</h1>
              
              <p class="email-text" style="color: #1a1a1a; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                We received a request to reset your password. Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Reset Password
                </a>
              </div>
              
              <!-- Warning Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
                <tr>
                  <td class="email-warning-box" style="background: #fffbeb; padding: 16px 20px; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0;">
                    <p class="email-warning-text" style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>Didn't request this?</strong> You can safely ignore this email. Your password won't change.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p class="email-muted" style="color: #64748b; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" class="email-link" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p class="email-muted" style="color: #64748b; font-size: 13px; margin: 16px 0 0 0;">
                This link will expire in 1 hour.
              </p>
            </td>
          </tr>
          
          <tr>
            <td style="height: 4px; background: linear-gradient(180deg, #f4f0eb 0%, #1e293b 100%);"></td>
          </tr>
          <tr>
            <td style="background: #1e293b; padding: 32px 20px; text-align: center;">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 28px; width: auto; filter: brightness(0) invert(1); opacity: 0.9;" />
              </a>
              <p style="color: #ffffff; font-size: 14px; margin: 16px 0 8px 0; opacity: 0.9;">
                Pause. Reflect. Grow.
              </p>
              <p style="color: #94a3b8; font-size: 12px; margin: 0; opacity: 0.7;">
                © 2026 Prompt & Pause. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
*/

-- ============================================================================
-- INSTRUCTIONS FOR SUPABASE DASHBOARD
-- ============================================================================
-- 1. Go to Supabase Dashboard → Authentication → Email Templates
-- 2. For each template type (Confirm signup, Magic Link, Reset Password, etc.)
-- 3. Copy the HTML from above (between /* and */)
-- 4. Paste into the "Body" field
-- 5. Update the Subject line as specified
-- 6. Save changes
-- 
-- The dark mode CSS will automatically apply when users view emails
-- in dark mode on iOS Mail, Gmail, Outlook, and other modern email clients.
-- ============================================================================
