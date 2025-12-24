import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { restoreToDefault, getTemplate } from '@/lib/services/emailTemplateService'
import { bustCustomizationCache } from '@/lib/services/emailService'

/**
 * POST /api/admin/email-templates/[id]/restore
 * Restore template to default customization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    // Restore to defaults
    const result = await restoreToDefault(params.id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Bust cache
    const templateResult = await getTemplate(params.id)
    if (templateResult.success && templateResult.data) {
      bustCustomizationCache(templateResult.data.template_key)
    }

    return NextResponse.json({
      success: true,
      message: 'Template restored to default customization',
      customization: result.data,
    })
  } catch (error: any) {
    console.error(`Error in POST /api/admin/email-templates/${params.id}/restore:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
