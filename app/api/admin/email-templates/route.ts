import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getAllTemplates, createTemplate } from '@/lib/services/emailTemplateService'
import { EmailTemplateCategory } from '@/lib/types/emailTemplate'

/**
 * GET /api/admin/email-templates
 * List all email templates with optional category filter
 */
export async function GET(request: NextRequest) {
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

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const category = searchParams.get('category') as EmailTemplateCategory | null

    // Fetch templates
    const result = await getAllTemplates(category || undefined)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ templates: result.data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

/**
 * POST /api/admin/email-templates
 * Create a new email template
 */
export async function POST(request: NextRequest) {
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

    // Parse and validate request body
    const body = await request.json()
    const { template_key, name, description, subject_template, variables, category } = body

    // Validation
    if (!template_key || !name || !subject_template || !variables || !category) {
      return NextResponse.json(
        { error: 'Missing required fields: template_key, name, subject_template, variables, category' },
        { status: 400 }
      )
    }

    if (!Array.isArray(variables)) {
      return NextResponse.json(
        { error: 'Variables must be an array' },
        { status: 400 }
      )
    }

    const validCategories = ['transactional', 'engagement', 'support', 'notification']
    if (!validCategories.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${validCategories.join(', ')}` },
        { status: 400 }
      )
    }

    // Create template
    const result = await createTemplate({
      template_key,
      name,
      description,
      subject_template,
      variables,
      category,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ template: result.data }, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
