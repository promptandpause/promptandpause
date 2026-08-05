"use client"

import { Component, type ReactNode } from "react"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"

type AccentColor = "blue" | "indigo" | "emerald" | "violet" | "rose" | "amber" | "slate"

const accentChips: Record<AccentColor, { light: string; dark: string }> = {
  blue: { light: "bg-gradient-to-br from-sky-100 to-sky-200 text-sky-500", dark: "bg-sky-500/20 text-sky-400" },
  indigo: { light: "bg-gradient-to-br from-indigo-100 to-indigo-200 text-indigo-500", dark: "bg-indigo-500/20 text-[#818CF8]" },
  emerald: { light: "bg-gradient-to-br from-emerald-100 to-emerald-200 text-emerald-500", dark: "bg-emerald-500/20 text-emerald-400" },
  violet: { light: "bg-gradient-to-br from-violet-100 to-violet-200 text-violet-500", dark: "bg-violet-500/20 text-violet-400" },
  rose: { light: "bg-gradient-to-br from-rose-100 to-rose-200 text-rose-500", dark: "bg-rose-500/20 text-rose-400" },
  amber: { light: "bg-gradient-to-br from-amber-100 to-amber-200 text-amber-500", dark: "bg-amber-500/20 text-amber-400" },
  slate: { light: "bg-gradient-to-br from-slate-100 to-slate-200 text-slate-500", dark: "bg-slate-500/20 text-slate-400" },
}

interface ModuleShellProps {
  icon: ReactNode
  title: string
  subtitle?: string
  accent?: AccentColor
  action?: ReactNode
  children: ReactNode
  className?: string
}

export function ModuleShell({ icon, title, subtitle, accent = "blue", action, children, className = "" }: ModuleShellProps) {
  const { theme } = useTheme()
  const isDark = theme === "dark"
  const chip = accentChips[accent]

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
      className={`relative rounded-3xl overflow-hidden transition-all duration-200 ${
        isDark
          ? "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]"
          : "glass border-slate-100 soft-shadow"
      } ${className}`}
    >
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${isDark ? chip.dark : chip.light}`}>
              {icon}
            </span>
            <div className="min-w-0">
              <h3 className={`text-sm font-semibold tracking-tight truncate ${isDark ? "text-white" : "text-slate-900"}`}>
                {title}
              </h3>
              {subtitle && (
                <p className={`text-[11px] mt-0.5 truncate ${isDark ? "text-white/40" : "text-slate-400"}`}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
        {children}
      </div>
    </motion.section>
  )
}

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

export class ModuleErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="rounded-2xl border border-dashed border-rose-300 dark:border-rose-500/30 p-6 text-center">
          <p className="text-sm text-rose-500">This section couldn&apos;t load.</p>
          <button
            onClick={() => this.setState({ hasError: false })}
            className="text-xs text-indigo-500 hover:underline mt-2"
          >
            Try again
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
