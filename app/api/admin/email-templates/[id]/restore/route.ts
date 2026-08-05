import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { restoreToDefault, getTemplate } from '@/lib/services/emailTemplateService'
import { bustCustomizationCache } from '@/lib/services/emailService'
import { getAdminUser } from '@/lib/services/adminAuth'

/**
 * POST /api/admin/email-templates/[id]/restore
 * Restore template to default customization
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const user = await getAdminUser()
    
    if (!user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const auth = await checkAdminAuth(user.email)
    if (!auth.isAdmin) {
      return NextResponse.json({ error: auth.error }, { status: 403 })
    }

    const { id } = await params

    // Restore to defaults
    const result = await restoreToDefault(id, user.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // Bust cache
    const templateResult = await getTemplate(id)
    if (templateResult.success && templateResult.data) {
      bustCustomizationCache(templateResult.data.template_key)
    }

    return NextResponse.json({
      success: true,
      message: 'Template restored to default customization',
      customization: result.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
