import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkAdminAuth } from '@/lib/services/adminService'
import { getTemplate } from '@/lib/services/emailTemplateService'

/**
 * POST /api/admin/email-templates/[id]/preview
 * Generate HTML preview with sample data
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

    // Get template
    const templateResult = await getTemplate(params.id)
    if (!templateResult.success || !templateResult.data) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = templateResult.data

    // Parse sample data from request
    const body = await request.json()
    const { sampleData = {}, customization } = body

    // Import the appropriate email generation function dynamically
    // This is a simplified preview - in production, you'd want to dynamically
    // generate HTML based on the template structure
    
    // For now, return template info with sample data applied to subject
    let previewSubject = template.subject_template || 'No Subject'
    
    // Replace variables in subject with sample data
    Object.entries(sampleData).forEach(([key, value]) => {
      if (previewSubject && value !== null && value !== undefined) {
        const regex = new RegExp(`{{${key}}}`, 'g')
        previewSubject = previewSubject.replace(regex, String(value))
      }
    })

    // Import professional template system for preview
    const { emailWrapper, contentSection, h1, h2, paragraph, infoBox, ctaButton, BRAND_COLORS } = await import('@/lib/services/emailTemplates')
    
    // Generate professional preview using new template system
    const previewContent = `
      ${h1(`${template.name} Preview`, { color: customization?.primary_color || BRAND_COLORS.primary })}
      
      ${infoBox(`
        <h3 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND_COLORS.textGray}; font-family: Rubik, sans-serif;">Subject</h3>
        <p style="margin: 0; font-size: 16px; color: ${BRAND_COLORS.textDark}; font-family: 'trebuchet ms', geneva;">${previewSubject}</p>
      `, BRAND_COLORS.backgroundSection)}
      
      ${Object.keys(sampleData).length > 0 ? infoBox(`
        <h3 style="margin: 0 0 12px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: ${BRAND_COLORS.textGray}; font-family: Rubik, sans-serif;">Sample Data</h3>
        ${Object.entries(sampleData).map(([key, value]) => `
          <p style="margin: 4px 0; font-size: 14px; color: ${BRAND_COLORS.textGray}; font-family: 'trebuchet ms', geneva;">
            <strong>${key}:</strong> ${value}
          </p>
        `).join('')}
      `, BRAND_COLORS.backgroundSection) : ''}
      
      ${customization?.custom_header_text ? infoBox(`
        <p style="margin: 0; color: ${BRAND_COLORS.primary}; font-size: 14px; font-family: 'trebuchet ms', geneva;">${customization.custom_header_text}</p>
      `, 'rgba(211, 157, 53, 0.1)') : ''}
      
      ${paragraph('This is a professional preview using our new template system. The actual email will contain the full template content with your customizations applied.', { align: 'center', fontSize: '14px', color: BRAND_COLORS.textGray })}
      
      ${customization?.custom_footer_text ? `
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" border="0" style="margin-top: 32px;">
          <tr>
            <td align="center" style="padding: 20px; border-top: 1px solid ${BRAND_COLORS.border};">
              <p style="margin: 0; color: ${BRAND_COLORS.textMuted}; font-size: 13px; font-family: 'trebuchet ms', geneva;">${customization.custom_footer_text}</p>
            </td>
          </tr>
        </table>
      ` : ''}
    `
    
    // Generate full professional email HTML
    const previewHTML = emailWrapper(
      contentSection(previewContent, customization?.background_color || BRAND_COLORS.backgroundLight),
      {
        preheader: `Preview of ${template.name}`,
        title: `${template.name} Preview`
      }
    )

    return NextResponse.json({
      html: previewHTML,
      subject: previewSubject,
      template_key: template.template_key,
    })
  } catch (error: any) {
    const params = await context.params
    console.error(`Error in POST /api/admin/email-templates/${params.id}/preview:`, error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
