'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBullseye,
  faPlus,
  faCheck,
  faPause,
  faTrash,
  faCalendar,
  faUser,
  faBriefcase,
  faHeartPulse,
  faHeart,
  faCoins,
  faCircleInfo,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
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
  getGoals,
  createGoal,
  updateGoalProgress,
  updateGoalStatus,
  deleteGoal,
  getGoalStats,
  type Goal,
  type GoalCategory,
  type GoalStatus,
} from '@/lib/services/goalsService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/contexts/ThemeContext'

interface GoalsDashboardProps {
  userId: string
}

const categoryIcons: Record<GoalCategory, typeof faBullseye> = {
  personal: faUser,
  professional: faBriefcase,
  wellness: faHeartPulse,
  relationships: faHeart,
  financial: faCoins,
  other: faCircleInfo,
}

const categoryColorsLight: Record<GoalCategory, string> = {
  personal: 'bg-indigo-50 text-indigo-700',
  professional: 'bg-sky-50 text-sky-700',
  wellness: 'bg-emerald-50 text-emerald-700',
  relationships: 'bg-rose-50 text-rose-700',
  financial: 'bg-amber-50 text-amber-700',
  other: 'bg-slate-100 text-slate-600',
}

const categoryColorsDark: Record<GoalCategory, string> = {
  personal: 'bg-indigo-500/20 text-indigo-400',
  professional: 'bg-sky-500/20 text-sky-400',
  wellness: 'bg-emerald-500/20 text-emerald-400',
  relationships: 'bg-rose-500/20 text-rose-400',
  financial: 'bg-amber-500/20 text-amber-400',
  other: 'bg-white/10 text-white/70',
}

const categoryBars: Record<GoalCategory, string> = {
  personal: 'from-indigo-400 to-indigo-500',
  professional: 'from-sky-400 to-sky-500',
  wellness: 'from-emerald-400 to-emerald-500',
  relationships: 'from-rose-400 to-rose-500',
  financial: 'from-amber-400 to-amber-500',
  other: 'from-slate-400 to-slate-500',
}

export default function GoalsDashboard({ userId }: GoalsDashboardProps) {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const categoryColors = isDark ? categoryColorsDark : categoryColorsLight
  const [goals, setGoals] = useState<Goal[]>([])
  const [stats, setStats] = useState<{
    totalGoals: number
    activeGoals: number
    completedGoals: number
    completionRate: number
  } | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newGoal, setNewGoal] = useState({
    title: '',
    description: '',
    category: 'personal' as GoalCategory,
    target_date: '',
    why_important: '',
  })
  const [isCreating, setIsCreating] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('active')

  const supabase = getSupabaseClient()
  const { toast } = useToast()

  const loadGoals = useCallback(async () => {
    setIsLoading(true)
    try {
      const status = filter === 'all' ? undefined : filter === 'active' ? 'active' : 'completed'
      const [goalsData, statsData] = await Promise.all([
        getGoals(supabase, userId, status as GoalStatus | undefined),
        getGoalStats(supabase, userId),
      ])
      setGoals(goalsData)
      setStats(statsData)
    } catch (error) {
      console.error('Error loading goals:', error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, userId, filter])

  useEffect(() => {
    loadGoals()
  }, [loadGoals])

  const handleCreateGoal = async () => {
    if (!newGoal.title.trim()) {
      toast({
        title: 'Title required',
        description: 'Please enter a goal title',
        variant: 'destructive',
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createGoal(supabase, userId, {
        title: newGoal.title.trim(),
        description: newGoal.description.trim() || undefined,
        category: newGoal.category,
        target_date: newGoal.target_date || undefined,
        why_important: newGoal.why_important.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: 'Goal created',
          description: 'Your new goal has been added',
        })
        setShowCreateDialog(false)
        setNewGoal({
          title: '',
          description: '',
          category: 'personal',
          target_date: '',
          why_important: '',
        })
        loadGoals()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create goal',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive',
      })
    } finally {
      setIsCreating(false)
    }
  }

  const handleUpdateProgress = async (goalId: string, progress: number) => {
    const result = await updateGoalProgress(supabase, goalId, progress)
    if (result.success) {
      loadGoals()
      if (progress >= 100) {
        toast({
          title: 'Goal completed',
          description: 'Congratulations on achieving your goal!',
        })
      }
    }
  }

  const handleUpdateStatus = async (goalId: string, status: GoalStatus) => {
    const result = await updateGoalStatus(supabase, goalId, status)
    if (result.success) {
      loadGoals()
      toast({
        title: 'Goal updated',
        description: `Goal marked as ${status}`,
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    const result = await deleteGoal(supabase, goalId)
    if (result.success) {
      loadGoals()
      toast({
        title: 'Goal deleted',
        description: 'Goal has been removed',
      })
    }
  }

  if (isLoading) {
    return (
      <Card className={`glass rounded-3xl border-slate-100 soft-shadow ${isDark ? '!bg-white/[0.04] !border-white/[0.06]' : ''}`}>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className={`h-6 rounded w-1/3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-24 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-24 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={`glass rounded-3xl border-slate-100 soft-shadow ${isDark ? '!bg-white/[0.04] !border-white/[0.06]' : ''}`}>
      <div className="p-6 pb-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center shrink-0">
              <FontAwesomeIcon icon={faBullseye} className={`text-sm ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
            </span>
            <div>
              <h3 className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Goals</h3>
              <p className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-400'}`}>Track intentions &amp; habit progress</p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1.5 bg-indigo-500 hover:bg-indigo-600 text-white shadow-lg shadow-indigo-500/25 border-0">
                <FontAwesomeIcon icon={faPlus} className="text-xs" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Create New Goal</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>What do you want to achieve?</label>
                  <Input
                    value={newGoal.title}
                    onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                    placeholder="e.g., Run a 5K marathon"
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Category</label>
                  <Select
                    value={newGoal.category}
                    onValueChange={(value) => setNewGoal({ ...newGoal, category: value as GoalCategory })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="personal">Personal</SelectItem>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="wellness">Wellness</SelectItem>
                      <SelectItem value="relationships">Relationships</SelectItem>
                      <SelectItem value="financial">Financial</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Why is this important to you?</label>
                  <Textarea
                    value={newGoal.why_important}
                    onChange={(e) => setNewGoal({ ...newGoal, why_important: e.target.value })}
                    placeholder="Your motivation and purpose..."
                    className="mt-1"
                    rows={2}
                  />
                </div>
                <div>
                  <label className={`text-sm font-medium ${isDark ? 'text-white/80' : 'text-gray-700'}`}>Target Date (optional)</label>
                  <Input
                    type="date"
                    value={newGoal.target_date}
                    onChange={(e) => setNewGoal({ ...newGoal, target_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <Button
                  onClick={handleCreateGoal}
                  disabled={isCreating || !newGoal.title.trim()}
                  className="w-full bg-indigo-500 hover:bg-indigo-600 text-white border-0"
                >
                  {isCreating ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats — mockup progress bars */}
        {stats && (
          <div className="space-y-4 mt-6">
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Active Goals</span>
                <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">{stats.activeGoals}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalGoals ? Math.min(100, (stats.activeGoals / stats.totalGoals) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Completed</span>
                <span className="text-[10px] font-bold text-sky-500 uppercase tracking-widest">{stats.completedGoals}</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-sky-400 to-sky-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.totalGoals ? Math.min(100, (stats.completedGoals / stats.totalGoals) * 100) : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2.5">
                <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>Success Rate</span>
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{stats.completionRate}%</span>
              </div>
              <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-white/10">
                <div
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
                  style={{ width: `${stats.completionRate}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className={`flex gap-1 mt-6 rounded-2xl p-1 ${isDark ? 'bg-white/10' : 'bg-slate-100/80'}`}>
          {(['active', 'completed', 'all'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'ghost'}
              className={`flex-1 h-7 text-xs capitalize ${filter === f ? isDark ? 'bg-white/20 shadow-sm text-white' : 'bg-white shadow-sm' : isDark ? 'text-white/60 hover:text-white' : 'text-slate-500'}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      <div className="px-6 pb-6 space-y-3">
        <AnimatePresence>
          {goals.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
              <FontAwesomeIcon icon={faBullseye} className={`mx-auto mb-2 text-5xl ${isDark ? 'text-white/20' : 'text-slate-300'}`} />
              <p className="text-sm">No {filter !== 'all' ? filter : ''} goals yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="mt-2 text-indigo-500"
              >
                Create your first goal
              </Button>
            </div>
          ) : (
            goals.map((goal) => (
              <motion.div
                key={goal.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className={`p-4 rounded-2xl border transition-colors ${
                  isDark ? 'border-white/10 hover:border-indigo-400/30' : 'border-slate-100 hover:border-indigo-200'
                } ${isDark ? 'bg-white/[0.03]' : 'bg-white/60'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${categoryColors[goal.category]}`}>
                        <FontAwesomeIcon icon={categoryIcons[goal.category]} className="text-[10px]" />
                        {goal.category}
                      </span>
                      {goal.status === 'completed' && (
                        <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400">
                          <FontAwesomeIcon icon={faCheck} className="text-[10px]" />
                          Completed
                        </span>
                      )}
                    </div>
                    <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{goal.title}</h4>
                    {goal.why_important && (
                      <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{goal.why_important}</p>
                    )}

                    {/* Progress bar */}
                    {goal.status === 'active' && (
                      <div className="mt-3">
                        <div className={`flex items-center justify-between text-xs mb-1 ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                          <span>Progress</span>
                          <span className="font-bold text-indigo-500">{goal.progress}%</span>
                        </div>
                        <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden dark:bg-white/10">
                          <div
                            className={`h-full bg-gradient-to-r ${categoryBars[goal.category]} rounded-full transition-all duration-500`}
                            style={{ width: `${goal.progress}%` }}
                          />
                        </div>
                        <div className="flex gap-1 mt-2">
                          {[25, 50, 75, 100].map((p) => (
                            <Button
                              key={p}
                              size="sm"
                              variant={goal.progress >= p ? 'default' : 'outline'}
                              className="flex-1 h-6 text-xs"
                              onClick={() => handleUpdateProgress(goal.id, p)}
                            >
                              {p}%
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {goal.target_date && (
                      <div className={`flex items-center gap-1 mt-2 text-xs ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
                        <FontAwesomeIcon icon={faCalendar} className="text-xs" />
                        Target: {new Date(goal.target_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-1">
                    {goal.status === 'active' && (
                      <>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleUpdateStatus(goal.id, 'completed')}
                          title="Mark complete"
                        >
                          <FontAwesomeIcon icon={faCheck} className="text-sm text-emerald-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleUpdateStatus(goal.id, 'paused')}
                          title="Pause goal"
                        >
                          <FontAwesomeIcon icon={faPause} className="text-sm text-amber-500" />
                        </Button>
                      </>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-0"
                      onClick={() => handleDeleteGoal(goal.id)}
                      title="Delete goal"
                    >
                      <FontAwesomeIcon icon={faTrash} className={`text-sm hover:text-rose-500 ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </Card>
  )
}
