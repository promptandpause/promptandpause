import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import { sendAnnouncementEmail } from '@/lib/services/emailService'
import { withRateLimit } from '@/lib/security/rateLimit'

export async function POST(request: NextRequest) {
  try {
    const rateLimitResult = await withRateLimit(request, 'admin')
    if (!rateLimitResult.allowed) return rateLimitResult.response!

    const { templateKey, subject, contentHtml, audience } = await request.json()

    if (!templateKey || !subject || !contentHtml || !audience) {
      return NextResponse.json({ error: 'templateKey, subject, contentHtml, and audience are required' }, { status: 400 })
    }

    const supabase = createServiceRoleClient()

    // Fetch recipients based on audience filter
    let query = supabase.from('profiles').select('id, email, full_name')

    if (audience === 'premium') {
      query = query.eq('subscription_status', 'premium')
    } else if (audience === 'free') {
      query = query.or('subscription_status.is.null,subscription_status.eq.free')
    }
    // 'all' — no filter

    const { data: profiles, error: profilesError } = await query

    if (profilesError) {
      console.error('[Broadcast] Failed to fetch profiles:', profilesError)
      return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({ error: 'No users found for the selected audience' }, { status: 404 })
    }

    const recipients = profiles.map((p: any) => ({
      email: p.email,
      userId: p.id,
      name: p.full_name || undefined,
    }))

    const result = await sendAnnouncementEmail({
      templateKey,
      subject,
      contentHtml,
      recipients,
    })

    return NextResponse.json({
      success: true,
      total: recipients.length,
      sent: result.sent,
      failed: result.failed,
      errors: result.errors,
      audience,
    })
  } catch (error: any) {
    console.error('[Broadcast] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}