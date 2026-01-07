"use client"

import { useState, useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronRight, HelpCircle, LogOut, Crown, Archive, Settings, LayoutDashboard, User, LifeBuoy, NotebookPen } from "lucide-react"
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

  // Navigation items with active state based on current pathname
  const sidebarNav = [
    { icon: LayoutDashboard, label: "dashboard", href: "/dashboard", active: pathname === "/dashboard" },
    { icon: Archive, label: "archive", href: "/dashboard/archive", active: pathname === "/dashboard/archive" },
    { icon: NotebookPen, label: "my_journals", href: "/dashboard/journals", active: pathname === "/dashboard/journals" },
    { icon: Settings, label: "settings", href: "/dashboard/settings", active: pathname?.startsWith("/dashboard/settings") || false },
  ]

  // Fetch user profile on mount
  useEffect(() => {
    let isMounted = true

    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user || !isMounted) return

        // 1. LOAD FROM CACHE FIRST (instant UI)
        const cachedProfile = getCachedUserProfile(user.id)
        if (cachedProfile && isMounted) {
          setUserProfile({
            full_name: cachedProfile.full_name || user.email?.split('@')[0] || 'User',
            subscription_tier: tier
          })
          setLoading(false) // Show UI immediately
        }

        // 2. FETCH FRESH DATA IN BACKGROUND
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
          const profileData = {
            full_name: data.full_name || user.email?.split('@')[0] || 'User',
            subscription_tier: tier
          }
          setUserProfile(profileData)
          cacheUserProfile(data, user.id) // Cache for next time
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
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadUserProfile()
    return () => { isMounted = false }
  }, [supabase, tier])

  return (
    <>
      {/* Desktop Sidebar */}
      <Card className={`hidden md:flex md:col-span-2 rounded-3xl p-6 h-fit sticky top-6 flex-col gap-6 transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg' : 'glass-medium shadow-soft-md'}`}>
        {/* Logo Section */}
        <div className={`text-center pb-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'}`}>
          <div className="flex items-center justify-center gap-2 mb-2">
            <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" className={`h-12 ${theme === 'dark' ? 'invert' : ''}`} alt="Prompt & Pause" />
          </div>
          <p className={`text-xs font-medium tracking-wide ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>Pause. Reflect. Grow.</p>
        </div>

        {/* User Profile Display */}
        <div className={`pb-4 border-b ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'}`}>
          {loading ? (
            <div className="flex items-center gap-3">
              <Skeleton className={`h-12 w-12 rounded-full ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
              <div className="flex-1 space-y-2">
                <Skeleton className={`h-4 w-28 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
                <Skeleton className={`h-3 w-20 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`} />
              </div>
            </div>
          ) : userProfile ? (
            <div className="flex items-center gap-3">
              <div className={`h-12 w-12 rounded-full flex items-center justify-center ring-2 ${theme === 'dark' ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 ring-purple-400/30' : 'bg-gradient-to-br from-purple-100 to-pink-100 ring-purple-200'}`}>
                <User className={`h-6 w-6 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{userProfile.full_name}</p>
                <div className="flex items-center gap-1 mt-1">
                  {tier === 'premium' ? (
                    <span className={`text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 font-medium ${theme === 'dark' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' : 'bg-yellow-100 text-yellow-700 border border-yellow-300'}`}>
                      <Crown className="h-3 w-3" />
                      Premium
                    </span>
                  ) : (
                    <span className={`text-xs font-medium ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Free Tier</span>
                  )}
                </div>
              </div>
            </div>
          ) : null}
        </div>

        {/* Main Navigation */}
        <nav className="flex-1">
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Navigation</h4>
          <div className="space-y-1.5">
            {sidebarNav.map((item) => (
              <Link key={item.label} href={item.href}>
                <Button
                  variant="ghost"
                  className={`w-full justify-start text-sm font-medium transition-all duration-300 h-12 rounded-xl ${
                    item.active 
                      ? theme === 'dark'
                        ? "bg-white/10 text-white shadow-lg border border-white/20"
                        : "bg-purple-100 text-purple-900 shadow-md border border-purple-300"
                      : theme === 'dark'
                        ? "text-white/60 hover:bg-white/10 hover:text-white hover:border hover:border-white/20"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border hover:border-gray-300"
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {t(`nav.${item.label}` as any)}
                </Button>
              </Link>
            ))}
          </div>
        </nav>

        {/* Only show premium upsell if user is on free tier */}
        {!loading && tier !== 'premium' && (
          <div className={`pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'}`}>
            <Card className={`rounded-2xl p-5 ${theme === 'dark' ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border-2 border-yellow-500/30 shadow-2xl shadow-yellow-500/20' : 'bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-400 shadow-lg'}`}>
              <div className="text-center space-y-4">
                <div className="flex justify-center">
                  <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-yellow-500/30' : 'bg-yellow-100'}`}>
                    <Crown className={`h-7 w-7 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                  </div>
                </div>
                <div>
                  <h4 className={`font-bold text-base mb-1 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Upgrade to Premium</h4>
                  <p className={`text-xs leading-relaxed ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>Unlock unlimited prompts & advanced insights</p>
                </div>
                <Link href="/dashboard/settings">
                  <Button
                    size="sm"
                    className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 transition-all duration-300 hover:scale-105 text-sm font-semibold h-10 shadow-lg"
                  >
                    Upgrade Now
                    <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        )}

        {/* Support & Account Section */}
        <div className={`pt-4 border-t ${theme === 'dark' ? 'border-white/10' : 'border-gray-300'}`}>
          <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 px-1 ${theme === 'dark' ? 'text-white/40' : 'text-gray-500'}`}>Support</h4>
          <div className="space-y-1.5">
            <Link href="/crisis-resources">
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm font-medium transition-all duration-300 h-12 rounded-xl shadow-sm ${theme === 'dark' ? 'text-red-400 hover:bg-red-500/20 hover:text-red-300 border border-red-500/30 hover:border-red-400/50' : 'text-red-600 hover:bg-red-50 hover:text-red-700 border border-red-300 hover:border-red-400'}`}
              >
                <LifeBuoy className="mr-3 h-5 w-5" />
                Crisis Resources
              </Button>
            </Link>
            <Link href="/dashboard/support">
              <Button
                variant="ghost"
                className={`w-full justify-start text-sm font-medium transition-all duration-300 h-12 rounded-xl ${theme === 'dark' ? 'text-white/60 hover:bg-white/10 hover:text-white hover:border hover:border-white/20' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 hover:border hover:border-gray-300'}`}
              >
                <HelpCircle className="mr-3 h-5 w-5" />
                Contact Support
              </Button>
            </Link>
            <Button
              variant="ghost"
              onClick={async () => {
                invalidateCacheOnLogout() // Clear all cached data
                await supabase.auth.signOut()
                router.push('/auth')
              }}
              className={`w-full justify-start text-sm font-medium transition-all duration-300 h-12 rounded-xl ${theme === 'dark' ? 'text-white/60 hover:bg-red-500/20 hover:text-red-400 hover:border hover:border-red-500/30' : 'text-gray-600 hover:bg-red-50 hover:text-red-600 hover:border hover:border-red-300'}`}
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </Card>

      {/* Mobile Navigation - Bottom fixed bar */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 p-3 pb-6 z-50 safe-area-bottom transition-all duration-200 ${theme === 'dark' ? 'glass-light shadow-soft-lg border-t border-white/10' : 'glass-heavy shadow-soft-lg border-t border-gray-200/50'}`}>
        <div className="flex justify-around items-center">
          {sidebarNav.map((item) => (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1">
              <item.icon className={`h-5 w-5 ${
                item.active 
                  ? theme === 'dark' ? "text-white" : "text-gray-900"
                  : theme === 'dark' ? "text-white/50" : "text-gray-500"
              }`} />
              <span className={`text-[10px] ${
                item.active 
                  ? theme === 'dark' ? "text-white font-medium" : "text-gray-900 font-medium"
                  : theme === 'dark' ? "text-white/50" : "text-gray-500"
              }`}>
                {t(`nav.${item.label}` as any)}
              </span>
            </Link>
          ))}
          {/* Crisis Resources Link */}
          <Link href="/crisis-resources" className="flex flex-col items-center gap-1">
            <LifeBuoy className={`h-5 w-5 ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`} />
            <span className={`text-[10px] font-medium ${theme === 'dark' ? 'text-red-400' : 'text-red-600'}`}>
              Crisis
            </span>
          </Link>
        </div>
      </div>
    </>
  )
}
