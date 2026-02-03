'use client'

import { useState, useEffect } from 'react'
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

// Import wellness components
import CrisisSupport from '@/components/wellness/CrisisSupport'
import BreathingExercise from '@/components/wellness/BreathingExercise'
import WeeklyMoodInsights from '@/components/wellness/WeeklyMoodInsights'
import GratitudeEntry from '@/components/wellness/GratitudeEntry'
import GoalsDashboard from '@/components/wellness/GoalsDashboard'
import HabitsTracker from '@/components/wellness/HabitsTracker'

export default function WellnessPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [userCountry, setUserCountry] = useState('UK')
  const [showCrisisDialog, setShowCrisisDialog] = useState(false)
  const [showBreathingDialog, setShowBreathingDialog] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  
  const { tier, isLoading: tierLoading } = useTier()
  const isPremium = tier === 'premium'
  const { theme } = useTheme()
  const supabase = getSupabaseClient()

  useEffect(() => {
    loadUser()
  }, [])

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
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <AuthGuard redirectPath="/dashboard/wellness">
      <div 
        data-dashboard
        className="min-h-screen relative" 
        style={theme === 'light' 
          ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } 
          : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
      >
        {/* Subtle overlay for readability */}
        <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-white/35' : 'bg-black/25'}`} />

        {/* Calming ambient animation */}
        <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
          <div className="absolute inset-0 calm-ambient-blobs" />
        </div>

        <style jsx global>{`
          .calm-ambient-blobs {
            background: radial-gradient(600px circle at 20% 20%, rgba(161, 167, 158, 0.20), transparent 45%),
                        radial-gradient(700px circle at 80% 30%, rgba(136, 165, 188, 0.20), transparent 50%),
                        radial-gradient(800px circle at 30% 80%, rgba(56, 76, 55, 0.20), transparent 55%);
            animation: calm-shift 28s ease-in-out infinite alternate;
            filter: blur(12px);
          }
          @keyframes calm-shift {
            0% { transform: translate3d(0,0,0) scale(1); }
            50% { transform: translate3d(-1%, 1%, 0) scale(1.03); opacity: 0.9; }
            100% { transform: translate3d(1%, -1%, 0) scale(1.06); opacity: 0.85; }
          }
          @media (prefers-reduced-motion: reduce) {
            .calm-ambient-blobs { animation: none; }
          }
        `}</style>

        <div className="relative z-10 px-3 md:px-6 pt-4 md:pt-8 pb-24 md:pb-6 w-full max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
            {/* Sidebar with navigation */}
            <DashboardSidebar />

            {/* Main Content Area */}
            <div className="col-span-1 md:col-span-10 space-y-4 md:space-y-6">
              {/* Header */}
              <Card className={`rounded-3xl p-6 ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className={`text-2xl md:text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      Wellness Hub
                    </h1>
                    <p className={`mt-1 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                      Tools for your mental wellbeing
                    </p>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowBreathingDialog(true)}
                      className={`gap-2 ${theme === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : ''}`}
                    >
                      <Wind className="w-4 h-4" />
                      <span className="hidden sm:inline">Breathe</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowCrisisDialog(true)}
                      className={`gap-2 ${theme === 'dark' ? 'border-rose-500/30 text-rose-400 hover:bg-rose-500/20' : 'border-rose-200 text-rose-600 hover:bg-rose-50'}`}
                    >
                      <Heart className="w-4 h-4" />
                      <span className="hidden sm:inline">Support</span>
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Tabs Navigation */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className={`grid w-full grid-cols-4 h-auto p-1 rounded-2xl ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-100'}`}>
                  <TabsTrigger 
                    value="overview" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-md ${theme === 'dark' ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white' : 'data-[state=active]:bg-white'}`}
                  >
                    <Sparkles className="w-4 h-4" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="insights" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-md ${theme === 'dark' ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white' : 'data-[state=active]:bg-white'}`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span className="hidden sm:inline">Insights</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="goals" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-md ${theme === 'dark' ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white' : 'data-[state=active]:bg-white'}`}
                  >
                    <Target className="w-4 h-4" />
                    <span className="hidden sm:inline">Goals</span>
                    {!isPremium && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                  </TabsTrigger>
                  <TabsTrigger 
                    value="habits" 
                    className={`gap-2 py-3 rounded-xl data-[state=active]:shadow-md ${theme === 'dark' ? 'data-[state=active]:bg-white/20 data-[state=active]:text-white' : 'data-[state=active]:bg-white'}`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="hidden sm:inline">Habits</span>
                    {!isPremium && <Lock className="w-3 h-3 ml-1 opacity-50" />}
                  </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Gratitude Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      <Card className={`rounded-3xl h-full ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                        <GratitudeEntry userId={userId} />
                      </Card>
                    </motion.div>

                    {/* Mood Insights Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className={`rounded-3xl h-full ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                        <WeeklyMoodInsights userId={userId} />
                      </Card>
                    </motion.div>

                    {/* Quick Tools Card */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <Card className={`rounded-3xl h-full ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                        <CardHeader className="pb-3">
                          <CardTitle className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            <Wind className="w-5 h-5 text-blue-500" />
                            Quick Tools
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <Button
                            variant="outline"
                            className={`w-full justify-between h-auto py-3 rounded-xl ${theme === 'dark' ? 'border-white/20 hover:bg-white/10' : ''}`}
                            onClick={() => setShowBreathingDialog(true)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                <Wind className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`} />
                              </div>
                              <div className="text-left">
                                <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Breathing Exercises</div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Calm your mind</div>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
                          </Button>

                          <Button
                            variant="outline"
                            className={`w-full justify-between h-auto py-3 rounded-xl ${theme === 'dark' ? 'border-rose-500/30 hover:bg-rose-500/10' : 'border-rose-200 hover:bg-rose-50'}`}
                            onClick={() => setShowCrisisDialog(true)}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
                                <Heart className={`w-5 h-5 ${theme === 'dark' ? 'text-rose-400' : 'text-rose-600'}`} />
                              </div>
                              <div className="text-left">
                                <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Crisis Support</div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Grounding & hotlines</div>
                              </div>
                            </div>
                            <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
                          </Button>

                          <Button
                            variant="outline"
                            className={`w-full justify-between h-auto py-3 rounded-xl ${theme === 'dark' ? 'border-white/20 hover:bg-white/10' : ''}`}
                            onClick={() => setActiveTab('goals')}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${theme === 'dark' ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                                <Target className={`w-5 h-5 ${theme === 'dark' ? 'text-purple-400' : 'text-purple-600'}`} />
                              </div>
                              <div className="text-left">
                                <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Goals & Intentions</div>
                                <div className={`text-xs ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>Track your progress</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {!isPremium && <Lock className={`w-4 h-4 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />}
                              <ChevronRight className={`w-5 h-5 ${theme === 'dark' ? 'text-white/40' : 'text-gray-400'}`} />
                            </div>
                          </Button>
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
                      <Card className={`rounded-3xl ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className={`text-lg flex items-center gap-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
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
                      <Card className={`rounded-3xl ${theme === 'dark' ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30' : 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300'}`}>
                        <CardContent className="p-6">
                          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <div className="flex items-center gap-4">
                              <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-yellow-500/30' : 'bg-yellow-100'}`}>
                                <Crown className={`h-6 w-6 ${theme === 'dark' ? 'text-yellow-400' : 'text-yellow-600'}`} />
                              </div>
                              <div>
                                <h3 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  Unlock Full Wellness Suite
                                </h3>
                                <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-white/70' : 'text-gray-600'}`}>
                                  Get goals tracking, habit correlations, advanced insights & more
                                </p>
                              </div>
                            </div>
                            <Link href="/dashboard/settings#subscription">
                              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0 shadow-lg">
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
                    <Card className={`rounded-3xl ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                      <WeeklyMoodInsights userId={userId} />
                    </Card>
                    
                    <Card className={`rounded-3xl ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                      <CardHeader>
                        <CardTitle className={`text-lg ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                          Reflection Summary
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-500'}`}>
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
                    <Card className={`rounded-3xl ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                      <GoalsDashboard userId={userId} />
                    </Card>
                  ) : (
                    <Card className={`rounded-3xl p-8 text-center ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                      <Lock className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-white/30' : 'text-gray-300'}`} />
                      <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Premium Feature
                      </h3>
                      <p className={`mb-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                        Goal tracking helps you set intentions and track progress toward what matters most.
                      </p>
                      <Link href="/dashboard/settings#subscription">
                        <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
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
                    <Card className={`rounded-3xl ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                      <HabitsTracker userId={userId} />
                    </Card>
                  ) : (
                    <Card className={`rounded-3xl p-8 text-center ${theme === 'dark' ? 'glass-light' : 'glass-medium'}`}>
                      <Lock className={`w-12 h-12 mx-auto mb-4 ${theme === 'dark' ? 'text-white/30' : 'text-gray-300'}`} />
                      <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        Premium Feature
                      </h3>
                      <p className={`mb-4 ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}>
                        Track daily habits and see how they correlate with your mood over time.
                      </p>
                      <Link href="/dashboard/settings#subscription">
                        <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white border-0">
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
        </div>

        {/* Crisis Support Dialog */}
        <Dialog open={showCrisisDialog} onOpenChange={setShowCrisisDialog}>
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-rose-200 bg-gradient-to-b from-white to-rose-50/30">
            <DialogHeader className="pb-2 border-b border-rose-100">
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-full bg-rose-100">
                  <Heart className="w-5 h-5 text-rose-500" />
                </div>
                <span>Crisis Support</span>
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
          <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto border-blue-200 bg-gradient-to-b from-white to-blue-50/30">
            <DialogHeader className="pb-2 border-b border-blue-100">
              <DialogTitle className="flex items-center gap-3 text-lg">
                <div className="p-2 rounded-full bg-blue-100">
                  <Wind className="w-5 h-5 text-blue-500" />
                </div>
                <span>Breathing Exercise</span>
              </DialogTitle>
            </DialogHeader>
            <BreathingExercise 
              userId={userId} 
              onComplete={() => {}} 
            />
          </DialogContent>
        </Dialog>
      </div>
    </AuthGuard>
  )
}
