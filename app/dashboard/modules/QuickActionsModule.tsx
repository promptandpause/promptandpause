"use client"

import { Wind, Heart, PencilLine, Sun } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"
import Link from "next/link"
import { motion } from "framer-motion"

const actions = [
  { icon: Wind, labelKey: "dashboard.breathe", sublabelKey: "dashboard.breatheSublabel", href: "/wellness?open=breathing", accent: "emerald" as const },
  { icon: Heart, labelKey: "dashboard.checkIn", sublabelKey: "dashboard.checkInSublabel", href: "#mood-section", accent: "rose" as const },
  { icon: PencilLine, labelKey: "dashboard.reflect", sublabelKey: "dashboard.reflectSublabel", href: "#prompt-section", accent: "blue" as const },
  { icon: Sun, labelKey: "dashboard.gratitude", sublabelKey: "dashboard.gratitudeSublabel", href: "/wellness?open=gratitude", accent: "amber" as const },
]

const accentColors: Record<string, { icon: string; bg: string }> = {
  emerald: { icon: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  rose: { icon: "text-rose-500 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-500/10" },
  blue: { icon: "text-[#1D9BF0]", bg: "bg-[#E8F5FE] dark:bg-[#1D9BF0]/10" },
  amber: { icon: "text-amber-500 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-500/10" },
}

export function QuickActionsModule() {
  return (
    <ModuleErrorBoundary>
      <QuickActionsInner />
    </ModuleErrorBoundary>
  )
}

function QuickActionsInner() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"

  return (
    <ModuleShell
      icon={<Wind size={18} weight="bold" />}
      title="Quick Actions"
      accent="blue"
    >
      <div className="grid grid-cols-2 gap-2">
        {actions.map((action, i) => {
          const colors = accentColors[action.accent]
          const Icon = action.icon
          const isAnchor = action.href.startsWith("#")
          const content = (
            <div
              className={`group relative overflow-hidden rounded-xl p-3.5 flex flex-col gap-2 transition-all duration-200 cursor-pointer border ${
                isDark
                  ? "bg-white/[0.03] border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]"
                  : "bg-white/90 border-[#EFF3F4] hover:border-[#CFD9DE] hover:shadow-sm"
              }`}
            >
              <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${colors.bg} ${colors.icon}`}>
                <Icon size={16} weight="bold" />
              </span>
              <div>
                <p className={`text-xs font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                  {t(action.labelKey as any)}
                </p>
                <p className={`text-[10px] mt-0.5 ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>
                  {t(action.sublabelKey as any)}
                </p>
              </div>
            </div>
          )

          if (isAnchor) {
            return (
              <motion.button
                key={action.labelKey}
                whileHover={{ scale: 1.02, y: -1 }}
                whileTap={{ scale: 0.98 }}
                transition={{ type: "spring", stiffness: 400, damping: 26 }}
                onClick={() => {
                  const el = document.querySelector(action.href)
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "start" })
                }}
              >
                {content}
              </motion.button>
            )
          }

          return (
            <motion.div
              key={action.labelKey}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 26 }}
            >
              <Link href={action.href}>{content}</Link>
            </motion.div>
          )
        })}
      </div>
    </ModuleShell>
  )
}
