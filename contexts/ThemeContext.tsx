"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { getSupabaseClient } from '@/lib/supabase/client'

type Theme = 'light' | 'dark'

type ThemeContextType = {
  theme: Theme
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('light')
  const [mounted, setMounted] = useState(false)
  const supabase = getSupabaseClient()

  // Load theme from localStorage on mount
  useEffect(() => {
    setMounted(true)
    const savedTheme = localStorage.getItem('theme') as Theme
    if (savedTheme) {
      setThemeState(savedTheme)
      applyTheme(savedTheme)
    } else {
      // Default to light theme
      applyTheme('light')
    }

    // Load from database
    loadThemeFromDatabase()
  }, [])

  const loadThemeFromDatabase = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase
        .from('profiles')
        .select('dark_mode')
        .eq('id', user.id)
        .single()

      if (profile && profile.dark_mode !== null) {
        const dbTheme = profile.dark_mode ? 'dark' : 'light'
        setThemeState(dbTheme)
        localStorage.setItem('theme', dbTheme)
        applyTheme(dbTheme)
      }
    } catch (error) {
      console.error('Error loading theme from database:', error)
    }
  }

  const applyTheme = (newTheme: Theme) => {
    const root = document.documentElement
    
    if (newTheme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }

  const setTheme = async (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem('theme', newTheme)
    applyTheme(newTheme)
    
    // Save to database
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('profiles')
        .update({ dark_mode: newTheme === 'dark' })
        .eq('id', user.id)

      console.log(`Theme changed to: ${newTheme} and saved to database`)
    } catch (error) {
      console.error('Error saving theme to database:', error)
    }
  }

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
