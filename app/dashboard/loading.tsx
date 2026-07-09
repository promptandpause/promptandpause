"use client"

import { useTheme } from "@/contexts/ThemeContext"

export default function DashboardLoading() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  return (
    <div
      data-dashboard
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`min-h-screen ${isDark ? "bg-[#0A0A0A]" : "bg-[#FFFFFF]"}`}
    >
      <div className="flex h-screen overflow-hidden">
        <div className="hidden md:block flex-shrink-0 p-4 pl-4 pr-0">
          <div
            className={`rounded-3xl p-6 h-fit sticky top-6 flex flex-col gap-6 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-hide ${
              isDark
                ? "bg-[#161618] border border-white/8 shadow-lg"
                : "bg-white border border-[#EFF3F4] shadow-sm"
            }`}
          >
            <div className={`text-center pb-5 border-b ${isDark ? "border-white/8" : "border-[#EFF3F4]"}`}>
              <div className="flex items-center justify-center gap-2 mb-2">
                <img
                  className={`h-10 ${isDark ? "invert" : ""}`}
                  alt="Prompt & Pause"
                  src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                />
              </div>
              <p className={`text-xs font-medium tracking-wide ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>
                Pause. Reflect. Grow.
              </p>
            </div>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">
              <div className="lg:col-span-8 space-y-5">
                <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.02]" : "bg-white/40"}`}>
                  <div className={`h-5 w-40 rounded ${isDark ? "bg-white/5" : "bg-[#EFF3F4]"}`} />
                </div>
                <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.02]" : "bg-white/40"}`}>
                  <div className={`h-24 rounded-lg ${isDark ? "bg-white/5" : "bg-[#EFF3F4]"}`} />
                </div>
                <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.02]" : "bg-white/40"}`}>
                  <div className={`h-16 rounded-lg ${isDark ? "bg-white/5" : "bg-[#EFF3F4]"}`} />
                </div>
              </div>
              <div className="hidden lg:block lg:col-span-4 space-y-5">
                <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.02]" : "bg-white/40"}`}>
                  <div className={`h-20 rounded-lg ${isDark ? "bg-white/5" : "bg-[#EFF3F4]"}`} />
                </div>
                <div className={`rounded-2xl p-5 ${isDark ? "bg-white/[0.02]" : "bg-white/40"}`}>
                  <div className={`h-16 rounded-lg ${isDark ? "bg-white/5" : "bg-[#EFF3F4]"}`} />
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
