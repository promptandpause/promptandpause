'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Heart, Plus, X, Check, Sparkle, Crown } from 'phosphor-react'
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
import { useTheme } from '@/contexts/ThemeContext'

interface GratitudeEntryProps {
  userId: string
  reflectionId?: string
  onSave?: () => void
  compact?: boolean
}

export default function GratitudeEntry({ userId, reflectionId, onSave, compact = false }: GratitudeEntryProps) {
  const { tier } = useTier()
  const { theme } = useTheme()
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
      <Card className={`${compact ? 'border-0 shadow-none' : ''} ${theme === 'dark' ? 'bg-white/5 border-white/10' : ''}`}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="animate-pulse space-y-3">
            <div className={`h-5 rounded w-1/3 ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-10 rounded ${theme === 'dark' ? 'bg-white/10' : 'bg-gray-200'}`}></div>
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
            <Heart size={16} weight="bold" className="text-rose-500" />
            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>Gratitude</span>
          </div>
          {streak > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${theme === 'dark' ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-50'}`}>
              🔥 {streak} days in a row
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
                className={`flex items-center gap-2 p-2 rounded-lg group ${theme === 'dark' ? 'bg-rose-500/20' : 'bg-rose-50'}`}
              >
                <Heart size={12} className="text-rose-400 flex-shrink-0" />
                <span className={`text-sm flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{item.text}</span>
                <button
                  onClick={() => removeItem(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={16} weight="bold" className={`${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} />
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
              className={`text-sm h-9 ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' : ''}`}
            />
            <Button
              size="sm"
              onClick={addItem}
              disabled={!newItem.trim()}
              className="h-9 px-3"
            >
              <Plus size={16} weight="bold" />
            </Button>
          </div>
        )}

        {!isPremium && items.length >= maxItems && (
          <Link href="/dashboard/settings#subscription" className="block">
            <p className={`text-xs text-center cursor-pointer ${theme === 'dark' ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
              <Crown size={12} className="inline mr-1" />
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
    <Card className={`relative overflow-hidden rounded-2xl border shadow-none ${theme === 'dark' ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-[#E8E5DE]'}`}>
      {/* Ambient amber glow top-right */}
      <span
        aria-hidden
        className={`pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full blur-3xl ${theme === 'dark' ? 'bg-amber-400/15' : 'bg-amber-300/25'}`}
      />
      <CardHeader className="pb-3 relative">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            {/* Gradient orb */}
            <span className="relative inline-flex items-center justify-center shrink-0">
              <span className={`absolute inset-[-8px] rounded-2xl blur-lg ${theme === 'dark' ? 'bg-amber-400/30' : 'bg-amber-300/40'}`} />
              <span className="relative inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-rose-500 shadow-[0_10px_24px_-8px_rgba(245,158,11,0.45)]">
                <span aria-hidden className="absolute inset-1 rounded-xl bg-gradient-to-br from-white/30 via-white/5 to-transparent" />
                <Sparkle size={20} className="text-white" />
              </span>
            </span>
            <div className="min-w-0">
              <CardTitle className={`text-lg font-semibold tracking-tight ${theme === 'dark' ? 'text-white' : 'text-[#2F3B34]'}`}>
                Daily gratitude
              </CardTitle>
              <p className={`mt-0.5 text-[13px] ${theme === 'dark' ? 'text-white/55' : 'text-[#6B7F6E]'}`}>
                What are you grateful for today?
              </p>
            </div>
          </div>
          {streak > 0 && (
            <motion.span
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 20 }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap shrink-0 ${
                theme === 'dark'
                  ? 'text-amber-300 bg-amber-500/10 border border-amber-400/25'
                  : 'text-amber-700 bg-amber-50 border border-amber-200'
              }`}
            >
              <Sparkle size={12} />
              {streak} days in a row
            </motion.span>
          )}
        </div>
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
                className={`flex items-center gap-3 p-3 rounded-lg group ${theme === 'dark' ? 'bg-rose-500/20' : 'bg-gradient-to-r from-rose-50 to-pink-50'}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${theme === 'dark' ? 'bg-rose-500/30' : 'bg-rose-100'}`}>
                  <Heart size={12} className="text-rose-500" />
                </div>
                <span className={`flex-1 ${theme === 'dark' ? 'text-white' : 'text-gray-700'}`}>{item.text}</span>
                <button
                  onClick={() => removeItem(index)}
                  className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded ${theme === 'dark' ? 'hover:bg-white/10' : 'hover:bg-rose-100'}`}
                >
                  <X size={16} weight="bold" className={`${theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`} />
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
              className={`flex-1 ${theme === 'dark' ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' : ''}`}
            />
            <Button
              onClick={addItem}
              disabled={!newItem.trim()}
              variant="outline"
              className={theme === 'dark' ? 'border-white/20 text-white hover:bg-white/10' : ''}
            >
              <Plus size={16} weight="bold" className="mr-1" />
              Add
            </Button>
          </div>
        )}

        {!isPremium && (
          <div className="flex items-center justify-between text-sm">
            <span className={theme === 'dark' ? 'text-white/60' : 'text-gray-500'}>
              {items.length}/{maxItems} entries
            </span>
            {items.length >= maxItems && (
              <Link href="/dashboard/settings#subscription">
                <Button variant="link" size="sm" className={`p-0 h-auto ${theme === 'dark' ? 'text-amber-400' : 'text-amber-600'}`}>
                  <Crown size={12} className="mr-1" />
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
                <Check size={16} weight="bold" className="mr-2" />
                Save Gratitude
              </>
            )}
          </Button>
        )}

        {items.length === 0 && !hasChanges && (
          <div className={`text-center py-4 ${theme === 'dark' ? 'text-white/50' : 'text-gray-500'}`}>
            <Heart size={32} className={`mx-auto mb-2 ${theme === 'dark' ? 'text-white/20' : 'text-gray-300'}`} />
            <p className="text-sm">Start your gratitude practice today</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
