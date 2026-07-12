/**
 * Email Template Types
 * 
 * Types for database-backed email templates with customization and versioning support.
 */

export type EmailTemplateCategory = 'transactional' | 'engagement' | 'support' | 'notification'

export interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  subject_template: string
  variables: string[] // JSONB array stored as string[]
  category: EmailTemplateCategory
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailTemplateCustomization {
  id: string
  template_id: string
  logo_url: string | null
  primary_color: string
  secondary_color: string
  background_color: string
  button_text_color: string
  custom_css: string | null
  custom_header_text: string | null
  custom_footer_text: string | null
  version: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface EmailTemplateVersion {
  id: string
  template_id: string
  customization_snapshot: Record<string, any> // JSONB object
  created_by: string | null
  created_at: string
  notes: string | null
}

// Combined template with its active customization
export interface EmailTemplateWithCustomization extends EmailTemplate {
  customization: EmailTemplateCustomization | null
}

// DTO for creating a new template
export interface CreateEmailTemplateDTO {
  template_key: string
  name: string
  description?: string
  subject_template: string
  variables: string[]
  category: EmailTemplateCategory
}

// DTO for updating template metadata
export interface UpdateEmailTemplateDTO {
  name?: string
  description?: string
  subject_template?: string
  variables?: string[]
  category?: EmailTemplateCategory
  is_active?: boolean
}

// DTO for updating template customization
export interface UpdateEmailCustomizationDTO {
  logo_url?: string
  primary_color?: string
  secondary_color?: string
  background_color?: string
  button_text_color?: string
  custom_css?: string
  custom_header_text?: string
  custom_footer_text?: string
  notes?: string // For version history
}

// Service response types
export interface EmailTemplateServiceResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Default customization values - Twitter-like white/blue/black theme
export const DEFAULT_EMAIL_CUSTOMIZATION = {
  logo_url: 'https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg',
  primary_color: '#1d9bf0', // Twitter blue (main accent)
  secondary_color: '#4ab3f4', // Light blue
  background_color: '#f7f8fa', // Light gray background
  button_text_color: '#ffffff', // White text on buttons
} as const
