"use client"

import { useState, useEffect } from "react"
import { Compass } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { getSupabaseClient } from "@/lib/supabase/client"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"
import Link from "next/link"

export function FocusAreasModule() {
  return (
    <ModuleErrorBoundary>
      <FocusAreasInner />
    </ModuleErrorBoundary>
  )
}

function FocusAreasInner() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const supabase = getSupabaseClient()
  const isDark = theme === "dark"
  const [focusAreas, setFocusAreas] = useState<string[] | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase.from("user_preferences").select("focus_areas").eq("user_id", user.id).single()
        if (mounted) setFocusAreas((data as any)?.focus_areas || [])
      } catch {
        if (mounted) setFocusAreas([])
      }
    })()
    return () => { mounted = false }
  }, [supabase])

  return (
    <ModuleShell
      icon={<Compass size={18} weight="bold" />}
      title="Focus Areas"
      action={
        <Link href="/settings" className="text-[10px] font-medium text-[#1D9BF0] hover:underline">
          Edit
        </Link>
      }
      accent="emerald"
    >
      <div className="flex flex-wrap gap-1.5">
        {(focusAreas && focusAreas.length > 0 ? focusAreas : ["Add focus areas"]).map((area, idx) => (
          <span
            key={idx}
            className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
              isDark
                ? "bg-white/[0.06] text-white/65 border border-white/[0.08]"
                : "bg-white text-[#536471] border border-[#EFF3F4]"
            }`}
          >
            {area}
          </span>
        ))}
      </div>
    </ModuleShell>
  )
}
