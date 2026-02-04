import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('admin_session')?.value

    if (sessionToken) {
      const supabase = createServiceRoleClient()
      const sessionHash = crypto.createHash('sha256').update(sessionToken).digest('hex')
      
      // Delete session from database
      await supabase
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionHash)
    }

    // Clear cookie
    const response = NextResponse.json({ success: true })
    response.cookies.delete('admin_session')

    return response

  } catch (error: any) {
    console.error('[Admin Logout] Error:', error)
    const response = NextResponse.json({ success: true })
    response.cookies.delete('admin_session')
    return response
  }
}
