-- ============================================================================
-- SUPABASE AUTH EMAIL TEMPLATES - 2026 UPDATE
-- ============================================================================
-- Updated to match the new dashboard theme with soft reflection styling
-- Colors: Forest green (#384c37), Warm cream (#f4f0eb), Slate (#1e293b)
-- Logo: CDN hosted with link to promptandpause.com
-- Copyright: 2026
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
  <title>Confirm Your Email</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <!-- Header with Logo -->
          <tr>
            <td style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Confirm Your Email</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                Welcome to Prompt & Pause. We're excited to have you join our community of mindful reflection.
              </p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                Please confirm your email address to activate your account and start your reflection journey.
              </p>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Confirm Email Address
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0 0;">
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
-- TEMPLATE 2: INVITE USER
-- Subject: You're invited to join Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>You're Invited</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">You're Invited</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                You've been invited to join Prompt & Pause, a space for mindful reflection and personal growth.
              </p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                Click below to accept your invitation and create your account.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                If the button doesn't work, copy and paste this link:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
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
-- TEMPLATE 3: MAGIC LINK
-- Subject: Your sign-in link - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Your Sign-in Link</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Your Sign-in Link</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
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
                  <td style="background: linear-gradient(135deg, #f8f6f3 0%, #ffffff 100%); padding: 16px 20px; border-left: 3px solid #384c37; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      <strong style="color: #1e293b;">Security Notice:</strong> If you didn't request this link, please ignore this email.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0 0;">
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
-- TEMPLATE 4: CHANGE EMAIL ADDRESS
-- Subject: Confirm your new email - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Confirm Email Change</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Confirm Email Change</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                You requested to change your email address for your Prompt & Pause account.
              </p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                Click below to confirm this change and start using your new email address.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Confirm New Email
                </a>
              </div>
              
              <!-- Warning Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: #fffbeb; padding: 16px 20px; border-left: 3px solid #f59e0b; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #92400e; font-size: 14px; line-height: 1.5;">
                      <strong>Didn't make this change?</strong> Contact support immediately to secure your account.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
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
-- TEMPLATE 5: RESET PASSWORD
-- Subject: Reset your password - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Reset Your Password</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Reset Your Password</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                We received a request to reset your password for your Prompt & Pause account.
              </p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 32px 0;">
                Click the button below to create a new password.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .ConfirmationURL }}" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Reset Password
                </a>
              </div>
              
              <!-- Security Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f8f6f3 0%, #ffffff 100%); padding: 16px 20px; border-left: 3px solid #384c37; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      <strong style="color: #1e293b;">Security Notice:</strong> If you didn't request this reset, please ignore this email and your password will remain unchanged.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .ConfirmationURL }}" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .ConfirmationURL }}</a>
              </p>
              
              <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0 0;">
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
-- TEMPLATE 6: REAUTHENTICATION
-- Subject: Confirm your identity - Prompt & Pause
-- ============================================================================

/*
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="x-apple-disable-message-reformatting">
  <title>Confirm Your Identity</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; margin: 0; padding: 0; background: #f4f0eb;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background: #f4f0eb; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);">
          <tr>
            <td style="text-align: center; padding: 32px 20px 24px 20px; background: linear-gradient(180deg, #ffffff 0%, #f4f0eb 100%);">
              <a href="https://promptandpause.com" target="_blank" rel="noopener noreferrer" style="text-decoration: none;">
                <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" alt="Prompt & Pause" style="height: 48px; width: auto;" />
              </a>
              <div style="width: 80px; height: 2px; background: linear-gradient(90deg, transparent, #384c37, transparent); margin: 16px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>
          
          <tr>
            <td style="padding: 40px 32px;">
              <h1 style="color: #384c37; font-size: 26px; margin: 0 0 20px 0; font-weight: 700; text-align: center; letter-spacing: -0.02em;">Confirm Your Identity</h1>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 0 0 16px 0;">
                For your security, we need to verify your identity before proceeding with this action.
              </p>
              
              <p style="color: #475569; font-size: 14px; line-height: 1.6; margin: 0 0 8px 0;">
                <strong>Email:</strong> {{ .Email }}
              </p>
              
              <p style="color: #475569; font-size: 15px; line-height: 1.65; margin: 24px 0 32px 0;">
                Click the button below to confirm it's you.
              </p>
              
              <div style="text-align: center; margin: 32px 0;">
                <a href="{{ .SiteURL }}/verify?token={{ .Token }}&type=recovery" style="display: inline-block; background: linear-gradient(135deg, #384c37 0%, #4a6349 100%); color: #ffffff; padding: 16px 44px; text-decoration: none; border-radius: 10px; font-weight: 600; font-size: 15px; letter-spacing: 0.02em; box-shadow: 0 4px 14px rgba(56, 76, 55, 0.25);">
                  Verify Identity
                </a>
              </div>
              
              <!-- Info Notice -->
              <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin: 24px 0;">
                <tr>
                  <td style="background: linear-gradient(135deg, #f8f6f3 0%, #ffffff 100%); padding: 16px 20px; border-left: 3px solid #384c37; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.5;">
                      <strong style="color: #1e293b;">Why?</strong> This extra step helps keep your account secure.
                    </p>
                  </td>
                </tr>
              </table>
              
              <p style="color: #94a3b8; font-size: 13px; line-height: 1.6; margin: 32px 0 0 0;">
                Link not working? Copy and paste this URL:<br>
                <a href="{{ .SiteURL }}/verify?token={{ .Token }}&type=recovery" style="color: #384c37; word-break: break-all; text-decoration: underline;">{{ .SiteURL }}/verify?token={{ .Token }}&type=recovery</a>
              </p>
              
              <p style="color: #94a3b8; font-size: 13px; margin: 16px 0 0 0;">
                This link will expire in 30 minutes.
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
-- HOW TO APPLY THESE TEMPLATES
-- ============================================================================
-- 
-- 1. Go to Supabase Dashboard: https://app.supabase.com
-- 2. Select your project
-- 3. Navigate to: Authentication → Email Templates
-- 4. For each template type:
--    a. Click on the template name
--    b. Copy the HTML from the corresponding section above (between /* and */)
--    c. Paste into the HTML editor
--    d. Update the subject line as noted
--    e. Click Save
-- 5. Test each auth flow to verify emails are sent correctly
--
-- DESIGN NOTES:
-- - Soft cream background (#f4f0eb) matching dashboard
-- - Forest green accent (#384c37) for headings and buttons
-- - Rounded corners (16px) for modern look
-- - Subtle shadows for depth
-- - Logo links to promptandpause.com homepage
-- - Copyright updated to 2026
-- - Clean, professional typography using system fonts
-- ============================================================================
