'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  CheckCircle2, 
  Circle, 
  Plus, 
  X, 
  TrendingUp,
  Flame,
  BarChart3
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { 
  getHabits,
  getHabitsWithLogs,
  createHabit,
  logHabit,
  getTodayHabitLogs,
  deleteHabit,
  getHabitMoodCorrelation,
  suggestedHabits,
  type Habit,
  type HabitCategory,
  type HabitWithLogs
} from '@/lib/services/habitsService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/contexts/ThemeContext'

interface HabitsTrackerProps {
  userId: string
  compact?: boolean
}

const categoryColorsLight: Record<HabitCategory, string> = {
  wellness: 'bg-emerald-100 text-emerald-700',
  productivity: 'bg-blue-100 text-blue-700',
  social: 'bg-purple-100 text-purple-700',
  health: 'bg-rose-100 text-rose-700',
  mindfulness: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-700'
}

const categoryColorsDark: Record<HabitCategory, string> = {
  wellness: 'bg-emerald-500/20 text-emerald-400',
  productivity: 'bg-blue-500/20 text-blue-400',
  social: 'bg-purple-500/20 text-purple-400',
  health: 'bg-rose-500/20 text-rose-400',
  mindfulness: 'bg-amber-500/20 text-amber-400',
  other: 'bg-white/10 text-white/70'
}

export default function HabitsTracker({ userId, compact = false }: HabitsTrackerProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const categoryColors = isDark ? categoryColorsDark : categoryColorsLight
  const [habits, setHabits] = useState<HabitWithLogs[]>([])
  const [todayLogs, setTodayLogs] = useState<Record<string, boolean>>({})
  const [correlations, setCorrelations] = useState<{
    habit: string
    correlation: number
    avgMoodWithHabit: number
    avgMoodWithoutHabit: number
  }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newHabit, setNewHabit] = useState({
    name: '',
    icon: '✓',
    category: 'wellness' as HabitCategory
  })
  const [isCreating, setIsCreating] = useState(false)
  const [showCorrelations, setShowCorrelations] = useState(false)

  const supabase = getSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    loadHabits()
  }, [userId])

  const loadHabits = async () => {
    setIsLoading(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      
      const [habitsData, logsData, correlationData] = await Promise.all([
        getHabitsWithLogs(supabase, userId, weekAgo.toISOString().split('T')[0], today),
        getTodayHabitLogs(supabase, userId),
        getHabitMoodCorrelation(supabase, userId, 30)
      ])
      
      setHabits(habitsData)
      
      // Create today's log map
      const logMap: Record<string, boolean> = {}
      logsData.forEach(log => {
        logMap[log.habit_id] = log.completed
      })
      setTodayLogs(logMap)
      
      setCorrelations(correlationData)
    } catch (error) {
      console.error('Error loading habits:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleToggleHabit = async (habitId: string) => {
    const currentState = todayLogs[habitId] || false
    const newState = !currentState
    
    // Optimistic update
    setTodayLogs(prev => ({ ...prev, [habitId]: newState }))
    
    const result = await logHabit(supabase, userId, habitId, newState)
    
    if (!result.success) {
      // Revert on error
      setTodayLogs(prev => ({ ...prev, [habitId]: currentState }))
      toast({
        title: 'Error',
        description: 'Failed to update habit',
        variant: 'destructive'
      })
    }
  }

  const handleCreateHabit = async () => {
    if (!newHabit.name.trim()) {
      toast({
        title: 'Name required',
        description: 'Please enter a habit name',
        variant: 'destructive'
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createHabit(supabase, userId, newHabit)
      
      if (result.success) {
        toast({
          title: 'Habit created',
          description: `"${newHabit.name}" has been added`
        })
        setShowCreateDialog(false)
        setNewHabit({ name: '', icon: '✓', category: 'wellness' })
        loadHabits()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create habit',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating habit:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const handleDeleteHabit = async (habitId: string) => {
    const result = await deleteHabit(supabase, habitId)
    if (result.success) {
      loadHabits()
      toast({
        title: 'Habit removed',
        description: 'Habit has been deactivated'
      })
    }
  }

  const handleSelectSuggested = (suggested: typeof suggestedHabits[0]) => {
    setNewHabit({
      name: suggested.name,
      icon: suggested.icon,
      category: suggested.category
    })
  }

  if (isLoading) {
    return (
      <Card className={`${compact ? 'border-0 shadow-none' : ''} ${isDark ? 'bg-white/5 border-white/10' : ''}`}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="animate-pulse space-y-3">
            <div className={`h-5 rounded w-1/3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-10 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-10 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  const completedToday = Object.values(todayLogs).filter(Boolean).length
  const totalHabits = habits.length

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-700'}`}>Today&apos;s Habits</span>
          </div>
          <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
            {completedToday}/{totalHabits}
          </span>
        </div>

        <div className="space-y-2">
          {habits.slice(0, 5).map((habit) => (
            <button
              key={habit.id}
              onClick={() => handleToggleHabit(habit.id)}
              className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                todayLogs[habit.id] 
                  ? isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                  : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              {todayLogs[habit.id] ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <Circle className={`w-5 h-5 ${isDark ? 'text-white/30' : 'text-gray-300'}`} />
              )}
              <span className="text-lg">{habit.icon}</span>
              <span className={`text-sm flex-1 text-left ${
                todayLogs[habit.id] ? isDark ? 'text-emerald-400' : 'text-emerald-700' : isDark ? 'text-white' : 'text-gray-700'
              }`}>
                {habit.name}
              </span>
              {habit.streak > 0 && (
                <span className="text-xs text-amber-600 flex items-center gap-0.5">
                  <Flame className="w-3 h-3" />
                  {habit.streak}
                </span>
              )}
            </button>
          ))}
        </div>

        {habits.length === 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCreateDialog(true)}
            className="w-full"
          >
            <Plus className="w-4 h-4 mr-1" />
            Add Habit
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={isDark ? 'bg-white/5 border-white/10' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            Habit Tracker
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add New Habit</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Habit Name</label>
                  <Input
                    value={newHabit.name}
                    onChange={(e) => setNewHabit({ ...newHabit, name: e.target.value })}
                    placeholder="e.g., Drink 8 glasses of water"
                    className="mt-1"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Icon</label>
                    <Input
                      value={newHabit.icon}
                      onChange={(e) => setNewHabit({ ...newHabit, icon: e.target.value })}
                      className="mt-1 text-center text-xl"
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Category</label>
                    <Select
                      value={newHabit.category}
                      onValueChange={(value) => setNewHabit({ ...newHabit, category: value as HabitCategory })}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="wellness">Wellness</SelectItem>
                        <SelectItem value="health">Health</SelectItem>
                        <SelectItem value="productivity">Productivity</SelectItem>
                        <SelectItem value="social">Social</SelectItem>
                        <SelectItem value="mindfulness">Mindfulness</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className={`text-sm font-medium mb-2 block ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Quick Add</label>
                  <div className="flex flex-wrap gap-2">
                    {suggestedHabits.slice(0, 6).map((suggested) => (
                      <button
                        key={suggested.name}
                        onClick={() => handleSelectSuggested(suggested)}
                        className={`px-2 py-1 text-xs rounded-full transition-colors ${isDark ? 'bg-white/10 hover:bg-white/20 text-white/80' : 'bg-gray-100 hover:bg-gray-200'}`}
                      >
                        {suggested.icon} {suggested.name}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  onClick={handleCreateHabit}
                  disabled={isCreating || !newHabit.name.trim()}
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Add Habit'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Progress bar */}
        {totalHabits > 0 && (
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className={isDark ? 'text-white/60' : 'text-gray-600'}>Today&apos;s Progress</span>
              <span className="font-medium text-emerald-600">
                {completedToday}/{totalHabits} completed
              </span>
            </div>
            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(completedToday / totalHabits) * 100}%` }}
                className="h-full bg-emerald-500 rounded-full"
              />
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="space-y-2">
        <AnimatePresence>
          {habits.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              <CheckCircle2 className={`w-10 h-10 mx-auto mb-2 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
              <p className="text-sm">No habits yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="mt-2"
              >
                Add your first habit
              </Button>
            </div>
          ) : (
            habits.map((habit) => (
              <motion.div
                key={habit.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors group ${
                  todayLogs[habit.id] 
                    ? isDark ? 'bg-emerald-500/20 border border-emerald-500/30' : 'bg-emerald-50 border border-emerald-200'
                    : isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-50 hover:bg-gray-100'
                }`}
              >
                <button
                  onClick={() => handleToggleHabit(habit.id)}
                  className="flex-shrink-0"
                >
                  {todayLogs[habit.id] ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className={`w-6 h-6 ${isDark ? 'text-white/30 hover:text-white/50' : 'text-gray-300 hover:text-gray-400'}`} />
                  )}
                </button>
                
                <span className="text-xl">{habit.icon}</span>
                
                <div className="flex-1 min-w-0">
                  <div className={`font-medium ${
                    todayLogs[habit.id] ? isDark ? 'text-emerald-400' : 'text-emerald-700' : isDark ? 'text-white' : 'text-gray-700'
                  }`}>
                    {habit.name}
                  </div>
                  <div className={`flex items-center gap-3 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                    <span className={`px-1.5 py-0.5 rounded ${categoryColors[habit.category]}`}>
                      {habit.category}
                    </span>
                    {habit.streak > 0 && (
                      <span className="flex items-center gap-0.5 text-amber-600">
                        <Flame className="w-3 h-3" />
                        {habit.streak} day streak
                      </span>
                    )}
                    <span>{habit.completionRate}% this week</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDeleteHabit(habit.id)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}
                >
                  <X className={`w-4 h-4 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                </button>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {/* Mood Correlations */}
        {correlations.length > 0 && habits.length > 0 && (
          <div className={`pt-4 mt-4 ${isDark ? 'border-t border-white/10' : 'border-t'}`}>
            <button
              onClick={() => setShowCorrelations(!showCorrelations)}
              className={`flex items-center gap-2 text-sm font-medium w-full ${isDark ? 'text-white' : 'text-gray-700'}`}
            >
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Mood Correlations
              <TrendingUp className={`w-4 h-4 ml-auto transition-transform ${showCorrelations ? 'rotate-180' : ''}`} />
            </button>
            
            <AnimatePresence>
              {showCorrelations && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2 mt-3">
                    {correlations.slice(0, 3).map((corr) => (
                      <div key={corr.habit} className="flex items-center justify-between text-sm">
                        <span className={isDark ? 'text-white/60' : 'text-gray-600'}>{corr.habit}</span>
                        <span className={`font-medium ${
                          corr.correlation > 0 ? isDark ? 'text-emerald-400' : 'text-emerald-600' : 
                          corr.correlation < 0 ? isDark ? 'text-rose-400' : 'text-rose-600' : isDark ? 'text-white/50' : 'text-gray-500'
                        }`}>
                          {corr.correlation > 0 ? '+' : ''}{corr.correlation} mood
                        </span>
                      </div>
                    ))}
                    <p className={`text-xs mt-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                      Based on your reflections over the last 30 days
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
