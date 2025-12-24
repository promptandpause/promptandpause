/**
 * Theme-aware styling utility
 * Provides consistent light/dark theme classes across the application
 */

export type Theme = 'light' | 'dark'

interface ThemeStyles {
  // Background colors
  page: string
  card: string
  cardHover: string
  sidebar: string
  
  // Text colors
  text: {
    primary: string
    secondary: string
    tertiary: string
    inverse: string
  }
  
  // Border colors
  border: {
    default: string
    hover: string
    focus: string
  }
  
  // Input fields
  input: {
    background: string
    border: string
    text: string
    placeholder: string
    focus: string
  }
  
  // Buttons
  button: {
    primary: string
    secondary: string
    ghost: string
    ghostHover: string
  }
  
  // Special elements
  badge: string
  dropdown: string
  shadow: string
}

export const themeStyles: Record<Theme, ThemeStyles> = {
  light: {
    // Beige light theme
    page: '#F5F5DC',
    card: 'bg-white/90 border-gray-400',
    cardHover: 'hover:bg-white hover:shadow-xl',
    sidebar: 'bg-white/80 border-gray-300',
    
    text: {
      primary: 'text-gray-900',
      secondary: 'text-gray-700',
      tertiary: 'text-gray-600',
      inverse: 'text-white',
    },
    
    border: {
      default: 'border-gray-300',
      hover: 'hover:border-gray-400',
      focus: 'focus:border-blue-500',
    },
    
    input: {
      background: 'bg-white',
      border: 'border-2 border-gray-300',
      text: 'text-gray-900',
      placeholder: 'placeholder:text-gray-400',
      focus: 'focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
    },
    
    button: {
      primary: 'bg-white hover:bg-gray-50 border-2 border-gray-300 text-gray-900',
      secondary: 'bg-gray-100 hover:bg-gray-200 text-gray-900',
      ghost: 'text-gray-900 hover:bg-gray-100',
      ghostHover: 'hover:text-gray-900 hover:bg-gray-100',
    },
    
    badge: 'bg-gray-100 text-gray-700 border-2 border-gray-300',
    dropdown: 'bg-white border-2 border-gray-300',
    shadow: 'shadow-lg',
  },
  
  dark: {
    // Original dark theme
    page: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)',
    card: 'bg-white/5 border-white/10',
    cardHover: 'hover:bg-white/10 hover:shadow-2xl',
    sidebar: 'bg-white/5 border-white/10',
    
    text: {
      primary: 'text-white',
      secondary: 'text-white/80',
      tertiary: 'text-white/60',
      inverse: 'text-gray-900',
    },
    
    border: {
      default: 'border-white/10',
      hover: 'hover:border-white/20',
      focus: 'focus:border-purple-500',
    },
    
    input: {
      background: 'bg-white/5',
      border: 'border border-white/10',
      text: 'text-white',
      placeholder: 'placeholder:text-white/40',
      focus: 'focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20',
    },
    
    button: {
      primary: 'bg-white/10 hover:bg-white/20 border border-white/20 text-white',
      secondary: 'bg-white/5 hover:bg-white/10 text-white',
      ghost: 'text-white/60 hover:bg-white/10 hover:text-white',
      ghostHover: 'hover:text-white hover:bg-white/10',
    },
    
    badge: 'bg-white/10 text-white/80 border border-white/20',
    dropdown: 'bg-slate-800 border border-white/10',
    shadow: 'shadow-2xl shadow-black/50',
  },
}

/**
 * Get theme-specific styles
 */
export function getThemeStyles(theme: Theme): ThemeStyles {
  return themeStyles[theme]
}

/**
 * Helper to combine theme classes
 */
export function cn(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

/**
 * Get page background style
 */
export function getPageBackground(theme: Theme): React.CSSProperties | string {
  if (theme === 'light') {
    return { backgroundColor: themeStyles.light.page }
  }
  return {
    background: themeStyles.dark.page,
  }
}
