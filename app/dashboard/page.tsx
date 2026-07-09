"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTier } from "@/hooks/useTier"
import GlobalDataSync from "./components/global-data-sync"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import Link from "next/link"
import { useEffect, useState } from "react"
import { getSupabaseClient } from "@/lib/supabase/client"
import { trackEventOncePerSession } from "@/lib/services/eventsService"
import QuickStats from "./components/quick-stats"
import { Wind, Heart, NotebookPen, Sparkles, Crown } from "lucide-react"
import { useTranslation } from "@/hooks/useTranslation"
import dynamic from "next/dynamic"
import { motion } from "framer-motion"

const TodaysPrompt = dynamic(() => import("./components/todays-prompt"), { ssr: false })
const MoodTracker = dynamic(() => import("./components/mood-tracker"), { ssr: false })
const WeeklyReflectionCard = dynamic(() => import("./components/weekly-reflection-card"), { ssr: false })
const MonthlyReflectionCard = dynamic(() => import("./components/monthly-reflection-card"), { ssr: false })
const FromYourPastCard = dynamic(() => import("./components/from-your-past-card"), { ssr: false })
const ReturnToSelfCard = dynamic(() => import("./components/return-to-self-card"), { ssr: false })
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

    // Track a session start once per browser session so we can measure
    // return cohorts (D1/D7/D14) without spamming the events table.
    trackEventOncePerSession('session_start', 'session_start', {
      hour,
      tz_offset: new Date().getTimezoneOffset(),
    })

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
        className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}
      >
        {/* Global Data Sync */}
        <GlobalDataSync />

        {/* Layout: sidebar + main */}
        <div className="flex h-screen overflow-hidden">
          {/* Desktop Sidebar */}
          <DashboardSidebar />

          {/* Main Content — 2-column on desktop: main + info sidebar */}
          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-start">

                {/* ─── Left: Main Content ─── */}
                <div className="lg:col-span-8 space-y-6 md:space-y-8">

                  {/* Greeting Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
                        {t(greetingKey)}{userName ? `, ${userName}` : ''}
                      </h1>
                      <p className={`text-sm mt-1.5 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                        {t('dashboard.breatheMoment')}
                      </p>
                    </div>
                  </div>

                  {/* Return-to-Self Card — only shown to users coming back on a new day */}
                  <ReturnToSelfCard />

                  {/* Daily Quote Card */}
                  <DailyQuoteCard isDark={isDark} />

                  {/* Quick Actions Grid — 2×2 on mobile, 4-col on desktop */}
                  <div>
                    <h2 className={`text-base font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>{t('dashboard.quickActions')}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <QuickActionCard
                        icon={<Wind className="h-6 w-6" />}
                        label={t('dashboard.breathe')}
                        sublabel={t('dashboard.breatheSublabel')}
                        href="/dashboard/wellness?open=breathing"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-[#6EE7B7]/15' : 'bg-[#E8F5E9]'}
                        iconColor={isDark ? 'text-[#6EE7B7]' : 'text-[#059669]'}
                      />
                      <QuickActionCard
                        icon={<Heart className="h-6 w-6" />}
                        label={t('dashboard.checkIn')}
                        sublabel={t('dashboard.checkInSublabel')}
                        href="#mood-section"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-[#F472B6]/15' : 'bg-[#FCE7F3]'}
                        iconColor={isDark ? 'text-[#F472B6]' : 'text-[#DB2777]'}
                      />
                      <QuickActionCard
                        icon={<NotebookPen className="h-6 w-6" />}
                        label={t('dashboard.reflect')}
                        sublabel={t('dashboard.reflectSublabel')}
                        href="#prompt-section"
                        isDark={isDark}
                        iconBg={isDark ? 'bg-[#1D9BF0]/15' : 'bg-[#E8F5FE]'}
                        iconColor={isDark ? 'text-[#1D9BF0]' : 'text-[#1D9BF0]'}
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
                    <h2 className={`text-base font-semibold mb-3 ${isDark ? 'text-white/70' : 'text-[#536471]'}`}>{t('dashboard.todaysActivity')}</h2>
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
                  <SettingsLinkCard />

                  {/* Upgrade Banner (free users) */}
                  {tier !== 'premium' && (
                    <Link href="/dashboard/settings">
                      <div className={`rounded-2xl p-4 md:p-5 flex items-center gap-4 transition-all hover:scale-[1.01] ${isDark ? 'bg-[#C4B5E0]/10 border border-[#C4B5E0]/15' : 'bg-[#EDE7F6] border border-[#D1C4E9]'}`}>
                        <div className={`p-2.5 rounded-full flex-shrink-0 ${isDark ? 'bg-[#C4B5E0]/15' : 'bg-[#D1C4E9]'}`}>
                          <Crown className={`h-5 w-5 ${isDark ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{t('dashboard.upgrade')}</p>
                          <p className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>{t('dashboard.upgradeDesc')}</p>
                        </div>
                        <span className={`text-xs font-medium px-3 py-1.5 rounded-full flex-shrink-0 ${isDark ? 'bg-[#C4B5E0]/15 text-[#C4B5E0]' : 'bg-[#D1C4E9] text-[#5E4B8B]'}`}>Go</span>
                      </div>
                    </Link>
                  )}
                </div>

                {/* ─── Right: Info Sidebar (desktop) ─── */}
                <div className="hidden lg:block lg:col-span-4 space-y-4 lg:sticky lg:top-6">
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
    <div className={`rounded-2xl p-5 md:p-6 flex gap-4 relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-[#1D9BF0]/10 to-[#0085FF]/8 border border-[#1D9BF0]/12' : 'bg-gradient-to-br from-[#E8F5FE] to-[#F0F7FF] border border-[#B3D9F2]'}`}>
      <div className={`absolute top-3 left-4 text-4xl leading-none font-serif opacity-15 select-none ${isDark ? 'text-[#1D9BF0]' : 'text-[#1D9BF0]'}`}>&ldquo;</div>
      <div className={`w-1 flex-shrink-0 rounded-full ${isDark ? 'bg-gradient-to-b from-[#1D9BF0]/60 to-[#1D9BF0]/10' : 'bg-gradient-to-b from-[#1D9BF0] to-[#1D9BF0]/30'}`} />
      <div className="relative z-10">
        <p className={`text-base md:text-lg font-medium leading-relaxed ${isDark ? 'text-white/90' : 'text-[#0F1419]'}`}>
          &ldquo;{quote}&rdquo;
        </p>
        <p className={`text-xs mt-2.5 ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`}>{t('dashboard.dailyReminder')}</p>
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
  const cardClass = [
    'group relative overflow-hidden w-full text-left cursor-pointer',
    'rounded-2xl p-4 md:p-5 flex flex-col gap-3 border transition-colors duration-200',
    isDark
      ? 'bg-white/[0.04] border-white/[0.06] hover:bg-white/[0.08] hover:border-white/[0.12]'
      : 'bg-white/80 border-[#EFF3F4] hover:border-[#C8C4BC]',
    'shadow-[0_1px_2px_rgba(15,20,20,0.04)] hover:shadow-[0_14px_28px_-14px_rgba(15,20,20,0.18)]',
    'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6FA984]/40',
  ].join(' ')

  const content = (
    <>
      {/* Ambient hover glow */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-10 -right-10 h-24 w-24 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 bg-[#6FA984]/20"
      />
      <div
        className={`relative h-11 w-11 rounded-xl flex items-center justify-center transition-transform duration-200 group-hover:scale-[1.08] group-hover:shadow-md ${iconBg}`}
      >
        <span className={iconColor}>{icon}</span>
      </div>
      <div className="relative">
        <p className={`font-semibold text-sm tracking-tight ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
          {label}
        </p>
        <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>{sublabel}</p>
      </div>
    </>
  )

  const motionProps = {
    whileHover: { y: -2 },
    whileTap: { scale: 0.985 },
    transition: { type: 'spring' as const, stiffness: 420, damping: 26 },
  }

  if (isAnchor) {
    return (
      <motion.button
        {...motionProps}
        onClick={() => {
          const el = document.querySelector(href)
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }}
        className={cardClass}
      >
        {content}
      </motion.button>
    )
  }

  return (
    <motion.div {...motionProps}>
      <Link href={href} className={cardClass}>
        {content}
      </Link>
    </motion.div>
  )
}

/* ─── Info Card Shell ─── */
function InfoCard({ children, isDark, accent }: { children: React.ReactNode; isDark: boolean; accent?: string }) {
  return (
    <section className={`rounded-2xl p-5 transition-all duration-200 relative overflow-hidden ${
      isDark
        ? 'bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.06] hover:border-white/[0.1]'
        : 'bg-white/70 border border-[#EFF3F4] hover:border-[#EFF3F4] hover:shadow-sm'
    }`}>
      {accent && (
        <div className={`absolute top-0 left-0 w-full h-[2px] ${accent}`} />
      )}
      {children}
    </section>
  )
}

/* ─── How This Space Works ─── */
function HowItWorksCard({ isDark }: { isDark: boolean }) {
  const { t } = useTranslation()
  return (
    <InfoCard isDark={isDark} accent={isDark ? 'bg-gradient-to-r from-[#1D9BF0]/40 to-transparent' : 'bg-gradient-to-r from-[#1D9BF0]/30 to-transparent'}>
      <div className="space-y-2.5">
        <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold ${isDark ? 'text-white/35' : 'text-[#8B98A5]'}`}>
          {t('dashboard.howItWorks')}
        </p>
        <div className={`text-[13px] space-y-2.5 leading-relaxed ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
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
    <InfoCard isDark={isDark} accent={isDark ? 'bg-gradient-to-r from-[#1D9BF0]/40 to-transparent' : 'bg-gradient-to-r from-[#1D9BF0]/30 to-transparent'}>
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold ${isDark ? 'text-white/35' : 'text-[#8B98A5]'}`}>
            {t('dashboard.yourFocusAreas')}
          </p>
          <Link
            href="/dashboard/settings"
            className={`text-[11px] font-medium hover:underline underline-offset-4 ${isDark ? 'text-white/40 hover:text-white' : 'text-[#1D9BF0] hover:text-[#1A8CD8]'}`}
          >
            {t('common.edit')}
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(focusAreas && focusAreas.length > 0 ? focusAreas : [t('dashboard.addFocusAreas')]).map((area, idx) => (
            <span
              key={idx}
              className={`px-2.5 py-1 rounded-full text-[11px] font-medium ${
                isDark ? 'bg-white/[0.06] text-white/65 border border-white/[0.08]' : 'bg-white text-[#536471] border border-[#EFF3F4]'
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
    <InfoCard isDark={isDark} accent={isDark ? 'bg-gradient-to-r from-[#1D9BF0]/40 to-transparent' : 'bg-gradient-to-r from-[#1D9BF0]/30 to-transparent'}>
      <div className="space-y-2.5">
        <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold ${isDark ? 'text-white/35' : 'text-[#8B98A5]'}`}>
          {t('dashboard.whatToExpect')}
        </p>
        <div className={`text-[13px] space-y-2.5 leading-relaxed ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
          <p>{t('dashboard.dailyPromptExpect')}</p>
          {tier === 'premium' ? (
            <>
              <p className={isDark ? 'text-[#6EE7B7]/70' : 'text-[#059669]'}>{t('dashboard.weeklyReflectionExpect')}</p>
              <p className={isDark ? 'text-[#1D9BF0]/70' : 'text-[#1D9BF0]'}>{t('dashboard.monthlyReflectionExpect')}</p>
            </>
          ) : (
            <p className={`italic ${isDark ? 'text-white/25' : 'text-[#8B98A5]'}`}>{t('dashboard.premiumFeaturesNote')}</p>
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
        <p className={`text-[10px] uppercase tracking-[0.16em] font-semibold ${isDark ? 'text-white/35' : 'text-[#8B98A5]'}`}>
          {t('dashboard.needHelp')}
        </p>
        <p className={`text-[13px] leading-relaxed ${isDark ? 'text-white/60' : 'text-[#536471]'}`}>
          {t('dashboard.needHelpDesc')}
        </p>
      </div>
    </InfoCard>
  )
}
