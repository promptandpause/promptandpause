"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Question,
  SignOut,
  Crown,
  ArchiveBox,
  Gear,
  House,
  UserCircle,
  Lifebuoy,
  Notebook,
  Heart,
  BookOpen,
  CaretRight,
  BookmarkSimple,
  Rss,
  UserPlus,
  Layout,
} from "phosphor-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTier } from "@/hooks/useTier"
import { useTranslation } from "@/hooks/useTranslation"
import { useTheme } from "@/contexts/ThemeContext"
import {
  getCachedUserProfile,
  cacheUserProfile,
  invalidateCacheOnLogout,
} from "@/lib/services/cacheService"

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { tier, isLoading: tierLoading } = useTier()
  const [userProfile, setUserProfile] = useState<{ full_name: string; username: string; subscription_tier: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const isDark = theme === "dark"

  const sidebarNav = [
    { icon: Layout, label: "dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { icon: Rss, label: "feed", href: "/dashboard/feed", active: pathname === "/dashboard/feed" },
    { icon: UserPlus, label: "friends", href: "/dashboard/friends", active: pathname === "/dashboard/friends" },
    { icon: Heart, label: "wellness", href: "/dashboard/wellness", active: pathname === "/dashboard/wellness" },
    { icon: ArchiveBox, label: "archive", href: "/dashboard/archive", active: pathname === "/dashboard/archive" },
    { icon: BookmarkSimple, label: "saved", href: "/dashboard/saved", active: pathname === "/dashboard/saved" },
    { icon: Notebook, label: "my_journals", href: "/dashboard/journals", active: pathname === "/dashboard/journals" },
    { icon: Gear, label: "settings", href: "/dashboard/settings", active: pathname === "/dashboard/settings" },
    { icon: UserCircle, label: "profile", href: "/dashboard/settings/profile", active: pathname === "/dashboard/settings/profile" },
  ]

  const mobileNav = [
    { id: "home", label: t("nav.dashboard"), href: "/dashboard", active: pathname === "/dashboard", crisis: false },
    { id: "wellness", label: t("nav.wellness"), href: "/dashboard/wellness", active: pathname === "/dashboard/wellness", crisis: false },
    { id: "journal", label: t("nav.my_journals"), href: "/dashboard/journals", active: pathname === "/dashboard/journals", crisis: false },
    { id: "crisis", label: t("nav.crisis_resources"), href: "/crisis-resources", active: pathname === "/crisis-resources", crisis: true },
  ]

  useEffect(() => {
    let isMounted = true

    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const cachedProfile = getCachedUserProfile(user.id)
        if (cachedProfile && isMounted) {
            setUserProfile({
              full_name: cachedProfile.full_name || user.email?.split("@")[0] || "User",
              username: cachedProfile.username || user.email?.split("@")[0] || "user",
              subscription_tier: tier,
            })
            setLoading(false)
        }

        const response = await fetch("/api/user/profile")
        if (!response.ok) {
          if (!cachedProfile && isMounted) {
            setUserProfile({
              full_name: user.email?.split("@")[0] || "User",
              subscription_tier: tier,
            })
          }
          return
        }

        const { success, data } = await response.json()
        if (success && data && isMounted) {
          setUserProfile({
            full_name: data.full_name || user.email?.split("@")[0] || "User",
            username: data.username || user.email?.split("@")[0] || "user",
            subscription_tier: tier,
          })
          cacheUserProfile(data, user.id)
        } else if (!cachedProfile && isMounted) {
          setUserProfile({
            full_name: user.email?.split("@")[0] || "User",
            username: data?.username || user.email?.split("@")[0] || "user",
            subscription_tier: tier,
          })
        }
      } catch (error) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          setUserProfile({
            full_name: user.email?.split("@")[0] || "User",
            username: user.email?.split("@")[0] || "user",
            subscription_tier: tier,
          })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadUserProfile()
    return () => { isMounted = false }
  }, [supabase, tier])

  return (
    <>
      {/* ─── Desktop Sidebar ─── */}
      <div className="hidden md:block flex-shrink-0 w-[240px] p-4 pl-4 pr-0">
        <div
          className={`rounded-3xl p-6 h-fit sticky top-6 flex flex-col gap-6 transition-all duration-200 max-h-[calc(100vh-3rem)] overflow-y-auto scrollbar-hide ${
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

          <div className={`pb-5 border-b ${isDark ? "border-white/8" : "border-[#EFF3F4]"}`}>
            {loading ? (
              <div className="flex items-center gap-3">
                <Skeleton className={`h-12 w-12 rounded-full ${isDark ? "bg-white/10" : "bg-[#EFF3F4]"}`} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className={`h-4 w-28 ${isDark ? "bg-white/10" : "bg-[#EFF3F4]"}`} />
                  <Skeleton className={`h-3 w-16 ${isDark ? "bg-white/10" : "bg-[#EFF3F4]"}`} />
                </div>
              </div>
            ) : userProfile ? (
              <Link href={`/@${userProfile.username}`} className="flex items-center gap-3 group">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ring-2 ${
                  isDark
                    ? "bg-gradient-to-br from-[#1D3A5C] to-[#0A2E4A] ring-[#1D9BF0]/30"
                    : "bg-gradient-to-br from-[#E8F5FE] to-[#D4E9F7] ring-[#1D9BF0]/50"
                }`}>
                  <UserCircle size={24} weight="bold" className={isDark ? "text-[#1D9BF0]" : "text-[#1D9BF0]"} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate group-hover:underline ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                    {userProfile.full_name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {tier === "premium" ? (
                      <span className={`text-xs font-medium flex items-center gap-1 ${isDark ? "text-amber-400" : "text-amber-600"}`}>
                        <Crown size={12} weight="fill" /> Premium
                      </span>
                    ) : (
                      <span className={`text-xs font-medium ${isDark ? "text-white/40" : "text-[#8B98A5]"}`}>
                        {t("settings.freeTier")}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ) : null}
          </div>

          <nav className="flex-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
              {t("nav.dashboard")}
            </h4>
            <div className="space-y-1.5">
              {sidebarNav.map((item) => (
                <Link key={item.label} href={item.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 border border-transparent ${
                      item.active
                        ? isDark
                          ? "bg-[#1D9BF0]/15 text-white border-[#1D9BF0]/20"
                          : "bg-[#E8F5FE] text-[#1D9BF0] border-[#1D9BF0]/40"
                        : isDark
                          ? "text-white/50 hover:bg-white/5 hover:text-white"
                          : "text-[#536471] hover:bg-[#EFF3F4] hover:text-[#0F1419]"
                    }`}
                  >
                    <item.icon size={18} weight="bold" />
                    {t(`nav.${item.label}` as any)}
                  </button>
                </Link>
              ))}
            </div>
          </nav>

          {tier !== "premium" && (
            <div className={`pt-5 border-t ${isDark ? "border-white/8" : "border-[#EFF3F4]"}`}>
              <div className={`rounded-2xl p-5 text-center space-y-4 ${
                isDark
                  ? "bg-gradient-to-br from-[#0A2E4A] to-[#0A0A0A] border-2 border-[#1D9BF0]/30 shadow-lg"
                  : "bg-gradient-to-br from-[#E8F5FE] to-[#FFFFFF] border-2 border-[#1D9BF0]/40 shadow-lg"
              }`}>
                <div className="flex justify-center">
                  <div className={`p-3 rounded-full ${isDark ? "bg-[#1D9BF0]/15" : "bg-[#E8F5FE]"}`}>
                    <Crown size={28} weight="bold" className="text-[#1D9BF0]" />
                  </div>
                </div>
                <div>
                  <h4 className={`font-bold text-base mb-1 ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                    {t("dashboard.upgrade")}
                  </h4>
                  <p className={`text-xs leading-relaxed ${isDark ? "text-white/50" : "text-[#8B98A5]"}`}>
                    {t("dashboard.upgradeDesc")}
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <button className={`w-full text-sm font-semibold h-10 rounded-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl shadow-lg flex items-center justify-center gap-1 ${
                    isDark
                      ? "bg-gradient-to-r from-[#1D9BF0] to-[#0085FF] text-white"
                      : "bg-gradient-to-r from-[#1D9BF0] to-[#0085FF] text-white"
                  }`}>
                    {t("dashboard.upgrade")}
                    <CaretRight size={14} weight="bold" />
                  </button>
                </Link>
              </div>
            </div>
          )}

          <div className={`pt-5 border-t ${isDark ? "border-white/8" : "border-[#EFF3F4]"}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${isDark ? "text-white/30" : "text-[#8B98A5]"}`}>
              {t("nav.help")}
            </h4>
            <div className="space-y-1.5">
              <Link href="/crisis-resources">
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 border ${
                  isDark
                    ? "text-rose-400 border-rose-500/20 hover:bg-rose-500/10"
                    : "text-rose-600 border-rose-200 hover:bg-rose-50"
                }`}>
                  <Lifebuoy size={18} weight="bold" />
                  {t("nav.crisis_resources")}
                </button>
              </Link>
              <Link href="/dashboard/support">
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isDark
                    ? "text-white/50 hover:bg-white/5 hover:text-white"
                    : "text-[#536471] hover:bg-[#EFF3F4] hover:text-[#0F1419]"
                }`}>
                  <Question size={18} weight="bold" />
                  {t("nav.help")}
                </button>
              </Link>
              <button
                onClick={async () => {
                  invalidateCacheOnLogout()
                  await supabase.auth.signOut()
                  router.push("/auth")
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isDark
                    ? "text-white/50 hover:bg-rose-500/10 hover:text-rose-400"
                    : "text-[#536471] hover:bg-rose-50 hover:text-rose-600"
                }`}
              >
                <SignOut size={18} weight="bold" />
                {t("nav.logout")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Top Nav Bar ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className={`px-5 h-14 flex items-center justify-between mt-[env(safe-area-inset-top,0px)] ${
          isDark
            ? "bg-[#0A0A0A]/98 md:backdrop-blur-lg border-b border-white/5"
            : "bg-white/98 md:backdrop-blur-lg border-b border-[#EFF3F4]"
        }`}>
          <img
            className={`h-6 ${isDark ? "invert" : ""}`}
            alt="Prompt & Pause"
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
          />
          <div className="flex items-center -mr-2.5">
            <Link
              href="/dashboard/archive"
              className={`p-2.5 rounded-xl transition-colors ${
                pathname === "/dashboard/archive"
                  ? isDark ? "bg-[#1D9BF0]/10 text-[#1D9BF0]" : "bg-[#E8F5FE] text-[#1D9BF0]"
                  : isDark ? "text-white/40 hover:text-white/60" : "text-[#536471] hover:text-[#0F1419] hover:bg-[#EFF3F4]"
              }`}
            >
              <ArchiveBox size={22} weight="bold" />
            </Link>
            <Link
              href="/dashboard/settings"
              className={`p-2.5 rounded-xl transition-colors ${
                pathname?.startsWith("/dashboard/settings")
                  ? isDark ? "bg-[#1D9BF0]/10 text-[#1D9BF0]" : "bg-[#E8F5FE] text-[#1D9BF0]"
                  : isDark ? "text-white/40 hover:text-white/60" : "text-[#536471] hover:text-[#0F1419] hover:bg-[#EFF3F4]"
              }`}
            >
              <Gear size={22} weight="bold" />
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 ${
        isDark
          ? "bg-[#161618] border-t border-white/[0.06]"
          : "bg-white border-t border-[#EFF3F4]"
      }`}>
        <div className="flex justify-around items-center h-16 px-2">
          {mobileNav.map((item) => {
            const iconColor = item.crisis
              ? isDark ? "text-rose-400" : "text-rose-500"
              : item.active
                ? isDark ? "text-[#1D9BF0]" : "text-[#1D9BF0]"
                : isDark ? "text-white/30" : "text-[#8B98A5]"
            return (
              <Link
                key={item.id}
                href={item.href}
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
                  item.active && !item.crisis
                    ? isDark ? "bg-[#1D9BF0]/10" : "bg-[#E8F5FE]"
                    : ""
                }`}
              >
                <span className={iconColor}>
                  <MobileNavIcon id={item.id} isDark={isDark} />
                </span>
                <span className={`text-[10px] font-semibold ${iconColor}`}>
                  {item.label}
                </span>
              </Link>
            )
          })}
        </div>
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </>
  )
}

function MobileNavIcon({ id, isDark }: { id: string; isDark: boolean }) {
  const size = 20
  const color = isDark ? "white" : "#0F1419"
  switch (id) {
    case "home":
      return <House size={size} weight="bold" color={color} />
    case "wellness":
      return <Heart size={size} weight="bold" color={color} />
    case "journal":
      return <Notebook size={size} weight="bold" color={color} />
    case "crisis":
      return <Lifebuoy size={size} weight="bold" color={color} />
    default:
      return null
  }
}
