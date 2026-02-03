'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Heart, 
  Wind, 
  Target, 
  CheckCircle2, 
  BarChart3, 
  Sparkles,
  Phone,
  Sun,
  Moon,
  ChevronRight,
  Lock
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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 p-4 md:p-6 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Wellness Hub</h1>
            <p className="text-gray-600 mt-1">Tools for your mental wellbeing</p>
          </div>
          
          {/* Quick Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowBreathingDialog(true)}
              className="gap-2"
            >
              <Wind className="w-4 h-4" />
              <span className="hidden sm:inline">Breathe</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCrisisDialog(true)}
              className="gap-2 border-rose-200 text-rose-600 hover:bg-rose-50"
            >
              <Heart className="w-4 h-4" />
              <span className="hidden sm:inline">Support</span>
            </Button>
          </div>
        </div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-flex">
            <TabsTrigger value="overview" className="gap-2">
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Insights</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="gap-2">
              <Target className="w-4 h-4" />
              <span className="hidden sm:inline">Goals</span>
              {!isPremium && <Lock className="w-3 h-3 ml-1" />}
            </TabsTrigger>
            <TabsTrigger value="habits" className="gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span className="hidden sm:inline">Habits</span>
              {!isPremium && <Lock className="w-3 h-3 ml-1" />}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Gratitude Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <GratitudeEntry userId={userId} />
              </motion.div>

              {/* Mood Insights Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <WeeklyMoodInsights userId={userId} />
              </motion.div>

              {/* Quick Tools Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Wind className="w-5 h-5 text-blue-500" />
                      Quick Tools
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                      onClick={() => setShowBreathingDialog(true)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Wind className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Breathing Exercises</div>
                          <div className="text-xs text-gray-500">Calm your mind</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3 border-rose-200 hover:bg-rose-50"
                      onClick={() => setShowCrisisDialog(true)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
                          <Heart className="w-5 h-5 text-rose-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Crisis Support</div>
                          <div className="text-xs text-gray-500">Grounding & hotlines</div>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    </Button>

                    <Button
                      variant="outline"
                      className="w-full justify-between h-auto py-3"
                      onClick={() => setActiveTab('goals')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                          <Target className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">Goals & Intentions</div>
                          <div className="text-xs text-gray-500">Track your progress</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {!isPremium && <Lock className="w-4 h-4 text-gray-400" />}
                        <ChevronRight className="w-5 h-5 text-gray-400" />
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
                <Card>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        Today's Habits
                      </CardTitle>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => setActiveTab('habits')}
                        className="text-blue-600"
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
                <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold text-gray-900">Unlock Full Wellness Suite</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Get goals tracking, habit correlations, advanced insights & more
                        </p>
                      </div>
                      <Button className="bg-purple-600 hover:bg-purple-700">
                        Upgrade to Premium
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </TabsContent>

          {/* Insights Tab */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <WeeklyMoodInsights userId={userId} />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Reflection Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500 text-sm">
                    Your mood insights and patterns will appear here as you continue reflecting.
                    The more you reflect, the better insights you'll receive.
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Goals Tab */}
          <TabsContent value="goals" className="space-y-6">
            {isPremium ? (
              <GoalsDashboard userId={userId} />
            ) : (
              <Card className="p-8 text-center">
                <Lock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                <p className="text-gray-600 mb-4">
                  Goal tracking helps you set intentions and track progress toward what matters most.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Upgrade to Premium
                </Button>
              </Card>
            )}
          </TabsContent>

          {/* Habits Tab */}
          <TabsContent value="habits" className="space-y-6">
            {isPremium ? (
              <HabitsTracker userId={userId} />
            ) : (
              <Card className="p-8 text-center">
                <Lock className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
                <p className="text-gray-600 mb-4">
                  Track daily habits and see how they correlate with your mood over time.
                </p>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Upgrade to Premium
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>

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
      </div>
    </div>
  )
}
