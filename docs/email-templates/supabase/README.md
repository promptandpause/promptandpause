# Supabase Auth Email Templates

Supabase Auth (GoTrue) sends its own emails for sign-up confirmation, password
reset, magic link, etc. Those are rendered outside our Resend / `emailService`
pipeline, so to brand them you have to paste the HTML into the Supabase
Dashboard.

## Why this exists

Every reference brand we aligned the lifecycle with — Stripe, Linear, Notion,
Apple — owns their security emails end-to-end. Supabase's built-in defaults
look functional but generic, and users read "password reset" emails with
heightened attention. A branded, calm template:

- builds trust (users recognise it as from us, not a third party)
- matches the tone of the rest of the lifecycle (welcome, getting started)
- halves support tickets about "is this email real?" phishing concerns

## Where to paste

Open the project dashboard:
https://supabase.com/dashboard/project/zcuymmvrohhdocrkjufk/auth/templates

| Supabase template     | File in this folder        | Also set subject to                            |
| --------------------- | -------------------------- | ---------------------------------------------- |
| Confirm signup        | `email_verification.html`  | `Confirm your email for Prompt & Pause`        |
| Reset password        | `password_reset.html`      | `Reset your Prompt & Pause password`           |

Both templates use the standard GoTrue variables:

- `{{ .ConfirmationURL }}` — the action link
- `{{ .Email }}` — the user's email

No other variables are required. Supabase will reject the save if the
`.ConfirmationURL` token is missing from confirmation templates.

## Updating copy

If you iterate the copy, keep the four invariants that make these templates
feel part of the product rather than a tacked-on security mail:

1. **No countdown urgency language.** Security emails should feel steady,
   not panicked. Say "this link is valid for 24 hours" once, in a muted
   paragraph. Don't bold it.
2. **Only one call-to-action button.** The action URL is the whole point.
3. **Single colour accent.** Re-use `#384c37` (brand forest-green) for the
   button. No secondary colours.
4. **Human sign-off.** The tone should match the `getting_started` email —
   "just reply to this email, a real person reads every message."

Never add promotional content to security emails. Ever.
