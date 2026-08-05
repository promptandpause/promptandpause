"use client"

import { useState, useEffect, createElement } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ArchiveBox,
  Gear,
  House,
  UserCircle,
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
  Lifebuoy,
  X,
  List,
  Buildings,
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
import { WhoToFollow } from "./WhoToFollow"
import { TrendingTopics } from "./TrendingTopics"

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { tier, isLoading: tierLoading } = useTier()
  const [userProfile, setUserProfile] = useState<{ full_name: string; username: string; avatar_url: string; subscription_tier: string } | null>(null)
  const [friendCount, setFriendCount] = useState(0)
  const [followerCount, setFollowerCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const isDark = theme === "dark"

  const isActive = (href: string) => {
    if (pathname === href) return true
    if (href === '/' && pathname === '/dashboard') return true
    if (!href.startsWith('/dashboard')) {
      return pathname === `/dashboard${href}`
    }
    return false
  }

  const sidebarNav = [
    { icon: Layout, label: "dashboard", href: "/dashboard", active: isActive("/") },
    { icon: UserCircle, label: "my_profile", href: "/", active: false, isProfile: true },

    { icon: PencilLine, label: "reflect", href: "/reflect", active: isActive("/reflect") },
    { icon: Rss, label: "feed", href: "/dashboard/feed", active: isActive("/dashboard/feed") },
    { icon: UserPlus, label: "friends", href: "/friends", active: isActive("/friends") },
    { icon: Heart, label: "wellness", href: "/wellness", active: isActive("/wellness") },
    { icon: ArchiveBox, label: "archive", href: "/archive", active: isActive("/archive") },
    { icon: BookmarkSimple, label: "saved", href: "/saved", active: isActive("/saved") },
    { icon: Notebook, label: "my_journals", href: "/journals", active: isActive("/journals") },
    { icon: ChartBar, label: "insights", href: "/insights", active: isActive("/insights") },
    { icon: Gear, label: "settings", href: "/settings", active: isActive("/settings") },
    { icon: Buildings, label: "workspaces", href: "/workspace", active: isActive("/workspace") },
    { icon: Lifebuoy, label: "support", href: "/dashboard/support", active: isActive("/dashboard/support") },
    { icon: Trophy, label: "achievements", href: "/achievements", active: isActive("/achievements") },
  ]

  // Desktop nav keeps Settings pinned at the bottom of the list, separate
  // from the mobile drawer order (which stays as originally designed).
  const desktopSidebarNav = [
    ...sidebarNav.filter((item) => item.label !== "settings"),
    ...sidebarNav.filter((item) => item.label === "settings"),
  ]

  const mobileNav = [
    { id: "home", icon: House, label: t("nav.dashboard"), href: "/dashboard", active: isActive("/") },

    { id: "reflect", icon: PencilLine, label: t("nav.reflect"), href: "/reflect", active: isActive("/reflect") },
    { id: "feed", icon: Rss, label: t("nav.feed"), href: "/dashboard/feed", active: isActive("/dashboard/feed") },
    { id: "wellness", icon: Heart, label: t("nav.wellness"), href: "/wellness", active: isActive("/wellness") },
    { id: "archive", icon: ArchiveBox, label: t("nav.archive"), href: "/archive", active: isActive("/archive") },
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

        const [profileRes, friendsRes, followRes] = await Promise.all([
          fetch("/api/user/profile"),
          fetch("/api/social/friends"),
          fetch("/api/social/follow"),
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

          if (followRes.ok) {
            const { data: followData } = await followRes.json()
            if (followData) {
              setFollowingCount(followData.following_count || 0)
              setFollowerCount(followData.follower_count || 0)
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
            {desktopSidebarNav.map((item) => {
              const href = (item as any).isProfile ? `/${userProfile?.username || ''}` : item.href
              const active = (item as any).isProfile
                ? pathname === `/${userProfile?.username || ''}`
                : item.active
              return (
                <Link key={item.label} href={href}>
                  <button
                    className={`w-full flex items-center gap-4 px-3 py-2.5 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                      active
                        ? isDark
                          ? "text-white font-semibold"
                          : "text-[#1E293B] font-semibold"
                        : isDark
                          ? "text-white/50 hover:bg-white/[0.06] hover:text-white"
                          : "text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                    }`}
                  >
                    <item.icon
                      size={24}
                      weight={active ? "fill" : "regular"}
                      className={active ? (isDark ? "text-[#818CF8]" : "text-[#6366F1]") : ""}
                    />
                    <span>{item.label === "my_profile" ? "My Profile" : item.label === "workspaces" ? "Workspaces" : t(`nav.${item.label}` as any)}</span>
                  </button>
                </Link>
              )
            })}
          </nav>

          {/* Profile Card */}
          <div className={`mt-auto mb-3 rounded-2xl border ${
            isDark ? "bg-white/[0.03] border-white/[0.06]" : "bg-white/80 border-slate-100 shadow-soft-card"
          }`}>
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <Skeleton className={`h-10 w-10 rounded-full ${isDark ? "bg-white/10" : "bg-[#EDF2F7]"}`} />
                  <div className="flex-1 space-y-1">
                    <Skeleton className={`h-3 w-20 ${isDark ? "bg-white/10" : "bg-[#EDF2F7]"}`} />
                    <Skeleton className={`h-2.5 w-14 ${isDark ? "bg-white/5" : "bg-[#EDF2F7]"}`} />
                  </div>
                </div>
              </div>
            ) : userProfile ? (
              <div className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Link href={`/${userProfile.username}`} className="shrink-0">
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? "bg-[#1B2436]" : "bg-[#EDF2F7]"}`}>
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                      ) : (
                        <UserCircle size={22} weight="bold" className={isDark ? "text-white/40" : "text-[#64748B]"} />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link href={`/${userProfile.username}`} className={`text-sm font-semibold truncate block hover:underline ${isDark ? "text-white" : "text-[#1E293B]"}`}>
                      {userProfile.full_name}
                    </Link>
                    <p className={`text-xs truncate ${isDark ? "text-white/30" : "text-[#64748B]"}`}>
                      @{userProfile.username}
                    </p>
                  </div>
                  <Link href="/settings">
                    <Gear size={16} weight="bold" className={`shrink-0 cursor-pointer transition-colors ${isDark ? "text-white/20 hover:text-white/40" : "text-[#94A3B8] hover:text-[#64748B]"}`} />
                  </Link>
                </div>
                <div className="flex items-center gap-4 text-sm mb-3">
                  <span className={`${isDark ? "text-white/30" : "text-[#64748B]"}`}>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-[#1E293B]"}`}>{followingCount}</span> Following
                  </span>
                  <span className={`${isDark ? "text-white/30" : "text-[#64748B]"}`}>
                    <span className={`font-semibold ${isDark ? "text-white" : "text-[#1E293B]"}`}>{followerCount}</span> Followers
                  </span>
                </div>
                <Link
                  href={`/${userProfile.username}`}
                  className={`block w-full text-center py-2 rounded-full text-sm font-semibold transition-colors border ${
                    isDark
                      ? "border-white/20 text-white hover:bg-white/[0.06]"
                      : "border-[#E2E8F0] text-[#1E293B] hover:bg-slate-100"
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
          "px-4 h-14 grid grid-cols-3 items-center",
          isDark ? "bg-[#0A0E18]/85 backdrop-blur-xl border-b border-white/[0.06]" : "bg-white/80 backdrop-blur-xl border-b border-slate-100"
        )}>
          <button
            onClick={() => setDrawerOpen(true)}
            className={`justify-self-start p-2 -ml-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#EDF2F7]"}`}
            aria-label="Open navigation menu"
          >
            <List size={22} weight="bold" className={isDark ? "text-white" : "text-[#1E293B]"} />
          </button>
          <Link href="/dashboard" className="justify-self-center">
            <img
              className={`h-7 ${isDark ? "invert" : ""}`}
              alt="Prompt & Pause"
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
            />
          </Link>
          <div className="justify-self-end flex items-center gap-1">
            <NotificationBell />
            <Link href="/settings">
              <button className={`p-2 -mr-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#EDF2F7]"}`} aria-label="Settings">
                <Gear size={20} weight="bold" className={isDark ? "text-white/50" : "text-[#64748B]"} />
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
            isDark ? "bg-[#0A0E18] border-r border-white/[0.06]" : "bg-white border-r border-slate-100"
          )}>
            <button
              onClick={() => setDrawerOpen(false)}
              className={`absolute top-3 right-3 p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10" : "hover:bg-[#EDF2F7]"}`}
              aria-label="Close navigation menu"
            >
              <X size={20} weight="bold" className={isDark ? "text-white/50" : "text-[#64748B]"} />
            </button>
            <nav className="flex-1 px-3 py-2 space-y-0.5">
              {sidebarNav.map((item) => {
                const href = (item as any).isProfile ? `/${userProfile?.username || ''}` : item.href
                const active = (item as any).isProfile
                  ? pathname === `/${userProfile?.username || ''}`
                  : item.active
                return (
                  <Link
                    key={item.label}
                    href={href}
                    onClick={() => setDrawerOpen(false)}
                  >
                    <button
                      className={`w-full flex items-center gap-4 px-3 py-3 rounded-xl text-[15px] font-medium transition-colors duration-150 ${
                        active
                          ? isDark
                            ? "text-white font-semibold"
                            : "text-[#1E293B] font-semibold"
                          : isDark
                            ? "text-white/50 hover:bg-white/[0.06] hover:text-white"
                            : "text-[#64748B] hover:bg-slate-100 hover:text-[#1E293B]"
                      }`}
                    >
                      <item.icon
                        size={22}
                        weight={active ? "fill" : "regular"}
                        className={active ? (isDark ? "text-[#818CF8]" : "text-[#6366F1]") : ""}
                      />
                      <span>{item.label === "my_profile" ? "My Profile" : item.label === "workspaces" ? "Workspaces" : t(`nav.${item.label}` as any)}</span>
                    </button>
                  </Link>
                )
              })}
            </nav>

            {/* ─── Mobile Drawer: Trends & Suggestions ─── */}
            <div className="px-3 space-y-3 pb-3">
              <div className={`border-t pt-3 ${isDark ? "border-white/[0.06]" : "border-[#EDF2F7]"}`}>
                <TrendingTopics />
              </div>
              <WhoToFollow />
            </div>

            {userProfile && (
              <div className={`px-4 py-4 border-t ${isDark ? "border-white/[0.06]" : "border-[#EDF2F7]"}`}>
                <div className="flex items-center gap-3">
                  <Link href={`/${userProfile.username}`} className="shrink-0" onClick={() => setDrawerOpen(false)}>
                    <div className={`h-9 w-9 rounded-full flex items-center justify-center ${isDark ? "bg-[#1B2436]" : "bg-[#EDF2F7]"}`}>
                      {userProfile.avatar_url ? (
                        <img src={userProfile.avatar_url} alt="" className="h-9 w-9 rounded-full object-cover" />
                      ) : (
                        <UserCircle size={20} weight="bold" className={isDark ? "text-white/40" : "text-[#64748B]"} />
                      )}
                    </div>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-[#1E293B]"}`}>{userProfile.full_name}</p>
                    <p className={`text-xs truncate ${isDark ? "text-white/40" : "text-[#64748B]"}`}>@{userProfile.username}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Mobile Bottom Tab Bar ─── */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-40 pb-[env(safe-area-inset-bottom,0px)] ${
        isDark ? "bg-[#0A0E18]/85 backdrop-blur-xl border-t border-white/[0.06]" : "bg-white/80 backdrop-blur-xl border-t border-slate-100"
      }`}>
        <div className="flex items-center justify-around h-14">
          {mobileNav.map((item) => (
            <Link key={item.id} href={item.href}>
              <button
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  item.active
                    ? isDark
                      ? "text-[#818CF8]"
                      : "text-[#6366F1]"
                    : isDark
                      ? "text-white/40"
                      : "text-[#64748B]"
                }`}
              >
                {createElement(item.icon, { size: 22, weight: item.active ? "fill" : "regular" })}
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
              </button>
            </Link>
          ))}
        </div>
      </div>
    </>
  )
}
