"use client"

import { Crown, Star } from "phosphor-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { ModuleShell, ModuleErrorBoundary } from "./ModuleShell"
import Link from "next/link"
import { motion } from "framer-motion"

export function UpgradeModule() {
  return (
    <ModuleErrorBoundary>
      <UpgradeInner />
    </ModuleErrorBoundary>
  )
}

function UpgradeInner() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const isDark = theme === "dark"

  return (
    <ModuleShell
      icon={<Crown size={18} weight="bold" />}
      title="Upgrade to Premium"
      subtitle="Unlock weekly insights, monthly reflections & more"
      accent="amber"
    >
      <div className={`rounded-xl p-4 text-center space-y-4 ${
        isDark
          ? "bg-gradient-to-br from-[#0A2E4A] to-[#0A0A0A] border border-[#1D9BF0]/20"
          : "bg-gradient-to-br from-[#E8F5FE] to-[#FFFFFF] border border-[#1D9BF0]/30"
      }`}>
        <div className="flex justify-center gap-1">
          {[Star, Crown, Star].map((Icon, i) => (
            <span key={i} className={`p-2 rounded-full ${isDark ? "bg-amber-400/10 text-amber-300" : "bg-amber-50 text-amber-600"}`}>
              <Icon size={16} weight={i === 1 ? "fill" : "bold"} />
            </span>
          ))}
        </div>
        <div>
          <h4 className={`font-bold text-sm mb-1 ${isDark ? "text-white" : "text-[#0F1419]"}`}>
            {t("dashboard.upgrade")}
          </h4>
          <p className={`text-[11px] leading-relaxed ${isDark ? "text-white/50" : "text-[#8B98A5]"}`}>
            {t("dashboard.upgradeDesc")}
          </p>
        </div>
        <Link href="/dashboard/settings">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full text-sm font-semibold h-9 rounded-lg bg-gradient-to-r from-[#1D9BF0] to-[#0085FF] text-white shadow-lg hover:shadow-xl transition-all"
          >
            {t("dashboard.upgrade")}
          </motion.button>
        </Link>
      </div>
    </ModuleShell>
  )
}
