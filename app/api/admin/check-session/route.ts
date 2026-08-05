import { NextRequest, NextResponse } from 'next/server'
import { getAdminSession } from '@/lib/services/adminAuth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getAdminSession()

    if (!session) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
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
