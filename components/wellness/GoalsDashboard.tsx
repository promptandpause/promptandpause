'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Target, 
  Plus, 
  Check, 
  Pause, 
  Trash, 
  CaretRight,
  Calendar,
  Sparkle,
  PencilSimple,
  X
} from 'phosphor-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
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
  getActiveGoals,
  createGoal, 
  updateGoalProgress,
  updateGoalStatus,
  deleteGoal,
  getGoalStats,
  type Goal,
  type GoalCategory,
  type GoalStatus
} from '@/lib/services/goalsService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useToast } from '@/hooks/use-toast'
import { useTheme } from '@/contexts/ThemeContext'

interface GoalsDashboardProps {
  userId: string
}

const categoryColorsLight: Record<GoalCategory, string> = {
  personal: 'bg-purple-100 text-purple-700',
  professional: 'bg-blue-100 text-blue-700',
  wellness: 'bg-emerald-100 text-emerald-700',
  relationships: 'bg-rose-100 text-rose-700',
  financial: 'bg-amber-100 text-amber-700',
  other: 'bg-gray-100 text-gray-700'
}

const categoryColorsDark: Record<GoalCategory, string> = {
  personal: 'bg-purple-500/20 text-purple-400',
  professional: 'bg-blue-500/20 text-blue-400',
  wellness: 'bg-emerald-500/20 text-emerald-400',
  relationships: 'bg-rose-500/20 text-rose-400',
  financial: 'bg-amber-500/20 text-amber-400',
  other: 'bg-white/10 text-white/70'
}

const categoryIcons: Record<GoalCategory, string> = {
  personal: '🌟',
  professional: '💼',
  wellness: '🧘',
  relationships: '❤️',
  financial: '💰',
  other: '📌'
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
    why_important: ''
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
        getGoalStats(supabase, userId)
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
        variant: 'destructive'
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
        why_important: newGoal.why_important.trim() || undefined
      })

      if (result.success) {
        toast({
          title: 'Goal created',
          description: 'Your new goal has been added'
        })
        setShowCreateDialog(false)
        setNewGoal({
          title: '',
          description: '',
          category: 'personal',
          target_date: '',
          why_important: ''
        })
        loadGoals()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create goal',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error creating goal:', error)
      toast({
        title: 'Error',
        description: 'Failed to create goal',
        variant: 'destructive'
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
          title: '🎉 Goal completed!',
          description: 'Congratulations on achieving your goal!'
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
        description: `Goal marked as ${status}`
      })
    }
  }

  const handleDeleteGoal = async (goalId: string) => {
    const result = await deleteGoal(supabase, goalId)
    if (result.success) {
      loadGoals()
      toast({
        title: 'Goal deleted',
        description: 'Goal has been removed'
      })
    }
  }

  if (isLoading) {
    return (
      <Card className={isDark ? 'bg-white/5 border-white/10' : ''}>
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
    <Card className={isDark ? 'bg-white/5 border-white/10' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-lg flex items-center gap-2 ${isDark ? 'text-white' : ''}`}>
            <Target size={20} className="text-blue-500" />
            Goals
          </CardTitle>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus size={16} weight="bold" />
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
                      <SelectItem value="personal">🌟 Personal</SelectItem>
                      <SelectItem value="professional">💼 Professional</SelectItem>
                      <SelectItem value="wellness">🧘 Wellness</SelectItem>
                      <SelectItem value="relationships">❤️ Relationships</SelectItem>
                      <SelectItem value="financial">💰 Financial</SelectItem>
                      <SelectItem value="other">📌 Other</SelectItem>
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
                  className="w-full"
                >
                  {isCreating ? 'Creating...' : 'Create Goal'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-blue-500/20' : 'bg-blue-50'}`}>
              <div className={`text-lg font-bold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{stats.activeGoals}</div>
              <div className={`text-xs ${isDark ? 'text-blue-300' : 'text-blue-600'}`}>Active</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-50'}`}>
              <div className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>{stats.completedGoals}</div>
              <div className={`text-xs ${isDark ? 'text-emerald-300' : 'text-emerald-600'}`}>Completed</div>
            </div>
            <div className={`text-center p-2 rounded-lg ${isDark ? 'bg-purple-500/20' : 'bg-purple-50'}`}>
              <div className={`text-lg font-bold ${isDark ? 'text-purple-400' : 'text-purple-700'}`}>{stats.completionRate}%</div>
              <div className={`text-xs ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>Success Rate</div>
            </div>
          </div>
        )}

        {/* Filter */}
        <div className={`flex gap-1 mt-3 rounded-lg p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
          {(['active', 'completed', 'all'] as const).map((f) => (
            <Button
              key={f}
              size="sm"
              variant={filter === f ? 'default' : 'ghost'}
              className={`flex-1 h-7 text-xs capitalize ${filter === f ? isDark ? 'bg-white/20 shadow-sm text-white' : 'bg-white shadow-sm' : isDark ? 'text-white/60 hover:text-white' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        <AnimatePresence>
          {goals.length === 0 ? (
            <div className={`text-center py-8 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
              <Target size={40} className={`mx-auto mb-2 ${isDark ? 'text-white/20' : 'text-gray-300'}`} />
              <p className="text-sm">No {filter !== 'all' ? filter : ''} goals yet</p>
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowCreateDialog(true)}
                className="mt-2"
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
                className={`p-4 border rounded-lg transition-colors ${isDark ? 'border-white/10 hover:border-blue-400/30' : 'hover:border-blue-200'}`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${categoryColors[goal.category]}`}>
                        {categoryIcons[goal.category]} {goal.category}
                      </span>
                      {goal.status === 'completed' && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                          ✓ Completed
                        </span>
                      )}
                    </div>
                    <h4 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{goal.title}</h4>
                    {goal.why_important && (
                      <p className={`text-xs mt-1 line-clamp-2 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>{goal.why_important}</p>
                    )}
                    
                    {/* Progress bar */}
                    {goal.status === 'active' && (
                      <div className="mt-3">
                        <div className={`flex items-center justify-between text-xs mb-1 ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
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
                      <div className={`flex items-center gap-1 mt-2 text-xs ${isDark ? 'text-white/50' : 'text-gray-500'}`}>
                        <Calendar size={12} />
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
                          <Check size={16} weight="bold" className="text-emerald-500" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          onClick={() => handleUpdateStatus(goal.id, 'paused')}
                          title="Pause goal"
                        >
                          <Pause size={16} weight="bold" className="text-amber-500" />
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
                      <Trash size={16} weight="bold" className={`hover:text-rose-500 ${isDark ? 'text-white/40' : 'text-gray-400'}`} />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  )
}
