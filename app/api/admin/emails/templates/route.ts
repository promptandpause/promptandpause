import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, getEmailTemplates } from '@/lib/services/adminService'
import { getAdminUser } from '@/lib/services/adminAuth'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const user = await getAdminUser()
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    // Get email templates
    const result = await getEmailTemplates()

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ templates: result.templates })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
