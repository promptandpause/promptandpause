"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { HelpCircle, LogOut, Crown, Archive, Settings, LayoutDashboard, User, LifeBuoy, NotebookPen, Heart, Home, BookOpen, ChevronRight } from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTier } from "@/hooks/useTier"
import { useTranslation } from "@/hooks/useTranslation"
import { useTheme } from "@/contexts/ThemeContext"
import { 
  getCachedUserProfile, 
  cacheUserProfile,
  invalidateCacheOnLogout
} from "@/lib/services/cacheService"

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const supabase = getSupabaseClient()
  const { t } = useTranslation()
  const { theme } = useTheme()
  const { tier, features = {}, isLoading: tierLoading } = useTier()
  const [userProfile, setUserProfile] = useState<{ full_name: string; subscription_tier: string } | null>(null)
  const [loading, setLoading] = useState(true)

  const isDark = theme === 'dark'

  // Desktop navigation items
  const sidebarNav = [
    { icon: LayoutDashboard, label: "dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { icon: Heart, label: "wellness", href: "/dashboard/wellness", active: pathname === "/dashboard/wellness" },
    { icon: Archive, label: "archive", href: "/dashboard/archive", active: pathname === "/dashboard/archive" },
    { icon: NotebookPen, label: "my_journals", href: "/dashboard/journals", active: pathname === "/dashboard/journals" },
    { icon: Settings, label: "settings", href: "/dashboard/settings", active: pathname?.startsWith("/dashboard/settings") || false },
  ]

  // Mobile bottom tab items
  const mobileNav = [
    { id: "home", label: t('nav.dashboard'), href: "/dashboard", active: pathname === "/dashboard", crisis: false },
    { id: "wellness", label: t('nav.wellness'), href: "/dashboard/wellness", active: pathname === "/dashboard/wellness", crisis: false },
    { id: "journal", label: t('nav.my_journals'), href: "/dashboard/journals", active: pathname === "/dashboard/journals", crisis: false },
    { id: "crisis", label: t('nav.crisis_resources'), href: "/crisis-resources", active: pathname === "/crisis-resources", crisis: true },
  ]

  // Fetch user profile on mount
  useEffect(() => {
    let isMounted = true

    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        const cachedProfile = getCachedUserProfile(user.id)
        if (cachedProfile && isMounted) {
          setUserProfile({
            full_name: cachedProfile.full_name || user.email?.split('@')[0] || 'User',
            subscription_tier: tier
          })
          setLoading(false)
        }

        const response = await fetch('/api/user/profile')
        if (!response.ok) {
          if (!cachedProfile && isMounted) {
            setUserProfile({
              full_name: user.email?.split('@')[0] || 'User',
              subscription_tier: tier
            })
          }
          return
        }
        
        const { success, data } = await response.json()
        if (success && data && isMounted) {
          setUserProfile({
            full_name: data.full_name || user.email?.split('@')[0] || 'User',
            subscription_tier: tier
          })
          cacheUserProfile(data, user.id)
        } else if (!cachedProfile && isMounted) {
          setUserProfile({
            full_name: user.email?.split('@')[0] || 'User',
            subscription_tier: tier
          })
        }
      } catch (error) {
        const { data: { user } } = await supabase.auth.getUser()
        if (user && isMounted) {
          setUserProfile({
            full_name: user.email?.split('@')[0] || 'User',
            subscription_tier: tier
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
      {/* ─── Desktop Sidebar — Floating card, rounded-3xl, matches original structure ─── */}
      <div className="hidden md:block md:col-span-2 flex-shrink-0 p-4 pl-4 pr-0">
        <div
          className={`rounded-3xl p-6 h-fit sticky top-6 flex flex-col gap-6 transition-all duration-200 ${
            isDark
              ? 'bg-[#1A1F2E] border border-white/8 shadow-lg'
              : 'bg-[#FAFAF7] border border-[#E0DDD6] shadow-sm'
          }`}
        >
          {/* Logo + Tagline — centered */}
          <div className={`text-center pb-5 border-b ${isDark ? 'border-white/8' : 'border-[#E0DDD6]'}`}>
            <div className="flex items-center justify-center gap-2 mb-2">
              <img
                className={`h-10 ${isDark ? 'invert' : ''}`}
                alt="Prompt & Pause"
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              />
            </div>
            <p className={`text-xs font-medium tracking-wide ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
              Pause. Reflect. Grow.
            </p>
          </div>

          {/* User Profile */}
          <div className={`pb-5 border-b ${isDark ? 'border-white/8' : 'border-[#E0DDD6]'}`}>
            {loading ? (
              <div className="flex items-center gap-3">
                <Skeleton className={`h-12 w-12 rounded-full ${isDark ? 'bg-white/10' : 'bg-[#E8E5DE]'}`} />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className={`h-4 w-28 ${isDark ? 'bg-white/10' : 'bg-[#E8E5DE]'}`} />
                  <Skeleton className={`h-3 w-16 ${isDark ? 'bg-white/10' : 'bg-[#E8E5DE]'}`} />
                </div>
              </div>
            ) : userProfile ? (
              <div className="flex items-center gap-3">
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ring-2 ${
                  isDark
                    ? 'bg-gradient-to-br from-[#2A3550] to-[#1E2A40] ring-[#B8C9E0]/30'
                    : 'bg-gradient-to-br from-[#D4E4F7] to-[#E8D4F0] ring-[#B8C9E0]/50'
                }`}>
                  <User className={`h-6 w-6 ${isDark ? 'text-[#B8C9E0]' : 'text-[#5B7FA5]'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>
                    {userProfile.full_name}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {tier === 'premium' ? (
                      <span className={`text-xs font-medium flex items-center gap-1 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                        <Crown className="h-3 w-3" /> Premium
                      </span>
                    ) : (
                      <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>{t('settings.freeTier')}</span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {/* Navigation */}
          <nav className="flex-1">
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${isDark ? 'text-white/30' : 'text-[#8A8A7A]'}`}>
              {t('nav.dashboard')}
            </h4>
            <div className="space-y-1.5">
              {sidebarNav.map((item) => (
                <Link key={item.label} href={item.href}>
                  <button
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 border border-transparent ${
                      item.active
                        ? isDark
                          ? 'bg-[#B8C9E0]/15 text-white border-[#B8C9E0]/20'
                          : 'bg-[#D4E4F7]/50 text-[#3D6B8E] border-[#B8C9E0]/40'
                        : isDark
                          ? 'text-white/50 hover:bg-white/5 hover:text-white'
                          : 'text-[#6B6B5E] hover:bg-[#F0EDE6] hover:text-[#3D3D3D]'
                    }`}
                  >
                    <item.icon className="mr-1 h-5 w-5" />
                    {t(`nav.${item.label}` as any)}
                  </button>
                </Link>
              ))}
            </div>
          </nav>

          {/* Premium Upsell (free users only) */}
          {tier !== 'premium' && (
            <div className={`pt-5 border-t ${isDark ? 'border-white/8' : 'border-[#E0DDD6]'}`}>
              <div className={`rounded-2xl p-5 text-center space-y-4 ${
                isDark
                  ? 'bg-gradient-to-br from-[#2A2540] to-[#1E1A30] border-2 border-[#C4B5E0]/30 shadow-lg'
                  : 'bg-gradient-to-br from-[#F5F0FF] to-[#FFF5F0] border-2 border-[#C4B5E0]/40 shadow-lg'
              }`}>
                <div className="flex justify-center">
                  <div className={`p-3 rounded-full ${isDark ? 'bg-[#C4B5E0]/15' : 'bg-[#EDE7F6]'}`}>
                    <Crown className={`h-7 w-7 ${isDark ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'}`} />
                  </div>
                </div>
                <div>
                  <h4 className={`font-bold text-base mb-1 ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>{t('dashboard.upgrade')}</h4>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-white/50' : 'text-[#8A8A7A]'}`}>
                    {t('dashboard.upgradeDesc')}
                  </p>
                </div>
                <Link href="/dashboard/settings">
                  <button className={`w-full text-sm font-semibold h-10 rounded-lg transition-all duration-200 hover:brightness-110 hover:shadow-xl shadow-lg flex items-center justify-center gap-1 ${
                    isDark
                      ? 'bg-gradient-to-r from-[#7E6BA5] to-[#5B7FA5] text-white'
                      : 'bg-gradient-to-r from-[#7E6BA5] to-[#5B7FA5] text-white'
                  }`}>
                    {t('dashboard.upgrade')}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          )}

          {/* Support Section */}
          <div className={`pt-5 border-t ${isDark ? 'border-white/8' : 'border-[#E0DDD6]'}`}>
            <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${isDark ? 'text-white/30' : 'text-[#8A8A7A]'}`}>
              {t('nav.help')}
            </h4>
            <div className="space-y-1.5">
              <Link href="/crisis-resources">
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 border ${
                  isDark
                    ? 'text-rose-400 border-rose-500/20 hover:bg-rose-500/10'
                    : 'text-rose-600 border-rose-200 hover:bg-rose-50'
                }`}>
                  <LifeBuoy className="mr-1 h-5 w-5" />
                  {t('nav.crisis_resources')}
                </button>
              </Link>
              <Link href="/dashboard/support">
                <button className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isDark
                    ? 'text-white/50 hover:bg-white/5 hover:text-white'
                    : 'text-[#6B6B5E] hover:bg-[#F0EDE6] hover:text-[#3D3D3D]'
                }`}>
                  <HelpCircle className="mr-1 h-5 w-5" />
                  {t('nav.help')}
                </button>
              </Link>
              <button
                onClick={async () => {
                  invalidateCacheOnLogout()
                  await supabase.auth.signOut()
                  router.push('/auth')
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors duration-150 ${
                  isDark
                    ? 'text-white/50 hover:bg-rose-500/10 hover:text-rose-400'
                    : 'text-[#6B6B5E] hover:bg-rose-50 hover:text-rose-600'
                }`}
              >
                <LogOut className="mr-1 h-5 w-5" />
                {t('nav.logout')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile Top Nav Bar — Settings & Archive ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50">
        <div className={`px-5 h-14 flex items-center justify-between mt-[env(safe-area-inset-top,0px)] ${
          isDark
            ? 'bg-[#141820]/98 md:backdrop-blur-lg border-b border-white/5'
            : 'bg-white/98 md:backdrop-blur-lg border-b border-[#E8E5DE]'
        }`}>
          <img
            className={`h-6 ${isDark ? 'invert' : ''}`}
            alt="Prompt & Pause"
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
          />
          <div className="flex items-center -mr-2.5">
            <Link
              href="/dashboard/archive"
              className={`p-2.5 rounded-xl transition-colors ${
                pathname === '/dashboard/archive'
                  ? isDark ? 'bg-[#B8C9E0]/10 text-[#B8C9E0]' : 'bg-[#D4E4F7]/30 text-[#5B7FA5]'
                  : isDark ? 'text-white/40 hover:text-white/60' : 'text-[#6B6B5E] hover:text-[#3D3D3D] hover:bg-[#F0EDE6]'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 22H15C20 22 22 20 22 15V9C22 4 20 2 15 2H9C4 2 2 4 2 9V15C2 20 4 22 9 22Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 7.75V14.5C18 13.4 17.1 12.5 16 12.5H8C6.9 12.5 6 13.4 6 14.5V7.75C6 6.65 6.9 5.75 8 5.75H16C17.1 5.75 18 6.65 18 7.75Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M18 14.5V15.75H14.5C14.5 17.13 13.38 18.25 12 18.25C10.62 18.25 9.5 17.13 9.5 15.75H6V14.5C6 13.4 6.9 12.5 8 12.5H16C17.1 12.5 18 13.4 18 14.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link
              href="/dashboard/settings"
              className={`p-2.5 rounded-xl transition-colors ${
                pathname?.startsWith('/dashboard/settings')
                  ? isDark ? 'bg-[#B8C9E0]/10 text-[#B8C9E0]' : 'bg-[#D4E4F7]/30 text-[#5B7FA5]'
                  : isDark ? 'text-white/40 hover:text-white/60' : 'text-[#6B6B5E] hover:text-[#3D3D3D] hover:bg-[#F0EDE6]'
              }`}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12.8799V11.1199C2 10.0799 2.85 9.21994 3.9 9.21994C5.71 9.21994 6.45 7.93994 5.54 6.36994C5.02 5.46994 5.33 4.29994 6.24 3.77994L7.97 2.78994C8.76 2.31994 9.78 2.59994 10.25 3.38994L10.36 3.57994C11.26 5.14994 12.74 5.14994 13.65 3.57994L13.76 3.38994C14.23 2.59994 15.25 2.31994 16.04 2.78994L17.77 3.77994C18.68 4.29994 18.99 5.46994 18.47 6.36994C17.56 7.93994 18.3 9.21994 20.11 9.21994C21.15 9.21994 22.01 10.0699 22.01 11.1199V12.8799C22.01 13.9199 21.16 14.7799 20.11 14.7799C18.3 14.7799 17.56 16.0599 18.47 17.6299C18.99 18.5399 18.68 19.6999 17.77 20.2199L16.04 21.2099C15.25 21.6799 14.23 21.3999 13.76 20.6099L13.65 20.4199C12.75 18.8499 11.27 18.8499 10.36 20.4199L10.25 20.6099C9.78 21.3999 8.76 21.6799 7.97 21.2099L6.24 20.2199C5.33 19.6999 5.02 18.5299 5.54 17.6299C6.45 16.0599 5.71 14.7799 3.9 14.7799C2.85 14.7799 2 13.9199 2 12.8799Z" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
        </div>
      </div>

      {/* ─── Mobile Bottom Tab Bar — Floating, rounded ─── */}
      <div className="md:hidden fixed bottom-2 left-3 right-3 z-50">
        <div className={`rounded-2xl shadow-lg ${
          isDark
            ? 'bg-[#1A1F2E] border-t border-white/8'
            : 'bg-white border-t border-[#E0DDD6] shadow-[#D4D0C8]/30'
        }`}>
          <div className="flex justify-around items-center h-16 px-2">
            {mobileNav.map((item) => {
              const iconColor = item.crisis
                ? isDark ? 'text-rose-400' : 'text-rose-500'
                : item.active
                  ? isDark ? 'text-[#B8C9E0]' : 'text-[#5B7FA5]'
                  : isDark ? 'text-white/30' : 'text-[#A0A090]'
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-xl transition-colors ${
                    item.active && !item.crisis
                      ? isDark ? 'bg-[#B8C9E0]/10' : 'bg-[#D4E4F7]/30'
                      : ''
                  }`}
                >
                  <span className={iconColor}>
                    <MobileNavIcon id={item.id} />
                  </span>
                  <span className={`text-[10px] font-semibold ${iconColor}`}>
                    {item.label}
                  </span>
                </Link>
              )
            })}
          </div>
        </div>
        {/* Safe area spacer for notched phones */}
        <div className="h-[env(safe-area-inset-bottom,0px)]" />
      </div>
    </>
  )
}

/* ─── Vuesax Linear SVG Icons for Mobile Nav ─── */
function MobileNavIcon({ id }: { id: string }) {
  const size = 22
  switch (id) {
    case "home":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 18V15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10.0698 2.82009L3.13978 8.37009C2.35978 8.99009 1.85978 10.3001 2.02978 11.2801L3.35978 19.2401C3.59978 20.6601 4.95978 21.8101 6.39978 21.8101H17.5998C19.0298 21.8101 20.3998 20.6501 20.6398 19.2401L21.9698 11.2801C22.1298 10.3001 21.6298 8.99009 20.8598 8.37009L13.9298 2.83009C12.8598 1.97009 11.1298 1.97009 10.0698 2.82009Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "wellness":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12.62 20.8101C12.28 20.9301 11.72 20.9301 11.38 20.8101C8.48 19.8201 2 15.6901 2 8.6901C2 5.6001 4.49 3.1001 7.56 3.1001C9.38 3.1001 10.99 3.9801 12 5.3401C13.01 3.9801 14.63 3.1001 16.44 3.1001C19.51 3.1001 22 5.6001 22 8.6901C22 15.6901 15.52 19.8201 12.62 20.8101Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "journal":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22 16.7399V4.66994C22 3.46994 21.02 2.57994 19.83 2.67994H19.77C17.67 2.85994 14.48 3.92994 12.7 5.04994L12.53 5.15994C12.24 5.33994 11.76 5.33994 11.47 5.15994L11.22 5.00994C9.44 3.89994 6.26 2.83994 4.16 2.66994C2.97 2.56994 2 3.46994 2 4.65994V16.7399C2 17.6999 2.78 18.5999 3.74 18.7199L4.03 18.7599C6.2 19.0499 9.55 20.1499 11.47 21.1999L11.51 21.2199C11.78 21.3699 12.21 21.3699 12.47 21.2199C14.39 20.1599 17.75 19.0499 19.93 18.7599L20.26 18.7199C21.22 18.5999 22 17.6999 22 16.7399Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 5.48999V20.49" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7.75 8.48999H5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M8.5 11.49H5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    case "crisis":
      return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 9V14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.9999 21.41H5.93993C2.46993 21.41 1.01993 18.93 2.69993 15.9L5.81993 10.28L8.75993 5.00003C10.5399 1.79003 13.4599 1.79003 15.2399 5.00003L18.1799 10.29L21.2999 15.91C22.9799 18.94 21.5199 21.42 18.0599 21.42H11.9999V21.41Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M11.9946 17H12.0036" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    default:
      return null
  }
}
