import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'

type ResendWebhookEvent = {
  type: string
  created_at: string
  data: {
    created_at?: string
    email_id?: string
    to?: string[]
    subject?: string
    tags?: Record<string, any>
    bounce?: {
      message?: string
      subType?: string
      type?: string
    }
  }
}

function toIsoOrNull(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

export async function POST(req: NextRequest) {
  try {
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET
    if (!webhookSecret) {
      return NextResponse.json({ error: 'RESEND_WEBHOOK_SECRET is not configured' }, { status: 500 })
    }

    const payload = await req.text()

    const resend = new Resend(process.env.RESEND_API_KEY)

    let event: ResendWebhookEvent
    try {
      event = resend.webhooks.verify({
        payload,
        headers: {
          id: req.headers.get('svix-id') || '',
          timestamp: req.headers.get('svix-timestamp') || '',
          signature: req.headers.get('svix-signature') || '',
        },
        webhookSecret,
      }) as ResendWebhookEvent
    } catch (error: any) {
      logger.warn('resend_webhook_invalid_signature', { error: error?.message })
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 })
    }

    const emailId = event?.data?.email_id
    if (!emailId) {
      return NextResponse.json({ ok: true })
    }

    const eventCreatedAt = toIsoOrNull(event.created_at) || new Date().toISOString()

    const supabase = createServiceRoleClient()

    const update: Record<string, any> = {
      metadata: event.data.tags || null,
    }

    if (event.type === 'email.delivered') {
      update.status = 'delivered'
      update.delivered_at = eventCreatedAt
      update.error_message = null
    } else if (event.type === 'email.opened') {
      update.status = 'opened'
      update.opened_at = eventCreatedAt
      update.delivered_at = eventCreatedAt
    } else if (event.type === 'email.clicked') {
      update.status = 'clicked'
      update.clicked_at = eventCreatedAt
      update.delivered_at = eventCreatedAt
    } else if (event.type === 'email.bounced') {
      update.status = 'bounced'
      update.bounce_reason = event.data.bounce?.message || null
      update.error_message = event.data.bounce?.message || null
    } else if (event.type === 'email.failed') {
      update.status = 'failed'
    } else if (event.type === 'email.delivery_delayed') {
      update.status = 'delivery_delayed'
    } else {
      return NextResponse.json({ ok: true })
    }

    const { data: updatedRows, error: updateError } = await supabase
      .from('email_logs')
      .update(update)
      .eq('provider_message_id', emailId)
      .select('id')

    if (updateError) {
      logger.error('resend_webhook_update_email_logs_error', { error: updateError, emailId, eventType: event.type })
      return NextResponse.json({ error: 'Failed to update email logs' }, { status: 500 })
    }

    if (!updatedRows || updatedRows.length === 0) {
      const toEmail = event.data.to?.[0] || null
      const subject = event.data.subject || null
      const templateName = (event.data.tags && (event.data.tags as any).category) || 'unknown'
      const sentAt = toIsoOrNull(event.data.created_at) || eventCreatedAt

      const { error: insertError } = await supabase
        .from('email_logs')
        .insert({
          recipient_email: toEmail || 'unknown',
          subject,
          template_name: templateName,
          provider: 'resend',
          status: update.status || 'unknown',
          provider_message_id: emailId,
          error_message: update.error_message || null,
          delivered_at: update.delivered_at || null,
          opened_at: update.opened_at || null,
          clicked_at: update.clicked_at || null,
          bounce_reason: update.bounce_reason || null,
          metadata: update.metadata || null,
          sent_at: sentAt,
        })

      if (insertError) {
        logger.error('resend_webhook_insert_email_logs_error', { error: insertError, emailId, eventType: event.type })
        return NextResponse.json({ error: 'Failed to insert email log' }, { status: 500 })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error: any) {
    logger.error('resend_webhook_unexpected_error', { error })
    return NextResponse.json({ error: error?.message || 'Internal server error' }, { status: 500 })
  }
}
