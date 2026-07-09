"use client"

import { useState, useEffect } from "react"
import { Users } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"
import Link from "next/link"
import { motion } from "framer-motion"

export function FeedModule() {
  return (
    <ModuleErrorBoundary>
      <FeedInner />
    </ModuleErrorBoundary>
  )
}

function FeedInner() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"
  const [hasFriends, setHasFriends] = useState(false)
  const [recentItems, setRecentItems] = useState<{ name: string; preview: string }[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/social/feed?page=1&limit=3")
        if (res.ok) {
          const { data } = await res.json()
          if (data && data.length > 0) {
            setHasFriends(true)
            setRecentItems(
              data.slice(0, 3).map((item: any) => ({
                name: item.profile?.full_name || "Someone",
                preview: (item.reflection?.reflection_text || "").slice(0, 60) + "...",
              }))
            )
          }
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <ModuleShell
      icon={<Users size={18} weight="bold" />}
      title="Friends"
      subtitle={hasFriends ? "Recent reflections" : "Connect with others"}
      accent="blue"
      action={
        <Link href="/friends" className="text-[10px] font-medium text-[#1D9BF0] hover:underline">
          {hasFriends ? "See all" : "Find friends"}
        </Link>
      }
    >
      {loading ? (
        <div className={`text-xs ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>Loading...</div>
      ) : hasFriends ? (
        <div className="space-y-2">
          {recentItems.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-lg p-3 ${isDark ? "bg-white/[0.03]" : "bg-[#F7F9FA]"}`}
            >
              <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>{item.name}</p>
              <p className={`text-[10px] mt-0.5 ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>{item.preview}</p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-3">
          <p className={`text-xs ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>
            No friends yet. Connect to see their reflections.
          </p>
          <Link
            href="/friends"
            className="inline-block mt-2 text-xs font-medium text-[#1D9BF0] hover:underline"
          >
            Find friends
          </Link>
        </div>
      )}
    </ModuleShell>
  )
}
