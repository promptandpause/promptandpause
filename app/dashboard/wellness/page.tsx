'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { 
  Heart, 
  Wind, 
  Target, 
  CheckCircle2, 
  BarChart3, 
  Sparkles,
  ChevronRight,
  Lock,
  Crown
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTier } from '@/hooks/useTier'
import { useTheme } from '@/contexts/ThemeContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import { DashboardSidebar } from '../components/DashboardSidebar'
import dynamic from 'next/dynamic'

// Lazy-load wellness components — only rendered inside dialogs
const CrisisSupport = dynamic(() => import('@/components/wellness/CrisisSupport'), { ssr: false })
const BreathingExercise = dynamic(() => import('@/components/wellness/BreathingExercise'), { ssr: false })
const WeeklyMoodInsights = dynamic(() => import('@/components/wellness/WeeklyMoodInsights'), { ssr: false })
const GratitudeEntry = dynamic(() => import('@/components/wellness/GratitudeEntry'), { ssr: false })
const GoalsDashboard = dynamic(() => import('@/components/wellness/GoalsDashboard'), { ssr: false })
const HabitsTracker = dynamic(() => import('@/components/wellness/HabitsTracker'), { ssr: false })

export default function WellnessPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userCountry, setUserCountry] = useState('UK')
  const [showCrisisDialog, setShowCrisisDialog] = useState(false)
  const [showBreathingDialog, setShowBreathingDialog] = useState(false)
  const [showGratitudeDialog, setShowGratitudeDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { tier, isLoading: tierLoading } = useTier()
  const isPremium = tier === 'premium'
  const { theme } = useTheme()
  const supabase = getSupabaseClient()
  const searchParams = useSearchParams()

  useEffect(() => {
    loadUser()
  }, [])

  // Auto-open dialogs from query params (e.g. ?open=breathing from dashboard quick actions)
  useEffect(() => {
    const openParam = searchParams.get('open')
    if (openParam === 'breathing') setShowBreathingDialog(true)
    if (openParam === 'gratitude') setShowGratitudeDialog(true)
  }, [searchParams])

  const loadUser = async () => {
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
  }

  if (!userId) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#141820]' : 'bg-[#F5F3EE]'}`} />
    )
  }

  return (
    <AuthGuard redirectPath="/dashboard/wellness">
      <div 
        data-dashboard
        className={`min-h-screen ${theme === 'dark' ? 'bg-[#141820]' : 'bg-[#F5F3EE]'}`}
      >
        <div className="flex h-screen overflow-hidden">
          <DashboardSidebar />

          <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
            <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 pt-16 md:pt-10">
            <div className="space-y-5 md:space-y-6">
              {/* Header */}
              <Card className={`rounded-2xl p-5 md:p-6 border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                      Wellness Hub
                    </h1>
                    <p className={`mt-1 text-sm ${theme === 'dark' ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                      Tools for your mental wellbeing
                    </p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBreathingDialog(true)}
                      className={`gap-2 ${theme === 'dark' ? 'border-white/10 text-white hover:bg-white/10' : 'border-[#EFF3F4] text-[#536471] hover:bg-[#EFF3F4]'}`}
                    >
                      <Wind className="w-4 h-4" />
                      <span className="hidden sm:inline">Breathe</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCrisisDialog(true)}
                      className={`gap-2 ${theme === 'dark' ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/20' : 'border-rose-200 text-rose-500 hover:bg-rose-50'}`}
                    >
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Support</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className={`grid w-full grid-cols-4 h-auto p-1 rounded-2xl ${theme === 'dark' ? 'bg-white/8' : 'bg-[#EAE7E0]'}`}>
                  <TabsTrigger 
                    value="overview" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${theme === 'dark' ? 'data-[state=active]:bg-white/15 data-[state=active]:text-white' : 'data-[state=active]:bg-[#F7F9FA] data-[state=active]:text-[#0F1419]'}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="insights" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${theme === 'dark' ? 'data-[state=active]:bg-white/15 data-[state=active]:text-white' : 'data-[state=active]:bg-[#F7F9FA] data-[state=active]:text-[#0F1419]'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="goals" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${theme === 'dark' ? 'data-[state=active]:bg-white/15 data-[state=active]:text-white' : 'data-[state=active]:bg-[#F7F9FA] data-[state=active]:text-[#0F1419]'}`}
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Goals</span>
                    {!isPremium && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habits" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-sm ${theme === 'dark' ? 'data-[state=active]:bg-white/15 data-[state=active]:text-white' : 'data-[state=active]:bg-[#F7F9FA] data-[state=active]:text-[#0F1419]'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Habits</span>
                    {!isPremium && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Gratitude Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <GratitudeEntry userId={userId} />
                    </motion.div>

                    {/* Quick Tools Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className={`rounded-2xl h-full border shadow-none overflow-hidden ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                              <Sparkles className="w-5 h-5 text-[#6FA984]" />
                              Quick Tools
                            </CardTitle>
                            <span className={`text-[11px] font-medium uppercase tracking-[0.12em] ${theme === 'dark' ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                              Tap to begin
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2.5">
                          <QuickToolRow
                            isDark={theme === 'dark'}
                            accent="sky"
                            icon={<Wind className="w-[18px] h-[18px]" strokeWidth={1.9} />}
                            title="Breathing Exercises"
                            subtitle="Calm your mind in 4 minutes"
                            onClick={() => setShowBreathingDialog(true)}
                          />
                          <QuickToolRow
                            isDark={theme === 'dark'}
                            accent="rose"
                            icon={<Heart className="w-[18px] h-[18px]" strokeWidth={1.9} />}
                            title="Crisis Support"
                            subtitle="Grounding, coping & hotlines"
                            onClick={() => setShowCrisisDialog(true)}
                          />
                          <QuickToolRow
                            isDark={theme === 'dark'}
                            accent="violet"
                            icon={<Target className="w-[18px] h-[18px]" strokeWidth={1.9} />}
                            title="Goals & Intentions"
                            subtitle="Track your progress"
                            onClick={() => setActiveTab('goals')}
                            locked={!isPremium}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  </div>

                  {/* Habits Preview (if premium) */}
                  {isPremium && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className={`rounded-2xl border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                              Today's Habits
                            </CardTitle>
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => setActiveTab('habits')}
                              className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}
                            >
                              View All
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <HabitsTracker userId={userId} compact />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}

                  {/* Upgrade Banner (if free) */}
                  {!isPremium && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Card className={`rounded-2xl border shadow-none ${theme === 'dark' ? 'bg-[#C4B5E0]/10 border-[#C4B5E0]/15' : 'bg-[#EDE7F6] border-[#D1C4E9]'}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-2.5 rounded-full ${theme === 'dark' ? 'bg-[#C4B5E0]/15' : 'bg-[#D1C4E9]'}`}>
                                <Crown className={`h-5 w-5 ${theme === 'dark' ? 'text-[#C4B5E0]' : 'text-[#7E6BA5]'}`} />
                              </div>
                              <div>
                                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                                  Unlock Full Wellness Suite
                                </h3>
                                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                                  Get goals tracking, habit correlations, advanced insights & more
                                </p>
                              </div>
                            </div>
                            <Link href="/dashboard/settings#subscription">
                              <Button className={`border-0 shadow-sm ${theme === 'dark' ? 'bg-[#C4B5E0] text-[#1A1A2E] hover:bg-[#B0A0D0]' : 'bg-[#7E6BA5] text-white hover:bg-[#6B5A90]'}`}>
                                <Crown className="w-4 h-4 mr-2" />
                                Upgrade Now
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </TabsContent>

                {/* Insights Tab */}
                <TabsContent value="insights" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <WeeklyMoodInsights userId={userId} />
                    
                    <Card className={`rounded-2xl border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
                      <CardHeader>
                        <CardTitle className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                          Reflection Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white/50' : 'text-[#8B98A5]'}`}>
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
                    <Card className={`rounded-2xl p-8 text-center border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
                      <Lock className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-white/20' : 'text-[#C4C0B8]'}`} />
                      <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                        Premium Feature
                      </h3>
                      <p className={`mb-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                        Goal tracking helps you set intentions and track progress toward what matters most.
                      </p>
                      <Link href="/dashboard/settings#subscription">
                        <Button className={`border-0 ${theme === 'dark' ? 'bg-[#C4B5E0] text-[#1A1A2E] hover:bg-[#B0A0D0]' : 'bg-[#7E6BA5] text-white hover:bg-[#6B5A90]'}`}>
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </Card>
                  )}
                </TabsContent>

                {/* Habits Tab */}
                <TabsContent value="habits" className="space-y-4">
                  {isPremium ? (
                    <HabitsTracker userId={userId} />
                  ) : (
                    <Card className={`rounded-2xl p-8 text-center border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#EFF3F4]'}`}>
                      <Lock className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-white/20' : 'text-[#C4C0B8]'}`} />
                      <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-[#0F1419]'}`}>
                        Premium Feature
                      </h3>
                      <p className={`mb-4 ${theme === 'dark' ? 'text-white/50' : 'text-[#8B98A5]'}`}>
                        Track daily habits and see how they correlate with your mood over time.
                      </p>
                      <Link href="/dashboard/settings#subscription">
                        <Button className={`border-0 ${theme === 'dark' ? 'bg-[#C4B5E0] text-[#1A1A2E] hover:bg-[#B0A0D0]' : 'bg-[#7E6BA5] text-white hover:bg-[#6B5A90]'}`}>
                          <Crown className="w-4 h-4 mr-2" />
                          Upgrade to Premium
                        </Button>
                      </Link>
                    </Card>
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
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-rose-500" />
                Crisis Support
              </DialogTitle>
            </DialogHeader>
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
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Wind className="w-5 h-5 text-blue-500" />
                Breathing Exercise
              </DialogTitle>
            </DialogHeader>
            <BreathingExercise 
              userId={userId} 
              onComplete={() => {}} 
            />
          </DialogContent>
        </Dialog>

        {/* Gratitude Dialog */}
        <Dialog open={showGratitudeDialog} onOpenChange={setShowGratitudeDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                Gratitude Entry
              </DialogTitle>
            </DialogHeader>
            <GratitudeEntry userId={userId} />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Premium Quick Tool row — gradient surface, layered icon orb, spring press
// ─────────────────────────────────────────────────────────────────────────────
type QuickToolAccent = 'sky' | 'rose' | 'violet'

function QuickToolRow({
  isDark,
  accent,
  icon,
  title,
  subtitle,
  onClick,
  locked = false,
}: {
  isDark: boolean
  accent: QuickToolAccent
  icon: React.ReactNode
  title: string
  subtitle: string
  onClick: () => void
  locked?: boolean
}) {
  const surface =
    accent === 'sky'
      ? (isDark
          ? 'from-sky-500/10 via-white/[0.02] to-transparent border-sky-400/15 hover:border-sky-400/30'
          : 'from-sky-50/90 via-white/70 to-white/60 border-sky-200/50 hover:border-sky-300/70')
      : accent === 'rose'
      ? (isDark
          ? 'from-rose-500/10 via-white/[0.02] to-transparent border-rose-400/15 hover:border-rose-400/30'
          : 'from-rose-50/90 via-white/70 to-white/60 border-rose-200/50 hover:border-rose-300/70')
      : (isDark
          ? 'from-violet-500/10 via-white/[0.02] to-transparent border-violet-400/15 hover:border-violet-400/30'
          : 'from-violet-50/90 via-white/70 to-white/60 border-violet-200/50 hover:border-violet-300/70')

  const orb =
    accent === 'sky'
      ? 'bg-gradient-to-br from-sky-500 to-sky-600'
      : accent === 'rose'
      ? 'bg-gradient-to-br from-rose-500 to-rose-600'
      : 'bg-gradient-to-br from-violet-500 to-violet-600'

  const glow =
    accent === 'sky' ? 'bg-sky-400/25' : accent === 'rose' ? 'bg-rose-400/25' : 'bg-violet-400/25'

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={[
        'group relative w-full text-left overflow-hidden',
        'rounded-2xl px-3.5 py-3 border bg-gradient-to-br transition-colors duration-200',
        surface,
        'shadow-[0_1px_2px_rgba(15,20,20,0.04)] hover:shadow-[0_10px_22px_-12px_rgba(15,20,20,0.15)]',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#6FA984]/40',
      ].join(' ')}
    >
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-6 -right-6 h-20 w-20 rounded-full blur-2xl opacity-0 group-hover:opacity-70 transition-opacity duration-500 ${glow}`}
      />
      <div className="relative flex items-center gap-3">
        <span className={`relative inline-flex h-10 w-10 items-center justify-center rounded-xl text-white shadow-sm ${orb}`}>
          {icon}
        </span>
        <div className="flex-1 min-w-0">
          <p className={`text-[14px] font-semibold tracking-tight ${isDark ? 'text-white' : 'text-[#2F3B34]'}`}>
            {title}
          </p>
          <p className={`mt-0.5 text-[12px] leading-snug ${isDark ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
            {subtitle}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {locked && (
            <Lock className={`w-3.5 h-3.5 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`} />
          )}
          <ChevronRight
            className={`w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5 ${isDark ? 'text-white/40' : 'text-[#8A9B8F]'}`}
          />
        </div>
      </div>
    </motion.button>
  )
}
