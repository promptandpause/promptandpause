import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getTemplateVersions, rollbackToVersion, getTemplate } from '@/lib/services/emailTemplateService'
import { bustCustomizationCache } from '@/lib/services/emailService'

/**
 * GET /api/admin/email-templates/[id]/versions
 * Get version history for a template
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    
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

    // Fetch version history
    const result = await getTemplateVersions(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ versions: result.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/email-templates/[id]/versions
 * Rollback to a specific version
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    
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

    // Parse request body
    const body = await request.json()
    const { versionId } = body

    if (!versionId) {
      return NextResponse.json(
        { error: 'versionId is required' },
        { status: 400 }
      )
    }

    // Rollback to version
    const result = await rollbackToVersion(params.id, versionId, user.id)

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
      message: 'Rollback successful',
      customization: result.data,
    })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
