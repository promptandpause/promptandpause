"use client"

import { useTheme } from "@/contexts/ThemeContext"

export default function DashboardLoading() {
  const { theme } = useTheme()

  return (
    <div 
      data-dashboard
      className={`min-h-screen ${theme === 'dark' ? 'bg-[#141820]' : 'bg-[#F5F3EE]'}`}
    />
  )
}
