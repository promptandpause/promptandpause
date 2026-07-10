"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArchiveBox,
  Gear,
  House,
  UserCircle,
  Lifebuoy,
  Notebook,
  Heart,
  BookOpen,
  BookmarkSimple,
  Rss,
  UserPlus,
  Layout,
  PencilLine,
  ChartBar,
  Trophy,
  X,
  List,
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
import { cn } from "@/lib/utils"
import { NotificationBell } from "@/components/social/NotificationBell"

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { tier, isLoading: tierLoading } = useTier()
  const [userProfile, setUserProfile] = useState<{ full_name: string; username: string; avatar_url: string; subscription_tier: string } | null>(null)
  const [friendCount, setFriendCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const isDark = theme === "dark"

  const isActive = (cleanHref: string) => {
    const dashboardHref = cleanHref === '/' ? '/dashboard' : `/dashboard${cleanHref}`
    return pathname === cleanHref || pathname === dashboardHref
  }

  const sidebarNav = [
    { icon: Layout, label: "dashboard", href: "/dashboard", active: isActive("/") },
    { icon: PencilLine, label: "reflect", href: "/reflect", active: isActive("/reflect") },
    { icon: Rss, label: "feed", href: "/feed", active: isActive("/feed") },
    { icon: UserPlus, label: "friends", href: "/friends", active: isActive("/friends") },
    { icon: Heart, label: "wellness", href: "/wellness", active: isActive("/wellness") },
    { icon: ArchiveBox, label: "archive", href: "/archive", active: isActive("/archive") },
    { icon: BookmarkSimple, label: "saved", href: "/saved", active: isActive("/saved") },
    { icon: Notebook, label: "my_journals", href: "/journals", active: isActive("/journals") },
    { icon: ChartBar, label: "insights", href: "/insights", active: isActive("/insights") },
    { icon: Gear, label: "settings", href: "/settings", active: isActive("/settings") },
    { icon: UserCircle, label: "profile", href: "/settings/profile", active: isActive("/settings/profile") },
    { icon: Trophy, label: "achievements", href: "/achievements", active: isActive("/achievements") },
  ]

  const mobileNav = [
    { id: "home", label: t("nav.dashboard"), href: "/dashboard", active: isActive("/") },
    { id: "reflect", label: t("nav.reflect"), href: "/reflect", active: isActive("/reflect") },
    { id: "feed", label: t("nav.feed"), href: "/feed", active: isActive("/feed") },
    { id: "wellness", label: t("nav.wellness"), href: "/wellness", active: isActive("/wellness") },
    { id: "archive", label: t("nav.archive"), href: "/archive", active: isActive("/archive") },
  ]

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const cachedProfile = getCachedUserProfile(user.id)
        if (cachedProfile && isMounted) {
          setUserProfile({
            full_name: cachedProfile.full_name || user.email?.split("@")[0] || "User",
            username: cachedProfile.username || user.email?.split("@")[0] || "user",
            avatar_url: cachedProfile.avatar_url || "",
            subscription_tier: tier,
          })
          setLoading(false)
        }

        const [profileRes, friendsRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/social/friends"),
        ])

        if (isMounted) {
          if (profileRes.ok) {
            const { data } = await profileRes.json()
            if (data) {
              setUserProfile({
                full_name: data.full_name || user.email?.split("@")[0] || "User",
                username: data.username || user.email?.split("@")[0] || "user",
                avatar_url: data.avatar_url || "",
                subscription_tier: tier,
              })
              cacheUserProfile(data, user.id)
            }
          } else if (!cachedProfile && isMounted) {
            setUserProfile({
              full_name: user.email?.split("@")[0] || "User",
              username: user.email?.split("@")[0] || "user",
              avatar_url: "",
              subscription_tier: tier,
            })
          }

          if (friendsRes.ok) {
            const { data: friends } = await friendsRes.json()
            if (friends) {
              setFriendCount(friends.filter((f: any) => f.status === "accepted").length)
            }
          }
        }
      } catch (error) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          setUserProfile({
            full_name: user.email?.split("@")[0] || "User",
            username: user.email?.split("@")[0] || "user",
            avatar_url: "",
            subscription_tier: tier,
          })
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadData()
    return () => { isMounted = false }
  }, [supabase, tier])

  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <>
      {/* ─── Mobile nav spacing: pushed down by fixed top bar / pushed up by fixed bottom bar ─── */}
      <style>{`@media (max-width:767px){main{padding-top:56px!important;padding-bottom:64px!important}}`}</style>

      {/* ─── Desktop Sidebar ─── */}
      <div className="hidden md:block flex-shrink-0 w-[240px] xl:w-[275px]">
        <div className="h-screen flex flex-col overflow-y-auto scrollbar-hide px-3 py-2 fixed w-[240px] xl:w-[275px]">
          {/* Logo + Notifications */}
          <div className="px-3 py-3 mb-1 flex items-center justify-between">
            <Link href="/dashboard" className="inline-flex items-center gap-2">
              <img
                className={`h-8 ${isDark ? "invert" : ""}`}
                alt="Prompt & Pause"
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              />
            </Link>
            <NotificationBell />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5">
            {sidebarNav.map((item) => (
              <Link key={item.label} href={item.href}>
                <button
                  className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                    item.active
                      ? isDark
                        ? "text-white font-semibold"
                        : "text-[#0F1419] font-semibold"
                      : isDark
                        ? "text-white/50 hover:bg-white/[0.06] hover:text-white"
                        : "text-[#536471] hover:bg-[#EFF3F4] hover:text-[#0F1419]"
                  }`}
                >
                  <item.icon
                    size={24}
                    weight={item.active ? "fill" : "regular"}
                    className={item.active ? (isDark ? "text-white" : "text-[#1D9BF0]") : ""}
                  />
                  <span>{t(`nav.${item.label}` as any)}</span>
                </button>
              </Link>
            ))}
          </nav>

          {/* Profile Card */}
          <div className={`mt-auto mb-3 rounded-2xl ${isDark ? "bg-white/[0.03] border border-white/[0.06]" : "bg-white border border-[#EFF3F4]"}`}>
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className={`h-10 w-10 rounded-full ${isDark ? "bg-white/10" : "bg-[#EFF3F4]"}`} />
                  <div className="flex-1 space-y-1">
                    <Skeleton className={`h-3 w-20 ${isDark ? "bg-white/10" : "bg-[#EFF3F4]"}`} />
                    <Skeleton className={`h-2.5 w-14 ${isDark ? "bg-white/5" : "bg-[#EFF3F4]"}`} />
                  </div>
                </div>
              </div>
            ) : userProfile ? (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/${userProfile.username}`} className="shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#161618]" : "bg-[#EFF3F4]"}`}>
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <UserCircle size={22} weight="bold" className={isDark ? "text-white/40" : "text-[#536471]"} />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/${userProfile.username}`} className={`text-sm font-semibold truncate block hover:underline ${isDark ? "text-white" : "text-[#0F1419]"}`}>
                      {userProfile.full_name}
                    </Link>
                    <p className={`text-xs truncate ${isDark ? "text-white/30" : "text-[#536471]"}`}>
                      @{userProfile.username}
                    </p>
                  </div>
                  <Link href="/settings">
                    <Gear size={16} weight="bold" className={`shrink-0 cursor-pointer transition-colors ${isDark ? "text-white/20 hover:text-white/40" : "text-[#8B98A5] hover:text-[#536471]"}`} />
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm mb-3">
                  <span className={`${isDark ? "text-white/30" : "text-[#536471]"}`}>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>{friendCount}</span> Following
                  </span>
                  <span className={`${isDark ? "text-white/30" : "text-[#536471]"}`}>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-[#0F1419]"}`}>{friendCount}</span> Followers
                  </span>
                </div>
                <Link
                  href={`/${userProfile.username}`}
                  className={`block w-full text-center py-2 rounded-full text-sm font-semibold transition-colors border ${
                    isDark
                      ? "border-white/20 text-white hover:bg-white/[0.06]"
                      : "border-[#CFD9DE] text-[#0F1419] hover:bg-[#EFF3F4]"
                  }`}
                >
                  View Profile
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* ─── Mobile Top Nav Bar ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40">
        <div className={cn(
          "px-4 h-14 flex items-center justify-between",
          isDark ? "bg-[#0A0A0A]/90 backdrop-blur-lg border-b border-white/[0.06]" : "bg-white/90 backdrop-blur-lg border-b border-[#EFF3F4]"
        )}>
          <button
            onClick={() => setDrawerOpen(true)}
            className={`p-2 -ml-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#EFF3F4]"}`}
            aria-label="Open navigation menu"
          >
            <List size={22} weight="bold" className={isDark ? "text-white" : "text-[#0F1419]"} />
          </button>
          <Link href="/dashboard">
            <img
              className={`h-7 ${isDark ? "invert" : ""}`}
              alt="Prompt & Pause"
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
            />
          </Link>
          <div className="flex items-center gap-1">
            <NotificationBell />
            <Link href="/settings">
              <button className={`p-2 -mr-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#EFF3F4]"}`} aria-label="Settings">
                <Gear size={20} weight="bold" className={isDark ? "text-white/50" : "text-[#536471]"} />
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Mobile Nav Drawer ─── */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-50">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDrawerOpen(false)} />
          <div className={cn(
            "fixed left-0 top-0 bottom-0 w-[280px] flex flex-col pt-14 overflow-y-auto",
            isDark ? "bg-[#0A0A0A] border-r border-white/[0.06]" : "bg-white border-r border-[#EFF3F4]"
          )}>
            <button
              onClick={() => setDrawerOpen(false)}
              className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#EFF3F4]"}`}
              aria-label="Close navigation menu"
            >
              <X size={20} weight="bold" className={isDark ? "text-white/50" : "text-[#536471]"} />
            </button>
            <nav className="flex-1 px-3 py-2 space-y-0.5">
              {sidebarNav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setDrawerOpen(false)}
                >
                  <button
                    className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                      item.active
                        ? isDark
                          ? "text-white font-semibold"
                          : "text-[#0F1419] font-semibold"
                        : isDark
                          ? "text-white/50 hover:bg-white/[0.06] hover:text-white"
                          : "text-[#536471] hover:bg-[#EFF3F4] hover:text-[#0F1419]"
                    }`}
                  >
                    <item.icon
                      size={22}
                      weight={item.active ? "fill" : "regular"}
                      className={item.active ? (isDark ? "text-white" : "text-[#1D9BF0]") : ""}
                    />
                    <span>{t(`nav.${item.label}` as any)}</span>
                  </button>
                </Link>
              ))}
            </nav>
            {userProfile && (
              <div className={`px-4 py-4 border-t ${isDark ? "border-white/[0.06]" : "border-[#EFF3F4]"}`}>
                <div className="flex items-center gap-3">
                  <Link href={`/${userProfile.username}`} className="shrink-0" onClick={() => setDrawerOpen(false)}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isDark ? "bg-[#161618]" : "bg-[#EFF3F4]"}`}>
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <UserCircle size={20} weight="bold" className={isDark ? "text-white/40" : "text-[#536471]"} />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#0F1419]"}`}>{userProfile.full_name}</p>
                    <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-[#536471]"}`}>@{userProfile.username}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,0px)] ${
        isDark ? "bg-[#0A0A0A]/90 backdrop-blur-lg border-t border-white/[0.06]" : "bg-white/90 backdrop-blur-lg border-t border-[#EFF3F4]"
      }`}>
        <div className="flex items-center justify-around h-14">
          {mobileNav.map((item) => (
            <Link key={item.id} href={item.href}>
              <button
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  item.active
                    ? isDark
                      ? "text-white"
                      : "text-[#1D9BF0]"
                    : isDark
                      ? "text-white/40"
                      : "text-[#536471]"
                }`}
              >
                {item.id === "home" && <House size={22} weight={item.active ? "fill" : "regular"} />}
                {item.id === "reflect" && <PencilLine size={22} weight={item.active ? "fill" : "regular"} />}
                {item.id === "feed" && <Rss size={22} weight={item.active ? "fill" : "regular"} />}
                {item.id === "wellness" && <Heart size={22} weight={item.active ? "fill" : "regular"} />}
                {item.id === "archive" && <ArchiveBox size={22} weight={item.active ? "fill" : "regular"} />}
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
