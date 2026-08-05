'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeart,
  faWind,
  faBullseye,
  faCircleCheck,
  faChartColumn,
  faWandMagicSparkles,
  faLock,
  faCrown,
  faArrowRight,
  faLeaf,
  faSun,
  faArrowTrendUp,
  faArrowTrendDown,
  faMinus,
} from '@fortawesome/free-solid-svg-icons'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTier } from '@/hooks/useTier'
import { useTheme } from '@/contexts/ThemeContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { TierGate } from '@/components/tier/TierGate'
import { DashboardSidebar } from '../components/DashboardSidebar'
import { supabaseReflectionService } from '@/lib/services/supabaseReflectionService'
import { calculateMoodTrends } from '@/lib/services/analyticsService'
import { getTotalGratitudeCount, getGratitudeHistory } from '@/lib/services/gratitudeService'
import { getHabits, getTodayHabitLogs } from '@/lib/services/habitsService'
import dynamic from 'next/dynamic'

// Lazy-load wellness components — only rendered inside dialogs
const CrisisSupport = dynamic(() => import('@/components/wellness/CrisisSupport'), { ssr: false })
const BreathingExercise = dynamic(() => import('@/components/wellness/BreathingExercise'), { ssr: false })
const WeeklyMoodInsights = dynamic(() => import('@/components/wellness/WeeklyMoodInsights'), { ssr: false })
const GratitudeEntry = dynamic(() => import('@/components/wellness/GratitudeEntry'), { ssr: false })
const GoalsDashboard = dynamic(() => import('@/components/wellness/GoalsDashboard'), { ssr: false })
const HabitsTracker = dynamic(() => import('@/components/wellness/HabitsTracker'), { ssr: false })

const MOOD_SCORE: Record<string, number> = {
  '😔': 1, '😐': 2, '🤔': 3, '😊': 4, '😄': 5, '😌': 4, '🙏': 4, '💪': 5,
}

export default function WellnessPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userCountry, setUserCountry] = useState('UK')
  const [showCrisisDialog, setShowCrisisDialog] = useState(false)
  const [showBreathingDialog, setShowBreathingDialog] = useState(false)
  const [showGratitudeDialog, setShowGratitudeDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')

  // Overview stats
  const [statsReady, setStatsReady] = useState(false)
  const [daysThisWeek, setDaysThisWeek] = useState(0)
  const [daysDelta, setDaysDelta] = useState(0)
  const [gratitudeTotal, setGratitudeTotal] = useState(0)
  const [gratitudeThisWeek, setGratitudeThisWeek] = useState(0)
  const [moodTrend, setMoodTrend] = useState<'improving' | 'declining' | 'stable'>('stable')
  const [habitsTotal, setHabitsTotal] = useState(0)
  const [habitsDone, setHabitsDone] = useState(0)
  const [calmData, setCalmData] = useState<{ label: string; value: number | null }[]>([])
  
  const { tier, isLoading: tierLoading } = useTier()
  const isPremium = tier === 'premium'
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()

  const loadUser = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserId(user.id)
      
      // Get user's country from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('country_code')
        .eq('id', user.id)
        .single()
      
      if (profile?.country_code) {
        setUserCountry(profile.country_code)
      }
    }
  }, [supabase])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  // Auto-open dialogs from query params (e.g. ?open=breathing from dashboard quick actions)
  useEffect(() => {
    const openParam = searchParams.get('open')
    if (openParam === 'breathing') setShowBreathingDialog(true)
    if (openParam === 'gratitude') setShowGratitudeDialog(true)
  }, [searchParams])

  // Load overview stats once the user is known
  useEffect(() => {
    if (!userId) return
    const uid = userId
    let isMounted = true

    async function loadStats() {
      try {
        const reflections = await supabaseReflectionService.getAllReflections()

        if (!isMounted) return

        // Start of this week (Mon) and previous week
        const now = new Date()
        const dayOfWeek = now.getDay()
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
        const monday = new Date(now)
        monday.setDate(now.getDate() - mondayOffset)
        monday.setHours(0, 0, 0, 0)
        const lastMonday = new Date(monday)
        lastMonday.setDate(lastMonday.getDate() - 7)

        const toDayKey = (d: Date) => d.toISOString().split('T')[0]
        const mondayKey = toDayKey(monday)
        const lastMondayKey = toDayKey(lastMonday)

        const thisWeek = reflections.filter(r => (r.created_at || r.date).slice(0, 10) >= mondayKey)
        const lastWeek = reflections.filter(r => {
          const k = (r.created_at || r.date).slice(0, 10)
          return k >= lastMondayKey && k < mondayKey
        })
        setDaysThisWeek(new Set(thisWeek.map(r => (r.created_at || r.date).slice(0, 10))).size)
        setDaysDelta(new Set(thisWeek.map(r => (r.created_at || r.date).slice(0, 10))).size - new Set(lastWeek.map(r => (r.created_at || r.date).slice(0, 10))).size)

        // Calmness journey — last 7 days from reflection moods
        const labels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
        const points: { label: string; value: number | null }[] = []
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now)
          d.setHours(0, 0, 0, 0)
          d.setDate(now.getDate() - i)
          const key = toDayKey(d)
          const dayRefs = reflections.filter(r => (r.created_at || r.date).slice(0, 10) === key)
          const score = dayRefs.length
            ? dayRefs.reduce((sum, r) => sum + (MOOD_SCORE[r.mood] ?? 3), 0) / dayRefs.length
            : 0
          points.push({
            label: labels[d.getDay() === 0 ? 6 : d.getDay() - 1],
            value: score ? Math.round((score / 5) * 100) : null,
          })
        }
        setCalmData(points)

        // Gratitude
        const [gTotal, gHistory] = await Promise.all([
          getTotalGratitudeCount(supabase, uid),
          getGratitudeHistory(supabase, uid, mondayKey, toDayKey(new Date())),
        ])
        setGratitudeTotal(gTotal)
        setGratitudeThisWeek(gHistory.length)

        // Mood trend (30 days)
        const mood = await calculateMoodTrends(uid, 30)
        setMoodTrend(mood.trend)

        // Habits today (premium)
        if (tier === 'premium') {
          const [habits, todayLogs] = await Promise.all([
            getHabits(supabase, uid),
            getTodayHabitLogs(supabase, uid),
          ])
          setHabitsTotal(habits.length)
          setHabitsDone(todayLogs.length)
        }
      } catch (error) {
        console.error('Failed to load wellness stats:', error)
      } finally {
        if (isMounted) setStatsReady(true)
      }
    }

    loadStats()
    return () => { isMounted = false }
  }, [userId, supabase, tier])

  if (!userId) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0A0E18]' : 'bg-[#F9FBFB]'}`} />
    )
  }

  const trendIcon =
    moodTrend === 'improving' ? (
      <FontAwesomeIcon icon={faArrowTrendUp} className="text-sm" />
    ) : moodTrend === 'declining' ? (
      <FontAwesomeIcon icon={faArrowTrendDown} className="text-sm" />
    ) : (
      <FontAwesomeIcon icon={faMinus} className="text-sm" />
    )
  const trendColor =
    moodTrend === 'improving' ? 'text-emerald-600' : moodTrend === 'declining' ? 'text-rose-500' : 'text-slate-400'
  const trendText =
    moodTrend === 'improving' ? 'Improving' : moodTrend === 'declining' ? 'Declining' : 'Stable'

  const kpiCard = 'glass rounded-3xl border border-slate-100 shadow-soft-card p-5 hover:shadow-md transition-shadow'

  const chartGrid = isDark ? 'rgba(255,255,255,0.08)' : '#EDF2F7'
  const chartTick = isDark ? 'rgba(255,255,255,0.35)' : '#94A3B8'

  return (
    <AuthGuard redirectPath="/dashboard/wellness">
      <div 
        data-dashboard
        className={`min-h-screen ${isDark ? 'bg-[#0A0E18]' : 'bg-[#F9FBFB]'}`}
      >
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />

          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 pt-16 md:pt-10">
            <div className="space-y-6">

              {/* Header */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Wellness Hub
                  </h1>
                  <p className={`mt-1 text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                    Tools for your mental wellbeing
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    onClick={() => setShowBreathingDialog(true)}
                    className={`gap-2.5 rounded-full px-5 h-11 text-sm font-semibold ${
                      isDark
                        ? 'bg-white/5 border border-white/10 text-white/80 hover:bg-white/10'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FontAwesomeIcon icon={faWind} className="text-lg text-sky-500" />
                    <span className="hidden sm:inline">Breathe</span>
                  </Button>
                  <Button
                    onClick={() => setShowCrisisDialog(true)}
                    className={`gap-2.5 rounded-full px-5 h-11 text-sm font-semibold ${
                      isDark
                        ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20'
                        : 'bg-rose-50/60 border border-rose-200 text-rose-500 hover:bg-rose-50'
                    }`}
                  >
                    <FontAwesomeIcon icon={faHeart} className="text-lg" />
                    <span className="hidden sm:inline">Support</span>
                  </Button>
                </div>
              </motion.div>

              {/* KPI STAT CARDS */}
              <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={kpiCard}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Days Reflected</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{statsReady ? daysThisWeek : '—'}</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>this week</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                    <FontAwesomeIcon icon={faLeaf} className="text-sm" />
                    {statsReady ? `${daysDelta >= 0 ? '+' : ''}${daysDelta} vs last week` : '...'}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className={kpiCard}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Gratitude</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{statsReady ? gratitudeTotal : '—'}</span>
                    <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>entries</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                    <FontAwesomeIcon icon={faSun} className="text-sm" />
                    {statsReady ? `+${gratitudeThisWeek} this week` : '...'}
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className={kpiCard}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Mood Trend</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-xl md:text-2xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{statsReady ? trendText : '—'}</span>
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${trendColor}`}>
                    {trendIcon} last 30 days
                  </div>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className={kpiCard}>
                  <p className={`text-[10px] font-bold uppercase tracking-widest mb-3 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Habits Today</p>
                  <div className="flex items-baseline gap-1.5">
                    {isPremium ? (
                      <>
                        <span className={`text-3xl font-bold tabular-nums ${isDark ? 'text-white' : 'text-slate-900'}`}>{statsReady ? habitsDone : '—'}</span>
                        <span className={`text-xs font-bold ${isDark ? 'text-white/40' : 'text-slate-400'}`}>of {statsReady ? habitsTotal : '—'} done</span>
                      </>
                    ) : (
                      <span className={`text-lg font-bold flex items-center gap-2 ${isDark ? 'text-white/60' : 'text-slate-400'}`}>
                        <FontAwesomeIcon icon={faLock} className="text-sm" /> Premium
                      </span>
                    )}
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs font-bold mt-3 ${isDark ? 'text-sky-400' : 'text-sky-600'}`}>
                    <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
                    {isPremium
                      ? statsReady ? `${Math.max(0, habitsTotal - habitsDone)} left today` : '...'
                      : 'Unlock with Premium'}
                  </div>
                </motion.div>
              </section>

              {/* MOOD JOURNEY + GRATITUDE */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6">
                {/* Calmness journey chart */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className={`lg:col-span-8 rounded-3xl p-6 md:p-7 border shadow-none ${
                    isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'
                  }`}
                >
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <h3 className={`text-lg md:text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Calmness Journey</h3>
                      <p className={`text-sm mt-0.5 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Tracking your inner peace levels</p>
                    </div>
                    <span className={`rounded-full px-3.5 py-1.5 text-xs font-semibold ${isDark ? 'bg-white/[0.06] text-white/50' : 'bg-slate-100/80 text-slate-500'}`}>Last 7 days</span>
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={calmData} margin={{ top: 10, right: 4, left: -14, bottom: 0 }}>
                        <defs>
                          <linearGradient id="calmFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#6366F1" stopOpacity={0.28} />
                            <stop offset="100%" stopColor="#6366F1" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={chartGrid} strokeDasharray="4 6" vertical={false} />
                        <XAxis
                          dataKey="label"
                          tick={{ fill: chartTick, fontSize: 11, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          dy={6}
                        />
                        <YAxis
                          domain={[0, 100]}
                          ticks={[0, 25, 50, 75, 100]}
                          tick={{ fill: chartTick, fontSize: 11, fontWeight: 700 }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v: number) => `${v}%`}
                        />
                        <Tooltip
                          cursor={{ stroke: '#818CF8', strokeWidth: 1, strokeDasharray: '3 3' }}
                          content={({ active, payload }) => {
                            if (!active || !payload?.length) return null
                            const p = payload[0].payload as { label: string; value: number | null }
                            return (
                              <div className={`rounded-xl px-3 py-2 text-xs shadow-lg border ${isDark ? 'bg-[#1B2436] border-white/10' : 'bg-white border-slate-100'}`}>
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{p.label}</p>
                                <p className={`mt-0.5 font-medium ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                  {p.value == null ? 'No reflection' : `${p.value}% calm`}
                                </p>
                              </div>
                            )
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="value"
                          stroke="#6366F1"
                          strokeWidth={3}
                          fill="url(#calmFill)"
                          dot={{ r: 4, fill: '#6366F1', strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: '#fff', stroke: '#6366F1', strokeWidth: 3 }}
                          connectNulls
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                {/* Gratitude tracker */}
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="lg:col-span-4"
                >
                  <GratitudeEntry userId={userId} />
                </motion.div>
              </div>

              {/* QUICK TOOLS */}
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg md:text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Quick Tools</h3>
                  <span className={`text-[10px] font-bold uppercase tracking-[0.2em] ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Tap to begin</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <QuickToolCard
                    isDark={isDark}
                    accent="sky"
                    icon={<FontAwesomeIcon icon={faWind} className="text-xl" />}
                    title="Breathing"
                    subtitle="Calm your mind in under 4 minutes"
                    cta="Begin"
                    onClick={() => setShowBreathingDialog(true)}
                  />
                  <QuickToolCard
                    isDark={isDark}
                    accent="rose"
                    icon={<FontAwesomeIcon icon={faHeart} className="text-xl" />}
                    title="Support"
                    subtitle="Hotlines & grounding exercises"
                    cta="Get Help"
                    onClick={() => setShowCrisisDialog(true)}
                  />
                  <QuickToolCard
                    isDark={isDark}
                    accent="indigo"
                    icon={<FontAwesomeIcon icon={faBullseye} className="text-xl" />}
                    title="Goals"
                    subtitle="Track intentions & habit progress"
                    cta="Overview"
                    onClick={() => setActiveTab('goals')}
                  />
                </div>
              </section>

              {/* Upgrade Banner (if free) */}
              {!isPremium && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                >
                  <Card className={`rounded-3xl border shadow-none overflow-hidden ${
                    isDark ? 'bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border-indigo-400/20' : 'bg-gradient-to-br from-indigo-50 to-violet-50 border-indigo-100'
                  }`}>
                    <CardContent className="p-6">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <div className={`p-2.5 rounded-full ${isDark ? 'bg-indigo-500/20' : 'bg-white/80 shadow-sm'}`}>
                            <FontAwesomeIcon icon={faCrown} className={`text-lg ${isDark ? 'text-indigo-300' : 'text-indigo-500'}`} />
                          </div>
                          <div>
                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              Unlock Full Wellness Suite
                            </h3>
                            <p className={`text-sm mt-0.5 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                              Get goals tracking, habit correlations, advanced insights & more
                            </p>
                          </div>
                        </div>
                        <Link href="/settings#subscription">
                          <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25">
                            <FontAwesomeIcon icon={faCrown} className="text-sm" />
                            Upgrade Now
                          </Button>
                        </Link>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className={`grid w-full grid-cols-4 h-auto p-1 rounded-2xl ${isDark ? 'bg-white/[0.06]' : 'bg-slate-100/80'}`}>
                  <TabsTrigger 
                    value="overview" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${isDark ? 'data-[state=active]:bg-white/[0.12] data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500'}`}
                  >
                    <FontAwesomeIcon icon={faWandMagicSparkles} className="text-sm" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="insights" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${isDark ? 'data-[state=active]:bg-white/[0.12] data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500'}`}
                  >
                    <FontAwesomeIcon icon={faChartColumn} className="text-sm" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="goals" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${isDark ? 'data-[state=active]:bg-white/[0.12] data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500'}`}
                  >
                    <FontAwesomeIcon icon={faBullseye} className="text-sm" />
                    <span className="hidden sm:inline">Goals</span>
                    {!isPremium && <FontAwesomeIcon icon={faLock} className="text-xs ml-1 opacity-50" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habits" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${isDark ? 'data-[state=active]:bg-white/[0.12] data-[state=active]:text-white text-white/50' : 'data-[state=active]:bg-white data-[state=active]:text-slate-900 text-slate-500'}`}
                  >
                    <FontAwesomeIcon icon={faCircleCheck} className="text-sm" />
                    <span className="hidden sm:inline">Habits</span>
                    {!isPremium && <FontAwesomeIcon icon={faLock} className="text-xs ml-1 opacity-50" />}
                  </TabsTrigger>
                </TabsList>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <TierGate requiresPremium feature="weekly-insights">
                      <WeeklyMoodInsights userId={userId} />
                    </TierGate>
                    
                    <Card className={`rounded-3xl border shadow-none ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'}`}>
                      <CardHeader>
                        <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          Reflection Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                          Your mood insights and patterns will appear here as you continue reflecting.
                          The more you reflect, the better insights you'll receive.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Goals Tab */}
                <TabsContent value="goals" className="space-y-4">
                  {isPremium ? (
                    <GoalsDashboard userId={userId} />
                  ) : (
                    <PremiumLockCard
                      isDark={isDark}
                      icon={<FontAwesomeIcon icon={faBullseye} className="text-5xl" />}
                      title="Premium Feature"
                      description="Goal tracking helps you set intentions and track progress toward what matters most."
                    />
                  )}
                </TabsContent>

                {/* Habits Tab */}
                <TabsContent value="habits" className="space-y-4">
                  {isPremium ? (
                    <HabitsTracker userId={userId} />
                  ) : (
                    <PremiumLockCard
                      isDark={isDark}
                      icon={<FontAwesomeIcon icon={faCircleCheck} className="text-5xl" />}
                      title="Premium Feature"
                      description="Track daily habits and see how they correlate with your mood over time."
                    />
                  )}
                </TabsContent>
              </Tabs>
            </div>
            </div>
          </main>
        </div>

        {/* Crisis Support Dialog */}
        <Dialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <CrisisSupport 
              userCountry={userCountry} 
              userId={userId} 
              onClose={() => setShowCrisisDialog(false)} 
            />
          </DialogContent>
        </Dialog>

        {/* Breathing Exercise Dialog */}
        <Dialog open={showBreathingDialog} onOpenChange={setShowBreathingDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <BreathingExercise 
              userId={userId} 
              onComplete={() => {}} 
            />
          </DialogContent>
        </Dialog>

        {/* Gratitude Dialog */}
        <Dialog open={showGratitudeDialog} onOpenChange={setShowGratitudeDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <GratitudeEntry userId={userId} />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick tool card — tall tile with accent orb, hover glow and CTA
// ─────────────────────────────────────────────────────────────────────────────
type QuickToolAccent = 'sky' | 'rose' | 'indigo'

function QuickToolCard({
  isDark,
  accent,
  icon,
  title,
  subtitle,
  cta,
  onClick,
}: {
  isDark: boolean
  accent: QuickToolAccent
  icon: React.ReactNode
  title: string
  subtitle: string
  cta: string
  onClick: () => void
}) {
  const orb =
    accent === 'sky'
      ? 'from-sky-500 to-sky-600 shadow-sky-200'
      : accent === 'rose'
      ? 'from-rose-500 to-rose-600 shadow-rose-200'
      : 'from-indigo-500 to-indigo-600 shadow-indigo-200'
  const glowBg =
    accent === 'sky' ? 'bg-sky-50' : accent === 'rose' ? 'bg-rose-50' : 'bg-indigo-50'
  const hoverAccent =
    accent === 'sky'
      ? 'hover:border-sky-200 hover:shadow-sky-100/60'
      : accent === 'rose'
      ? 'hover:border-rose-200 hover:shadow-rose-100/60'
      : 'hover:border-indigo-200 hover:shadow-indigo-100/60'
  const ctaColor =
    accent === 'sky'
      ? 'text-sky-600'
      : accent === 'rose'
      ? 'text-rose-600'
      : 'text-indigo-600'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={`group relative flex flex-col text-left p-6 rounded-3xl border-2 transition-all overflow-hidden h-[220px] ${
        isDark
          ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.06]'
          : `bg-white/70 border-slate-100 ${hoverAccent} hover:shadow-2xl`
      }`}
    >
      <span aria-hidden className={`pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full group-hover:scale-150 transition-transform duration-700 opacity-50 ${glowBg}`} />
      <span className={`relative inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white mb-5 shadow-lg ${orb}`}>
        {icon}
      </span>
      <h4 className={`text-lg font-semibold tracking-tight relative z-10 ${isDark ? 'text-white' : 'text-slate-900'}`}>{title}</h4>
      <p className={`text-sm mt-1.5 leading-relaxed relative z-10 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{subtitle}</p>
      <div className={`mt-auto relative z-10 flex items-center gap-2 font-bold text-xs uppercase tracking-widest ${ctaColor}`}>
        <span>{cta}</span>
        <FontAwesomeIcon icon={faArrowRight} className="text-sm transition-transform group-hover:translate-x-1" />
      </div>
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium lock card for gated tabs
// ─────────────────────────────────────────────────────────────────────────────
function PremiumLockCard({
  isDark,
  icon,
  title,
  description,
}: {
  isDark: boolean
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <Card className={`rounded-3xl p-8 text-center border shadow-none ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'}`}>
      <div className={`mx-auto mb-4 flex items-center justify-center ${isDark ? 'text-white/20' : 'text-slate-300'}`}>{icon}</div>
      <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
        {title}
      </h3>
      <p className={`mb-4 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
        {description}
      </p>
      <Link href="/settings#subscription">
        <Button className="gap-2 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white shadow-lg shadow-indigo-500/25">
          <FontAwesomeIcon icon={faCrown} className="text-sm" />
          Upgrade to Premium
        </Button>
      </Link>
    </Card>
  )
}
