/**
 * Email Template Service
 * 
 * Manages database-backed email templates with customization and version control.
 * Provides CRUD operations, versioning, and rollback functionality.
 */

import { createServiceRoleClient } from '@/lib/supabase/server'
import { logger } from '@/lib/utils/logger'
import {
  EmailTemplate,
  EmailTemplateCustomization,
  EmailTemplateVersion,
  EmailTemplateWithCustomization,
  CreateEmailTemplateDTO,
  UpdateEmailTemplateDTO,
  UpdateEmailCustomizationDTO,
  EmailTemplateServiceResponse,
  DEFAULT_EMAIL_CUSTOMIZATION,
  EmailTemplateCategory,
} from '@/lib/types/emailTemplate'

// =============================================================================
// CRUD OPERATIONS
// =============================================================================

/**
 * Get all email templates, optionally filtered by category
 */
export async function getAllTemplates(
  category?: EmailTemplateCategory
): Promise<EmailTemplateServiceResponse<EmailTemplateWithCustomization[]>> {
  try {
    const supabase = createServiceRoleClient()

    let query = supabase
      .from('email_templates')
      .select(`
        *,
        customization:email_template_customizations(*)
      `)
      .eq('is_active', true)
      .order('category', { ascending: true })
      .order('name', { ascending: true })

    if (category) {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      logger.error('email_template_fetch_error', { error, category })
      return { success: false, error: error.message }
    }

    // Transform data to include customization
    const templates = data.map((template: any) => ({
      ...template,
      customization: Array.isArray(template.customization)
        ? template.customization[0] || null
        : template.customization,
    }))

    return { success: true, data: templates }
  } catch (error) {
    logger.error('email_template_unexpected_error', { error, category })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a single email template by ID with its customization
 */
export async function getTemplate(
  id: string
): Promise<EmailTemplateServiceResponse<EmailTemplateWithCustomization>> {
  try {
    const supabase = createServiceRoleClient()

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (templateError) {
      logger.error('email_template_fetch_error', { error: templateError, id })
      return { success: false, error: templateError.message }
    }

    // Fetch customization
    const { data: customization, error: customError } = await supabase
      .from('email_template_customizations')
      .select('*')
      .eq('template_id', id)
      .maybeSingle()

    if (customError && customError.code !== 'PGRST116') {
      // PGRST116 = no rows returned, which is acceptable
      logger.error('email_customization_fetch_error', { error: customError, id })
    }

    return {
      success: true,
      data: { ...template, customization: customization || null },
    }
  } catch (error) {
    logger.error('email_template_unexpected_error', { error, id })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Get a template by its unique key (for runtime lookups)
 */
export async function getTemplateByKey(
  templateKey: string
): Promise<EmailTemplateServiceResponse<EmailTemplateWithCustomization>> {
  try {
    const supabase = createServiceRoleClient()

    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('template_key', templateKey)
      .eq('is_active', true)
      .single()

    if (templateError) {
      logger.error('email_template_fetch_by_key_error', { error: templateError, templateKey })
      return { success: false, error: templateError.message }
    }

    // Fetch customization
    const { data: customization } = await supabase
      .from('email_template_customizations')
      .select('*')
      .eq('template_id', template.id)
      .maybeSingle()

    return {
      success: true,
      data: { ...template, customization: customization || null },
    }
  } catch (error) {
    logger.error('email_template_unexpected_error', { error, templateKey })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a new email template with default customization
 */
export async function createTemplate(
  data: CreateEmailTemplateDTO
): Promise<EmailTemplateServiceResponse<EmailTemplate>> {
  try {
    const supabase = createServiceRoleClient()

    // Insert template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .insert({
        template_key: data.template_key,
        name: data.name,
        description: data.description || null,
        subject_template: data.subject_template,
        variables: data.variables,
        category: data.category,
      })
      .select()
      .single()

    if (templateError) {
      logger.error('email_template_create_error', { error: templateError, data })
      return { success: false, error: templateError.message }
    }

    // Create default customization
    const { error: customError } = await supabase
      .from('email_template_customizations')
      .insert({
        template_id: template.id,
        ...DEFAULT_EMAIL_CUSTOMIZATION,
      })

    if (customError) {
      logger.error('email_customization_create_error', { error: customError, templateId: template.id })
      // Don't fail template creation if customization fails
    }

    logger.info('email_template_created', { templateId: template.id, templateKey: data.template_key })
    return { success: true, data: template }
  } catch (error) {
    logger.error('email_template_create_unexpected_error', { error, data })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Update email template metadata
 */
export async function updateTemplate(
  id: string,
  data: UpdateEmailTemplateDTO
): Promise<EmailTemplateServiceResponse<EmailTemplate>> {
  try {
    const supabase = createServiceRoleClient()

    const { data: template, error } = await supabase
      .from('email_templates')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      logger.error('email_template_update_error', { error, id, data })
      return { success: false, error: error.message }
    }

    logger.info('email_template_updated', { templateId: id })
    return { success: true, data: template }
  } catch (error) {
    logger.error('email_template_update_unexpected_error', { error, id, data })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Soft delete email template (set is_active to false)
 */
export async function deleteTemplate(id: string): Promise<EmailTemplateServiceResponse<void>> {
  try {
    const supabase = createServiceRoleClient()

    const { error } = await supabase
      .from('email_templates')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      logger.error('email_template_delete_error', { error, id })
      return { success: false, error: error.message }
    }

    logger.info('email_template_deleted', { templateId: id })
    return { success: true }
  } catch (error) {
    logger.error('email_template_delete_unexpected_error', { error, id })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

// =============================================================================
// CUSTOMIZATION MANAGEMENT
// =============================================================================

/**
 * Update template customization and create version snapshot
 */
export async function updateCustomization(
  templateId: string,
  data: UpdateEmailCustomizationDTO,
  createdBy?: string
): Promise<EmailTemplateServiceResponse<EmailTemplateCustomization>> {
  try {
    const supabase = createServiceRoleClient()

    // Get current customization
    let { data: currentCustom } = await supabase
      .from('email_template_customizations')
      .select('*')
      .eq('template_id', templateId)
      .maybeSingle()

    // If no customization exists, create one with defaults
    if (!currentCustom) {
      const { data: newCustom, error: createError } = await supabase
        .from('email_template_customizations')
        .insert({
          template_id: templateId,
          ...DEFAULT_EMAIL_CUSTOMIZATION,
        })
        .select()
        .single()

      if (createError || !newCustom) {
        logger.error('email_customization_create_error', { error: createError, templateId })
        return { success: false, error: 'Failed to create customization' }
      }
      currentCustom = newCustom
    }

    // Create version snapshot before updating
    await createTemplateVersion(templateId, currentCustom, createdBy, data.notes)

    // Update customization
    const { notes, ...updateData } = data
    const { data: updated, error } = await supabase
      .from('email_template_customizations')
      .update(updateData)
      .eq('id', currentCustom.id)
      .select()
      .single()

    if (error) {
      logger.error('email_customization_update_error', { error, templateId, data })
      return { success: false, error: error.message }
    }

    logger.info('email_customization_updated', { templateId })
    return { success: true, data: updated }
  } catch (error) {
    logger.error('email_customization_update_unexpected_error', { error, templateId, data })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Restore template to default customization
 */
export async function restoreToDefault(
  templateId: string,
  createdBy?: string
): Promise<EmailTemplateServiceResponse<EmailTemplateCustomization>> {
  return updateCustomization(
    templateId,
    {
      ...DEFAULT_EMAIL_CUSTOMIZATION,
      custom_css: null,
      custom_header_text: null,
      custom_footer_text: null,
      notes: 'Restored to default customization',
    },
    createdBy
  )
}

// =============================================================================
// VERSION CONTROL
// =============================================================================

/**
 * Get version history for a template
 */
export async function getTemplateVersions(
  templateId: string
): Promise<EmailTemplateServiceResponse<EmailTemplateVersion[]>> {
  try {
    const supabase = createServiceRoleClient()

    const { data, error } = await supabase
      .from('email_template_version_history')
      .select('*')
      .eq('template_id', templateId)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('email_template_versions_fetch_error', { error, templateId })
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    logger.error('email_template_versions_unexpected_error', { error, templateId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Create a version snapshot
 */
export async function createTemplateVersion(
  templateId: string,
  customization: EmailTemplateCustomization,
  createdBy?: string,
  notes?: string
): Promise<EmailTemplateServiceResponse<EmailTemplateVersion>> {
  try {
    const supabase = createServiceRoleClient()

    const snapshot = {
      logo_url: customization.logo_url,
      primary_color: customization.primary_color,
      secondary_color: customization.secondary_color,
      background_color: customization.background_color,
      button_text_color: customization.button_text_color,
      custom_header_text: customization.custom_header_text,
      custom_footer_text: customization.custom_footer_text,
    }

    const { data, error } = await supabase
      .from('email_template_version_history')
      .insert({
        template_id: templateId,
        changed_by: createdBy || 'system',
        change_type: 'customization',
        changes_json: snapshot,
        notes: notes || null,
      })
      .select()
      .single()

    if (error) {
      logger.error('email_template_version_create_error', { error, templateId })
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    logger.error('email_template_version_create_unexpected_error', { error, templateId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Rollback to a specific version
 */
export async function rollbackToVersion(
  templateId: string,
  versionId: string,
  createdBy?: string
): Promise<EmailTemplateServiceResponse<EmailTemplateCustomization>> {
  try {
    const supabase = createServiceRoleClient()

    // Get the version snapshot
    const { data: version, error: versionError } = await supabase
      .from('email_template_version_history')
      .select('*')
      .eq('id', versionId)
      .eq('template_id', templateId)
      .single()

    if (versionError) {
      logger.error('email_template_version_fetch_error', { error: versionError, versionId })
      return { success: false, error: versionError.message }
    }

    // Apply the snapshot as current customization
    const snapshot = version.changes_json
    const result = await updateCustomization(
      templateId,
      {
        logo_url: snapshot.logo_url,
        primary_color: snapshot.primary_color,
        secondary_color: snapshot.secondary_color,
        background_color: snapshot.background_color,
        button_text_color: snapshot.button_text_color,
        custom_header_text: snapshot.custom_header_text,
        custom_footer_text: snapshot.custom_footer_text,
        notes: `Rolled back to version from ${new Date(version.created_at).toLocaleString()}`,
      },
      createdBy
    )

    if (result.success) {
      logger.info('email_template_rollback_success', { templateId, versionId })
    }

    return result
  } catch (error) {
    logger.error('email_template_rollback_unexpected_error', { error, templateId, versionId })
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}
