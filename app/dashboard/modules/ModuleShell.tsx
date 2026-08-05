"use client"

import { Component, type ReactNode } from "react"
import { motion } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"

type AccentColor = "blue" | "indigo" | "emerald" | "violet" | "rose" | "amber" | "slate"

const accentGradients: Record<AccentColor, { light: string; dark: string }> = {
  blue: { light: "from-[#6366F1] to-[#818CF8]", dark: "from-[#6366F1] to-[#818CF8]" },
  indigo: { light: "from-[#6366F1] to-[#818CF8]", dark: "from-[#6366F1] to-[#818CF8]" },
  emerald: { light: "from-emerald-400 to-emerald-500", dark: "from-emerald-400 to-emerald-500" },
  violet: { light: "from-violet-400 to-violet-500", dark: "from-violet-400 to-violet-500" },
  rose: { light: "from-rose-400 to-rose-500", dark: "from-rose-400 to-rose-500" },
  amber: { light: "from-amber-400 to-amber-500", dark: "from-amber-400 to-amber-500" },
  slate: { light: "from-slate-400 to-slate-500", dark: "from-slate-400 to-slate-500" },
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
  const grad = accentGradients[accent]

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 22, mass: 0.8 }}
      className={`relative rounded-3xl overflow-hidden backdrop-blur-xl transition-all duration-200 ${
        isDark
          ? "bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06]"
          : "bg-white/70 border border-slate-100 hover:border-slate-200 shadow-soft-card"
      } ${className}`}
    >
      <div className={`h-[2px] w-full bg-gradient-to-r ${grad.light} ${isDark ? "opacity-80" : ""}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-xl ${
              isDark ? "bg-white/[0.06] text-[#818CF8]" : "bg-indigo-50 text-indigo-500"
            }`}>
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
