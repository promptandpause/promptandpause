'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Plus, X, Check, Sparkles, Crown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  getTodayGratitude, 
  saveGratitude, 
  getGratitudeStreak,
  type GratitudeItem 
} from '@/lib/services/gratitudeService'
import { getSupabaseClient } from '@/lib/supabase/client'
import { useTier } from '@/hooks/useTier'
import { useToast } from '@/hooks/use-toast'

interface GratitudeEntryProps {
  userId: string
  reflectionId?: string
  onSave?: () => void
  compact?: boolean
}

export default function GratitudeEntry({ userId, reflectionId, onSave, compact = false }: GratitudeEntryProps) {
  const { tier } = useTier()
  const isPremium = tier === 'premium'
  const maxItems = isPremium ? 10 : 3
  
  const [items, setItems] = useState<GratitudeItem[]>([])
  const [newItem, setNewItem] = useState('')
  const [streak, setStreak] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [hasChanges, setHasChanges] = useState(false)

  const supabase = getSupabaseClient()
  const { toast } = useToast()

  useEffect(() => {
    loadGratitude()
  }, [userId])

  const loadGratitude = async () => {
    setIsLoading(true)
    try {
      const [todayData, streakData] = await Promise.all([
        getTodayGratitude(supabase, userId),
        getGratitudeStreak(supabase, userId)
      ])
      
      if (todayData?.items) {
        setItems(todayData.items as GratitudeItem[])
      }
      setStreak(streakData)
    } catch (error) {
      console.error('Error loading gratitude:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const addItem = () => {
    if (!newItem.trim()) return
    if (items.length >= maxItems) {
      toast({
        title: isPremium ? 'Maximum reached' : 'Free tier limit',
        description: isPremium 
          ? 'You can add up to 10 gratitude items per day.'
          : 'Upgrade to Premium for unlimited gratitude entries.',
        variant: 'destructive'
      })
      return
    }

    setItems([...items, { text: newItem.trim() }])
    setNewItem('')
    setHasChanges(true)
  }

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index))
    setHasChanges(true)
  }

  const handleSave = async () => {
    if (items.length === 0) return
    
    setIsSaving(true)
    try {
      const result = await saveGratitude(supabase, userId, items, reflectionId)
      
      if (result.success) {
        toast({
          title: 'Gratitude saved',
          description: `${items.length} thing${items.length > 1 ? 's' : ''} you're grateful for today.`
        })
        setHasChanges(false)
        onSave?.()
        
        // Refresh streak
        const newStreak = await getGratitudeStreak(supabase, userId)
        setStreak(newStreak)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save gratitude',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error saving gratitude:', error)
      toast({
        title: 'Error',
        description: 'Failed to save gratitude',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addItem()
    }
  }

  if (isLoading) {
    return (
      <Card className={compact ? 'border-0 shadow-none' : ''}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="animate-pulse space-y-3">
            <div className="h-5 bg-gray-200 rounded w-1/3"></div>
            <div className="h-10 bg-gray-200 rounded"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-rose-500" />
            <span className="text-sm font-medium text-gray-700">Gratitude</span>
          </div>
          {streak > 0 && (
            <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              🔥 {streak} day streak
            </span>
          )}
        </div>

        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2 p-2 bg-rose-50 rounded-lg group"
              >
                <Heart className="w-3 h-3 text-rose-400 flex-shrink-0" />
                <span className="text-sm text-gray-700 flex-1">{item.text}</span>
                <button
                  onClick={() => removeItem(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {items.length < maxItems && (
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="I'm grateful for..."
              className="text-sm h-9"
            />
            <Button
              size="sm"
              onClick={addItem}
              disabled={!newItem.trim()}
              className="h-9 px-3"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        )}

        {!isPremium && items.length >= maxItems && (
          <Link href="/dashboard/settings#subscription" className="block">
            <p className="text-xs text-amber-600 text-center hover:text-amber-700 cursor-pointer">
              <Crown className="w-3 h-3 inline mr-1" />
              Upgrade to Premium for unlimited entries
            </p>
          </Link>
        )}

        {hasChanges && items.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="w-full bg-rose-500 hover:bg-rose-600"
          >
            {isSaving ? 'Saving...' : 'Save Gratitude'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Heart className="w-5 h-5 text-rose-500" />
            Daily Gratitude
          </CardTitle>
          {streak > 0 && (
            <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {streak} day streak
            </span>
          )}
        </div>
        <p className="text-sm text-gray-500">
          What are you grateful for today?
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-3 bg-gradient-to-r from-rose-50 to-pink-50 rounded-lg group"
              >
                <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <Heart className="w-3 h-3 text-rose-500" />
                </div>
                <span className="text-gray-700 flex-1">{item.text}</span>
                <button
                  onClick={() => removeItem(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-rose-100 rounded"
                >
                  <X className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {items.length < maxItems && (
          <div className="flex gap-2">
            <Input
              value={newItem}
              onChange={(e) => setNewItem(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="I'm grateful for..."
              className="flex-1"
            />
            <Button
              onClick={addItem}
              disabled={!newItem.trim()}
              variant="outline"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add
            </Button>
          </div>
        )}

        {!isPremium && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-500">
              {items.length}/{maxItems} entries
            </span>
            {items.length >= maxItems && (
              <Link href="/dashboard/settings#subscription">
                <Button variant="link" size="sm" className="text-amber-600 p-0 h-auto">
                  <Crown className="w-3 h-3 mr-1" />
                  Upgrade for more
                </Button>
              </Link>
            )}
          </div>
        )}

        {hasChanges && items.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-rose-500 hover:bg-rose-600"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Save Gratitude
              </>
            )}
          </Button>
        )}

        {items.length === 0 && !hasChanges && (
          <div className="text-center py-4 text-gray-500">
            <Heart className="w-8 h-8 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">Start your gratitude practice today</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
