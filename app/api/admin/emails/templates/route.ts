import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth, getEmailTemplates } from '@/lib/services/adminService'

export async function GET(request: NextRequest) {
  try {
    // Get user from Supabase auth
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
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
    console.error('Error in GET /api/admin/emails/templates:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
