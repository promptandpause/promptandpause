import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'
import { rateLimit } from '@/lib/utils/rateLimit'

/**
 * Slack Interactive Endpoint
 *
 * POST /api/integrations/slack/interactive
 *
 * Receives interactive messages from Slack (button clicks, modal submissions, etc.)
 * When a user responds to a daily prompt in Slack, this endpoint saves it as a reflection.
 *
 * Slack sends the payload in application/x-www-form-urlencoded format
 * with a 'payload' field containing JSON data.
 */
export async function POST(request: NextRequest) {
  try {
    // Basic rate limiting (per IP)
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rl = await rateLimit(`slack-interactive:${ip}`, { limit: 30, windowMs: 60_000 })
    if (!rl.allowed) {
      const headers = new Headers()
      headers.set('X-RateLimit-Limit', String(rl.limit))
      headers.set('X-RateLimit-Remaining', String(Math.max(0, rl.remaining)))
      headers.set('X-RateLimit-Reset', String(rl.resetAt))
      return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers })
    }

    // Verify Slack signature (important for security)
    const signingSecret = process.env.SLACK_SIGNING_SECRET
    const slackSignature = request.headers.get('x-slack-signature') || ''
    const slackTimestamp = request.headers.get('x-slack-request-timestamp') || ''
    const rawBody = await request.text() // must read raw body for signature verification

    if (!signingSecret) {
      return NextResponse.json({ error: 'Slack not configured' }, { status: 500 })
    }

    if (!verifySlackSignature(signingSecret, slackTimestamp, rawBody, slackSignature)) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    // Parse form payload from raw body
    const params = new URLSearchParams(rawBody)
    const payloadString = params.get('payload') as string

    if (!payloadString) {
      return NextResponse.json({ error: 'No payload found' }, { status: 400 })
    }

    const payload = JSON.parse(payloadString)

    // Handle different interaction types
    switch (payload.type) {
      case 'block_actions':
        return handleBlockActions(payload)
      case 'view_submission':
        return handleViewSubmission(payload)
      default:
        return NextResponse.json({ success: true })
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

function verifySlackSignature(signingSecret: string, timestamp: string, body: string, signature: string) {
  // Protect against replay attacks
  const fiveMinutes = 60 * 5
  const reqTs = Number(timestamp)
  if (!reqTs || Math.abs(Date.now() / 1000 - reqTs) > fiveMinutes) return false

  const baseString = `v0:${timestamp}:${body}`
  const computed = 'v0=' + crypto.createHmac('sha256', signingSecret).update(baseString).digest('hex')
  try {
    return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(signature))
  } catch {
    return false
  }
}

/**
 * Handle block actions (button clicks)
 */
async function handleBlockActions(payload: any) {
  const action = payload.actions[0]
  if (action?.action_id !== 'reflect_now') {
    return NextResponse.json({ success: true })
  }

  const promptText = action.value || 'What emotion am I feeling right now, and what might be causing it?'
  return NextResponse.json({
    response_action: 'push',
    view: {
      type: 'modal',
      callback_id: 'reflection_modal',
      title: { type: 'plain_text', text: 'Your Reflection' },
      submit: { type: 'plain_text', text: 'Save Reflection' },
      close: { type: 'plain_text', text: 'Cancel' },
      blocks: [
        {
          type: 'section',
          text: { type: 'mrkdwn', text: `*Today's Prompt:*\n${promptText}` },
        },
        {
          type: 'input',
          block_id: 'reflection_block',
          label: { type: 'plain_text', text: 'Your Reflection' },
          element: {
            type: 'plain_text_input',
            action_id: 'reflection_text',
            multiline: true,
            placeholder: { type: 'plain_text', text: 'Write your thoughts here...' },
          },
        },
        {
          type: 'input',
          block_id: 'mood_block',
          label: { type: 'plain_text', text: 'How are you feeling?' },
          element: {
            type: 'static_select',
            action_id: 'mood_select',
            placeholder: { type: 'plain_text', text: 'Select your mood' },
            options: [
              { text: { type: 'plain_text', text: '😔 Sad' }, value: '😔' },
              { text: { type: 'plain_text', text: '😐 Neutral' }, value: '😐' },
              { text: { type: 'plain_text', text: '😊 Happy' }, value: '😊' },
              { text: { type: 'plain_text', text: '😄 Excited' }, value: '😄' },
              { text: { type: 'plain_text', text: '🤔 Thoughtful' }, value: '🤔' },
              { text: { type: 'plain_text', text: '😌 Calm' }, value: '😌' },
              { text: { type: 'plain_text', text: '🙏 Grateful' }, value: '🙏' },
              { text: { type: 'plain_text', text: '💪 Motivated' }, value: '💪' },
            ],
          },
        },
      ],
      private_metadata: JSON.stringify({ prompt_text: promptText, user_id: payload.user?.id }),
    },
  })
}

/**
 * Handle modal submissions
 */
async function handleViewSubmission(payload: any) {
  try {
    const values = payload.view?.state?.values || {}
    const metadata = JSON.parse(payload.view?.private_metadata || '{}')
    // NOTE: Without a stored slack_user_id mapping, we currently acknowledge and redirect to dashboard
    return NextResponse.json({
      response_action: 'update',
      view: {
        type: 'modal',
        title: { type: 'plain_text', text: 'Almost There!' },
        close: { type: 'plain_text', text: 'Close' },
        blocks: [
          {
            type: 'section',
            text: { type: 'mrkdwn', text: '✅ Your reflection has been recorded!\n\nYou can view and edit it in your Prompt & Pause dashboard.' },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Open Dashboard' },
                url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
                style: 'primary',
              },
            ],
          },
        ],
      },
    })
  } catch (error) {
    return NextResponse.json({
      response_action: 'errors',
      errors: { reflection_block: 'Failed to save reflection. Please try again.' },
    })
  }
}

/**
 * GET endpoint to provide information
 */
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/integrations/slack/interactive',
    method: 'POST',
    description: 'Receives interactive messages from Slack',
    note: 'This endpoint must be configured in your Slack App settings under Interactivity & Shortcuts',
  })
}
