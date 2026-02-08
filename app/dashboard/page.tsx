"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTier } from "@/hooks/useTier"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import QuickStats from "./components/quick-stats"
import { Wind, Heart, NotebookPen, Sparkles, Crown } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import dynamic from "next/dynamic"

const TodaysPrompt = dynamic(() => import("./components/todays-prompt"), { ssr: false })
const MoodTracker = dynamic(() => import("./components/mood-tracker"), { ssr: false })
const WeeklyReflectionCard = dynamic(() => import("./components/weekly-reflection-card"), { ssr: false })
const MonthlyReflectionCard = dynamic(() => import("./components/monthly-reflection-card"), { ssr: false })
const FromYourPastCard = dynamic(() => import("./components/from-your-past-card"), { ssr: false })
const YourRhythm = dynamic(() => import("./components/your-rhythm"), { ssr: false })
const SettingsLinkCard = dynamic(() => import("./components/settings-link-card"), { ssr: false })
const HistorySearchCard = dynamic(() => import("./components/history-search-card"), { ssr: false })
const PushNotificationPrompt = dynamic(() => import("@/components/notifications/PushNotificationPrompt").then(mod => ({ default: mod.PushNotificationPrompt })), { ssr: false })

export default function DashboardPage() {
  const { tier, features = {} } = useTier()
  const { theme } = useTheme()
  const { t } = useTranslation()
  const supabase = getSupabaseClient()
  const [userName, setUserName] = useState("")
  const [greetingKey, setGreetingKey] = useState<'dashboard.goodMorning' | 'dashboard.goodAfternoon' | 'dashboard.goodEvening'>('dashboard.goodMorning')

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour < 12) setGreetingKey('dashboard.goodMorning')
    else if (hour < 18) setGreetingKey('dashboard.goodAfternoon')
    else setGreetingKey('dashboard.goodEvening')

    async function loadName() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const res = await fetch('/api/user/profile')
        if (res.ok) {
          const { data } = await res.json()
          setUserName(data?.full_name?.split(' ')[0] || '')
        }
      } catch {}
    }
    loadName()
  }, [supabase])

  const isDark = theme === 'dark'

  return (
    <AuthGuard redirectPath="/dashboard">
      <div 
        data-dashboard
        className={`min-h-screen ${isDark ? 'bg-[#141820]' : 'bg-[#F5F3EE]'}`}
      >
        {/* Global Data Sync */}
        <GlobalDataSync />

        {/* Layout: sidebar + main */}
        <div className="flex items-start min-h-screen">
          {/* Desktop Sidebar */}
          <DashboardSidebar />

          {/* Main Content — 2-column on desktop: main + info sidebar */}
          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto min-h-screen">
            <div className="max-w-[1200px] mx-auto px-4 md:px-6 pt-16 md:pt-10">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-6 items-start">

                {/* ─── Left: Main Content ─── */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">

                  {/* Greeting Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>
                        {t(greetingKey)}{userName ? `, ${userName}` : ''}
                      </h1>
                      <p className={`text-sm mt-1.5 ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
                        {t('dashboard.breatheMoment')}
                      </p>
                    </div>
                  </div>

                  {/* Daily Quote Card */}
                  <DailyQuoteCard isDark={isDark} />

                  {/* Quick Actions Grid — 2×2 on mobile, 4-col on desktop */}
                  <div>
                    <h2 className={`text-base font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>{t('dashboard.quickActions')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <QuickActionCard
                        icon={<Wind className="h-6 w-6" />}
                        label={t('dashboard.breathe')}
                        sublabel={t('dashboard.breatheSublabel')}
                        href="/dashboard/wellness?open=breathing"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-[#A8D5BA]/15' : 'bg-[#E8F5E9]'}
                        iconColor={isDark ? 'text-[#A8D5BA]' : 'text-[#5A8F6E]'}
                      />
                      <QuickActionCard
                        icon={<Heart className="h-6 w-6" />}
                        label={t('dashboard.checkIn')}
                        sublabel={t('dashboard.checkInSublabel')}
                        href="#mood-section"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-[#C4B5E0]/15' : 'bg-[#EDE7F6]'}
                        iconColor={isDark ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'}
                      />
                      <QuickActionCard
                        icon={<NotebookPen className="h-6 w-6" />}
                        label={t('dashboard.reflect')}
                        sublabel={t('dashboard.reflectSublabel')}
                        href="#prompt-section"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-[#B8C9E0]/15' : 'bg-[#D4E4F7]'}
                        iconColor={isDark ? 'text-[#B8C9E0]' : 'text-[#5B7FA5]'}
                      />
                      <QuickActionCard
                        icon={<Sparkles className="h-6 w-6" />}
                        label={t('dashboard.gratitude')}
                        sublabel={t('dashboard.gratitudeSublabel')}
                        href="/dashboard/wellness?open=gratitude"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-amber-500/15' : 'bg-amber-50'}
                        iconColor={isDark ? 'text-amber-400' : 'text-amber-600'}
                      />
                    </div>
                  </div>

                  {/* Today's Activity */}
                  <div>
                    <h2 className={`text-base font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>{t('dashboard.todaysActivity')}</h2>
                    <QuickStats />
                  </div>

                  {/* Mood Check-In */}
                  <div id="mood-section">
                    <MoodTracker />
                  </div>

                  {/* Daily Prompt */}
                  <div id="prompt-section">
                    <TodaysPrompt />
                  </div>

                  {/* Premium Sections */}
                  {tier === 'premium' && <WeeklyReflectionCard />}
                  {tier === 'premium' && <MonthlyReflectionCard />}
                  {tier === 'premium' && <FromYourPastCard />}
                  <YourRhythm />
                  <SettingsLinkCard />

                  {/* Upgrade Banner (free users) */}
                  {tier !== 'premium' && (
                    <Link href="/dashboard/settings">
                      <div className={`rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all hover:scale-[1.01] ${isDark ? 'bg-[#C4B5E0]/10 border border-[#C4B5E0]/15' : 'bg-[#EDE7F6] border border-[#D1C4E9]'}`}>
                        <div className={`p-2.5 rounded-full flex-shrink-0 ${isDark ? 'bg-[#C4B5E0]/15' : 'bg-[#D1C4E9]'}`}>
                          <Crown className={`h-5 w-5 ${isDark ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>{t('dashboard.upgrade')}</p>
                          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>{t('dashboard.upgradeDesc')}</p>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${isDark ? 'bg-[#C4B5E0]/15 text-[#C4B5E0]' : 'bg-[#D1C4E9] text-[#5E4B8B]'}`}>Go</span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* ─── Right: Info Sidebar (desktop) ─── */}
                <div className="hidden lg:block lg:col-span-4 space-y-5 lg:sticky lg:top-8">
                  <HowItWorksCard isDark={isDark} />
                  <FocusAreasCard isDark={isDark} />
                  <ExpectationsCard isDark={isDark} tier={tier} />
                  <NeedHelpCard isDark={isDark} />
                  <HistorySearchCard />
                </div>

              </div>
            </div>
          </main>
        </div>

        {/* Push Notification Prompt */}
        <PushNotificationPrompt />
      </div>
    </AuthGuard>
  )
}

/* ─── Daily Quote Card ─── */
function DailyQuoteCard({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  const quotes = [
    "You're doing great—one step at a time.",
    "Be gentle with yourself today.",
    "Every small step counts.",
    "You are enough, just as you are.",
    "Progress, not perfection.",
    "You've already handled hard things before.",
  ]
  const [quote, setQuote] = useState(quotes[0])

  useEffect(() => {
    const controller = new AbortController()
    const today = new Date()
    const seed = Number(
      `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(
        today.getDate()
      ).padStart(2, "0")}`
    )
    const todayKey = today.toISOString().split("T")[0]
    setQuote(quotes[seed % quotes.length])

    const cachedText = typeof window !== "undefined"
      ? window.localStorage.getItem("dailyAffirmationText")
      : null
    const cachedDate = typeof window !== "undefined"
      ? window.localStorage.getItem("dailyAffirmationDate")
      : null
    if (cachedText && cachedDate === todayKey) {
      setQuote(cachedText)
      return () => controller.abort()
    }

    async function loadAffirmation() {
      try {
        const res = await fetch("/api/affirmations/daily", {
          signal: controller.signal,
        })
        if (!res.ok) return
        const data = await res.json()
        if (data?.text) {
          setQuote(data.text)
          if (typeof window !== "undefined") {
            window.localStorage.setItem("dailyAffirmationText", data.text)
            window.localStorage.setItem("dailyAffirmationDate", todayKey)
          }
        }
      } catch {}
    }

    loadAffirmation()
    return () => controller.abort()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className={`rounded-2xl p-5 md:p-6 flex gap-4 ${isDark ? 'bg-[#A8D5BA]/8 border border-[#A8D5BA]/10' : 'bg-[#F0F7F2] border border-[#D5E8DA]'}`}>
      <div className={`w-1 flex-shrink-0 rounded-full ${isDark ? 'bg-[#A8D5BA]/40' : 'bg-[#8ABF9A]'}`} />
      <div>
        <p className={`text-base md:text-lg font-medium leading-relaxed ${isDark ? 'text-white/85' : 'text-[#3D4D3D]'}`}>
          &ldquo;{quote}&rdquo;
        </p>
        <p className={`text-xs mt-2.5 ${isDark ? 'text-white/30' : 'text-[#8A9A8A]'}`}>{t('dashboard.dailyReminder')}</p>
      </div>
    </div>
  )
}

/* ─── Quick Action Card ─── */
function QuickActionCard({
  icon,
  label,
  sublabel,
  href,
  isDark,
  iconBg,
  iconColor,
}: {
  icon: React.ReactNode
  label: string
  sublabel: string
  href: string
  isDark: boolean
  iconBg: string
  iconColor: string
}) {
  const isAnchor = href.startsWith('#')
  const cardClass = `rounded-2xl p-4 md:p-5 flex flex-col gap-3 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer group text-left ${
    isDark
      ? 'bg-white/5 border border-white/8 hover:bg-white/10 hover:border-white/12'
      : 'bg-[#FAFAF7] border border-[#E8E5DE] hover:border-[#C8C4BC] hover:shadow-md'
  }`
  const content = (
    <>
      <div className={`h-12 w-12 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${iconBg}`}>
        <span className={iconColor}>{icon}</span>
      </div>
      <div>
        <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#3D3D3D]'}`}>{label}</p>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>{sublabel}</p>
      </div>
    </>
  )

  if (isAnchor) {
    return (
      <button
        onClick={() => {
          const el = document.querySelector(href)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        className={cardClass}
      >
        {content}
      </button>
    )
  }

  return (
    <Link href={href} className={cardClass}>
      {content}
    </Link>
  )
}

/* ─── Info Card Shell ─── */
function InfoCard({ children, isDark }: { children: React.ReactNode; isDark: boolean }) {
  return (
    <section className={`rounded-2xl p-5 md:p-6 transition-all ${isDark ? 'bg-white/5 border border-white/8' : 'bg-[#FAFAF7] border border-[#E8E5DE]'}`}>
      {children}
    </section>
  )
}

/* ─── How This Space Works ─── */
function HowItWorksCard({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  return (
    <InfoCard isDark={isDark}>
      <div className="space-y-2.5">
        <p className={`text-xs uppercase tracking-[0.14em] font-medium ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
          {t('dashboard.howItWorks')}
        </p>
        <div className={`text-sm space-y-2 leading-relaxed ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>
          <p>{t('dashboard.howItWorks1')}</p>
          <p>{t('dashboard.howItWorks2')}</p>
          <p>{t('dashboard.howItWorks3')}</p>
        </div>
      </div>
    </InfoCard>
  )
}

/* ─── Your Focus Areas ─── */
function FocusAreasCard({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  const supabase = getSupabaseClient()
  const [focusAreas, setFocusAreas] = useState<string[] | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data } = await supabase
          .from("user_preferences")
          .select("focus_areas")
          .eq("user_id", user.id)
          .single()
        if (mounted) setFocusAreas((data as any)?.focus_areas || [])
      } catch {
        if (mounted) setFocusAreas([])
      }
    })()
    return () => { mounted = false }
  }, [supabase])

  return (
    <InfoCard isDark={isDark}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-xs uppercase tracking-[0.14em] font-medium ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
            {t('dashboard.yourFocusAreas')}
          </p>
          <Link
            href="/dashboard/settings"
            className={`text-xs hover:underline underline-offset-4 ${isDark ? 'text-white/40 hover:text-white' : 'text-[#5B7FA5] hover:text-[#3D6B8E]'}`}
          >
            {t('common.edit')}
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {(focusAreas && focusAreas.length > 0 ? focusAreas : [t('dashboard.addFocusAreas')]).map((area, idx) => (
            <span
              key={idx}
              className={`px-3 py-1.5 rounded-full text-xs ${
                isDark ? 'bg-white/8 text-white/70 border border-white/8' : 'bg-white text-[#5A5A4E] border border-[#E8E5DE]'
              }`}
            >
              {area}
            </span>
          ))}
        </div>
      </div>
    </InfoCard>
  )
}

/* ─── What to Expect ─── */
function ExpectationsCard({ isDark, tier }: { isDark: boolean; tier: string }) {
  const { t } = useTranslation()
  return (
    <InfoCard isDark={isDark}>
      <div className="space-y-2.5">
        <p className={`text-xs uppercase tracking-[0.14em] font-medium ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
          {t('dashboard.whatToExpect')}
        </p>
        <div className={`text-sm space-y-2 leading-relaxed ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>
          <p>{t('dashboard.dailyPromptExpect')}</p>
          {tier === 'premium' ? (
            <>
              <p>{t('dashboard.weeklyReflectionExpect')}</p>
              <p>{t('dashboard.monthlyReflectionExpect')}</p>
            </>
          ) : (
            <p className={`italic ${isDark ? 'text-white/30' : 'text-[#A0A090]'}`}>{t('dashboard.premiumFeaturesNote')}</p>
          )}
        </div>
      </div>
    </InfoCard>
  )
}

/* ─── Need Help? ─── */
function NeedHelpCard({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  return (
    <InfoCard isDark={isDark}>
      <div className="space-y-2.5">
        <p className={`text-xs uppercase tracking-[0.14em] font-medium ${isDark ? 'text-white/40' : 'text-[#8A8A7A]'}`}>
          {t('dashboard.needHelp')}
        </p>
        <p className={`text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-[#5A5A4E]'}`}>
          {t('dashboard.needHelpDesc')}
        </p>
      </div>
    </InfoCard>
  )
}
