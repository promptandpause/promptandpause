import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    const supabase = createServiceRoleClient()

    // Find session by hashed token
    const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
    const { data: session, error: sessionError } = await supabase
      .from('admin_sessions')
      .select('*, admin_users!inner(email, full_name, role, is_active)')
      .eq('session_token', sessionHash)
      .single()

    if (sessionError || !session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }

    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      // Delete expired session
      await supabase.from('admin_sessions').delete().eq('id', session.id)
      return NextResponse.json({ authenticated: false, error: 'Session expired' }, { status: 401 })
    }

    // Check if admin user is still active
    if (!session.admin_users.is_active) {
      return NextResponse.json({ authenticated: false, error: 'Account inactive' }, { status: 401 })
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        email: session.admin_users.email,
        fullName: session.admin_users.full_name,
        role: session.admin_users.role,
      },
    })

  } catch (error: any) {
    console.error('[Admin Check Session] Error:', error)
    return NextResponse.json({ authenticated: false, error: 'Internal error' }, { status: 500 })
  }
}
