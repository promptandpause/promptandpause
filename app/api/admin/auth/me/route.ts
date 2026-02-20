import { NextRequest, NextResponse } from 'next/server'
import { getAuthUser } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'

export async function GET(_request: NextRequest) {
  try {
    const user = await getAuthUser()

    if (!user) {
      return NextResponse.json({ isAuthenticated: false, isAdmin: false }, { status: 200 })
    }

    const adminAuth = await checkAdminAuth(user.email || undefined)

    return NextResponse.json({
      isAuthenticated: true,
      isAdmin: adminAuth.isAdmin,
      email: user.email,
    })
  } catch (_error) {
    return NextResponse.json({ isAuthenticated: false, isAdmin: false }, { status: 200 })
  }
}
