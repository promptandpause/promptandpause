import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { 
  getTemplate, 
  updateTemplate, 
  deleteTemplate,
  updateCustomization 
} from '@/lib/services/emailTemplateService'
import { bustCustomizationCache } from '@/lib/services/emailService'

/**
 * GET /api/admin/email-templates/[id]
 * Get a single email template by ID with its customization
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

    // Fetch template
    const result = await getTemplate(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 404 })
    }

    return NextResponse.json({ template: result.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * PUT /api/admin/email-templates/[id]
 * Update email template metadata or customization
 */
export async function PUT(
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
    const { type, ...data } = body

    // Determine update type: 'metadata' or 'customization'
    if (type === 'customization') {
      // Validate color hex codes
      const colorFields = ['primary_color', 'secondary_color', 'background_color', 'button_text_color']
      for (const field of colorFields) {
        if (data[field] && !/^#[0-9A-Fa-f]{6}$/.test(data[field])) {
          return NextResponse.json(
            { error: `Invalid ${field}: must be a valid hex color (e.g., #667eea)` },
            { status: 400 }
          )
        }
      }

      // Validate logo URL if provided
      if (data.logo_url) {
        try {
          new URL(data.logo_url)
        } catch {
          return NextResponse.json(
            { error: 'Invalid logo_url: must be a valid URL' },
            { status: 400 }
          )
        }
      }

      // Update customization (automatically creates version snapshot)
      const result = await updateCustomization(params.id, data, user.id)
      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      // Get template to bust correct cache key
      const templateResult = await getTemplate(params.id)
      if (templateResult.success && templateResult.data) {
        bustCustomizationCache(templateResult.data.template_key)
      }

      return NextResponse.json({ customization: result.data })
    } else {
      // Update template metadata
      const result = await updateTemplate(params.id, data)

      if (!result.success) {
        return NextResponse.json({ error: result.error }, { status: 500 })
      }

      // Bust cache if template_key changed
      if (data.template_key) {
        bustCustomizationCache(data.template_key)
      }

      return NextResponse.json({ template: result.data })
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/email-templates/[id]
 * Soft delete (deactivate) an email template
 */
export async function DELETE(
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

    // Get template first to bust cache
    const templateResult = await getTemplate(params.id)
    if (templateResult.success && templateResult.data) {
      bustCustomizationCache(templateResult.data.template_key)
    }

    // Soft delete template
    const result = await deleteTemplate(params.id)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ message: 'Template deactivated successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
