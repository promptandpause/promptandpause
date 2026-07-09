export interface ProfileThemePreset {
  id: string
  name: string
  description: string
  accent_color: string
  bg_gradient_start: string
  bg_gradient_end: string
  font_heading: string
  font_body: string
  border_style: 'rounded' | 'squared' | 'retro'
  show_sparkles: boolean
  show_cursor_trail: boolean
  preview: {
    cover_gradient: string
    card_bg: string
    text_color: string
  }
}

export const profileThemePresets: ProfileThemePreset[] = [
  {
    id: 'default',
    name: 'Calm',
    description: 'Soft, muted elegance',
    accent_color: '#A8D5BA',
    bg_gradient_start: '#F5F3EE',
    bg_gradient_end: '#EDE7F6',
    font_heading: 'Geist Sans',
    font_body: 'Geist Sans',
    border_style: 'rounded',
    show_sparkles: false,
    show_cursor_trail: false,
    preview: { cover_gradient: 'linear-gradient(135deg, #A8D5BA22, #C4B5E044)', card_bg: '#FFFFFF', text_color: '#3D3D3D' },
  },
  {
    id: 'y2k_bubble',
    name: 'Y2K Bubble',
    description: 'Playful, shiny, nostalgic',
    accent_color: '#FF6B9D',
    bg_gradient_start: '#FFE4F0',
    bg_gradient_end: '#E0D4FF',
    font_heading: 'Geist Sans',
    font_body: 'Geist Sans',
    border_style: 'rounded',
    show_sparkles: true,
    show_cursor_trail: true,
    preview: { cover_gradient: 'linear-gradient(135deg, #FF6B9D44, #C084FC44)', card_bg: '#FFF5F8', text_color: '#4A1942' },
  },
  {
    id: 'grunge',
    name: 'Grunge',
    description: 'Dark, moody, textured',
    accent_color: '#8B5CF6',
    bg_gradient_start: '#1A1A2E',
    bg_gradient_end: '#16213E',
    font_heading: 'Geist Sans',
    font_body: 'Geist Sans',
    border_style: 'squared',
    show_sparkles: false,
    show_cursor_trail: false,
    preview: { cover_gradient: 'linear-gradient(135deg, #1A1A2E, #16213E)', card_bg: '#1E1E32', text_color: '#E0E0FF' },
  },
  {
    id: 'neon_noir',
    name: 'Neon Noir',
    description: 'Cyberpunk meets reflection',
    accent_color: '#FF007F',
    bg_gradient_start: '#0D0221',
    bg_gradient_end: '#150534',
    font_heading: 'Geist Mono',
    font_body: 'Geist Sans',
    border_style: 'squared',
    show_sparkles: true,
    show_cursor_trail: true,
    preview: { cover_gradient: 'linear-gradient(135deg, #FF007F33, #00F5FF33)', card_bg: '#0D0221', text_color: '#E0E0FF' },
  },
  {
    id: 'soft_core',
    name: 'Soft Core',
    description: 'Pastels, warmth, gentle',
    accent_color: '#F472B6',
    bg_gradient_start: '#FFF1F2',
    bg_gradient_end: '#FCE7F3',
    font_heading: 'Geist Sans',
    font_body: 'Geist Sans',
    border_style: 'rounded',
    show_sparkles: true,
    show_cursor_trail: false,
    preview: { cover_gradient: 'linear-gradient(135deg, #F472B644, #A78BFA44)', card_bg: '#FFFFFF', text_color: '#831843' },
  },
  {
    id: 'retro_web',
    name: 'Retro Web',
    description: 'Old internet charm',
    accent_color: '#2563EB',
    bg_gradient_start: '#F0F0FF',
    bg_gradient_end: '#E8E8FF',
    font_heading: 'Geist Mono',
    font_body: 'Geist Sans',
    border_style: 'retro',
    show_sparkles: false,
    show_cursor_trail: true,
    preview: { cover_gradient: 'linear-gradient(135deg, #2563EB22, #7C3AED22)', card_bg: '#F8F8FF', text_color: '#1E3A5F' },
  },
  {
    id: 'cyber_yami',
    name: 'Cyber Yami',
    description: 'Dark, glitchy, edge',
    accent_color: '#00FF88',
    bg_gradient_start: '#0A0A0A',
    bg_gradient_end: '#1A0A2E',
    font_heading: 'Geist Mono',
    font_body: 'Geist Mono',
    border_style: 'squared',
    show_sparkles: true,
    show_cursor_trail: true,
    preview: { cover_gradient: 'linear-gradient(135deg, #00FF8833, #FF00FF33)', card_bg: '#0A0A0A', text_color: '#00FF88' },
  },
]

export function getThemeById(id: string): ProfileThemePreset {
  return profileThemePresets.find(t => t.id === id) || profileThemePresets[0]
}

export function getThemeCSS(theme: ProfileThemePreset, isDark: boolean): Record<string, string> {
  return {
    '--profile-accent': theme.accent_color,
    '--profile-bg-start': theme.bg_gradient_start,
    '--profile-bg-end': theme.bg_gradient_end,
    '--profile-font-heading': theme.font_heading,
    '--profile-font-body': theme.font_body,
    '--profile-border-radius': theme.border_style === 'rounded' ? '16px' : theme.border_style === 'squared' ? '4px' : '8px',
    '--profile-card-bg': isDark ? `color-mix(in srgb, ${theme.accent_color} 8%, #141820)` : '#FFFFFF',
    '--profile-card-border': isDark ? `color-mix(in srgb, ${theme.accent_color} 15%, transparent)` : '#E8E5DE',
  }
}
