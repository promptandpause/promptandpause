'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faHeart,
  faSun,
  faPlus,
  faXmark,
  faCrown,
  faCheck,
} from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  getTodayGratitude,
  saveGratitude,
  getGratitudeStreak,
  type GratitudeItem,
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
  const isDark = theme === 'dark'
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

  const loadGratitude = useCallback(async () => {
    setIsLoading(true)
    try {
      const [todayData, streakData] = await Promise.all([
        getTodayGratitude(supabase, userId),
        getGratitudeStreak(supabase, userId),
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
  }, [supabase, userId])

  useEffect(() => {
    loadGratitude()
  }, [loadGratitude])

  const addItem = () => {
    if (!newItem.trim()) return
    if (items.length >= maxItems) {
      toast({
        title: isPremium ? 'Maximum reached' : 'Free tier limit',
        description: isPremium
          ? 'You can add up to 10 gratitude items per day.'
          : 'Upgrade to Premium for unlimited gratitude entries.',
        variant: 'destructive',
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
          description: `${items.length} thing${items.length > 1 ? 's' : ''} you're grateful for today.`,
        })
        setHasChanges(false)
        onSave?.()

        const newStreak = await getGratitudeStreak(supabase, userId)
        setStreak(newStreak)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to save gratitude',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error saving gratitude:', error)
      toast({
        title: 'Error',
        description: 'Failed to save gratitude',
        variant: 'destructive',
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

  const entryCard = (index: number, isPlaceholder: boolean) => (
    <div
      key={isPlaceholder ? `slot-${index}` : `item-${index}`}
      className={
        isPlaceholder
          ? 'flex items-center gap-3 p-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200'
          : 'flex items-center gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100'
      }
    >
      <span
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shadow-sm shrink-0 ${
          isPlaceholder
            ? 'bg-white text-slate-400'
            : 'bg-white text-amber-600'
        }`}
      >
        {index + 1}
      </span>
      {isPlaceholder ? (
        <p className="text-sm font-medium text-slate-400 italic">What else?</p>
      ) : (
        <>
          <p className="text-sm font-medium text-slate-600 flex-1">{items[index].text}</p>
          <button
            onClick={() => removeItem(index)}
            className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-amber-100`}
            aria-label={`Remove ${items[index].text}`}
          >
            <FontAwesomeIcon
              icon={faXmark}
              className={`text-xs ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
            />
          </button>
        </>
      )}
    </div>
  )

  if (isLoading) {
    return (
      <Card className={`${compact ? 'border-0 shadow-none' : ''} ${isDark ? 'bg-white/5 border-white/10' : ''}`}>
        <CardContent className={compact ? 'p-0' : 'p-6'}>
          <div className="animate-pulse space-y-3">
            <div className={`h-5 rounded w-1/3 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
            <div className={`h-10 rounded ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}></div>
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
            <FontAwesomeIcon icon={faHeart} className={`text-amber-500 text-sm`} />
            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-slate-700'}`}>Gratitude</span>
          </div>
          {streak > 0 && (
            <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-50'}`}>
              {streak} days in a row
            </span>
          )}
        </div>

        <div className="space-y-2 group">
          <AnimatePresence>
            {items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50/50 border border-amber-100"
              >
                <span className="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[11px] font-bold text-amber-600 shadow-sm shrink-0">
                  {index + 1}
                </span>
                <span className={`text-sm flex-1 ${isDark ? 'text-white' : 'text-slate-600'}`}>{item.text}</span>
                <button onClick={() => removeItem(index)} className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <FontAwesomeIcon icon={faXmark} className={`text-xs ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`} />
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
              className={`text-sm h-9 ${isDark ? 'bg-white/10 border-white/20 text-white placeholder:text-white/50' : 'bg-slate-50/80 border-slate-200'}`}
            />
            <Button
              size="sm"
              onClick={addItem}
              disabled={!newItem.trim()}
              className="h-9 px-3 bg-amber-500 hover:bg-amber-600"
            >
              <FontAwesomeIcon icon={faPlus} className="text-sm" />
            </Button>
          </div>
        )}

        {!isPremium && items.length >= maxItems && (
          <Link href="/dashboard/settings#subscription" className="block">
            <p className={`text-xs text-center cursor-pointer ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
              <FontAwesomeIcon icon={faCrown} className="mr-1 text-xs" />
              Upgrade to Premium for unlimited entries
            </p>
          </Link>
        )}

        {hasChanges && items.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="sm"
            className="w-full bg-amber-500 hover:bg-amber-600"
          >
            {isSaving ? 'Saving...' : 'Save Gratitude'}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={`relative overflow-hidden glass rounded-3xl border-slate-100 soft-shadow p-6 flex flex-col group ${
      isDark ? '!bg-white/[0.04] !backdrop-blur-none border-white/[0.06]' : 'border-slate-100'
    }`}>
      {/* Ambient amber orb + sun */}
      <span
        aria-hidden
        className="pointer-events-none absolute -top-6 -right-6 w-24 h-24 bg-amber-50 rounded-full group-hover:scale-110 transition-transform duration-700"
      />
      <FontAwesomeIcon
        icon={faSun}
        className={`text-2xl absolute top-6 right-6 ${isDark ? 'text-amber-400/70' : 'text-amber-400'}`}
        aria-hidden
      />

      <CardHeader className="p-0 pb-6 relative">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center shrink-0">
            <FontAwesomeIcon icon={faHeart} className={`text-sm ${isDark ? 'text-amber-400' : 'text-amber-500'}`} />
          </span>
          <div className="flex-1 min-w-0 flex items-center gap-2 flex-wrap">
            <div>
              <CardTitle className={`text-base font-semibold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Gratitude
              </CardTitle>
              <p className={`text-xs ${isDark ? 'text-white/45' : 'text-slate-400'}`}>Reflect on your day</p>
            </div>
            {streak > 0 && (
              <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[12px] font-semibold whitespace-nowrap ${
                isDark ? 'text-amber-300 bg-amber-500/10 border border-amber-400/25' : 'text-amber-700 bg-amber-50 border border-amber-200'
              }`}>
                <FontAwesomeIcon icon={faSun} className="text-xs" />
                {streak} streak
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex flex-col flex-1">
        {/* Composer */}
        <div className="relative flex items-center group mb-5">
          <Input
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="I'm grateful for..."
            className={`w-full bg-slate-50/80 text-sm font-medium py-3 px-4 rounded-2xl border border-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-amber-300 focus:bg-white focus:ring-4 focus:ring-amber-50 transition-all pr-12 ${
              isDark ? '!bg-white/5 !border-white/15 !placeholder:text-white/40 text-white' : ''
            }`}
          />
          <button
            onClick={addItem}
            disabled={!newItem.trim()}
            className="absolute right-2 w-9 h-9 bg-amber-500 text-white rounded-xl flex items-center justify-center shadow-lg shadow-amber-200 hover:scale-105 hover:bg-amber-600 transition-all disabled:opacity-40 disabled:pointer-events-none"
            aria-label="Add gratitude item"
          >
            <FontAwesomeIcon icon={faPlus} className="text-sm" />
          </button>
        </div>

        {/* Entries with numbered badges + dashed "What else?" slot */}
        <div className="space-y-3 flex-1">
          <AnimatePresence initial={false}>
            {items.map((item, index) => (
              <motion.div
                key={`item-${index}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50/50 border border-amber-100"
              >
                <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-bold text-amber-600 shadow-sm shrink-0">
                  {index + 1}
                </span>
                <p className={`text-sm font-medium flex-1 ${isDark ? 'text-white/80' : 'text-slate-600'}`}>{item.text}</p>
                <button
                  onClick={() => removeItem(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-amber-100"
                  aria-label={`Remove ${item.text}`}
                >
                  <FontAwesomeIcon icon={faXmark} className={`text-xs ${isDark ? 'text-white/50 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {items.length < maxItems && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-slate-50/60 border border-dashed border-slate-200">
              <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center text-xs font-semibold text-slate-400 shadow-sm shrink-0">
                {items.length + 1}
              </span>
              <p className="text-sm font-medium text-slate-400 italic">What else?</p>
            </div>
          )}
        </div>

        {!isPremium && (
          <Link href="/dashboard/settings#subscription" className="mt-4 block">
            <p className={`text-xs text-center cursor-pointer ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}`}>
              <FontAwesomeIcon icon={faCrown} className="mr-1 text-xs" />
              Upgrade to Premium for up to 10 entries
            </p>
          </Link>
        )}

        {/* Progress */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <div className="flex justify-between items-center mb-2.5">
            <span className={`text-[10px] font-bold tracking-widest uppercase ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              Today&apos;s progress
            </span>
            <span className="text-[10px] font-bold text-amber-600 tracking-widest uppercase">
              {items.length} / {maxItems} entries
            </span>
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, (items.length / maxItems) * 100)}%` }}
            />
          </div>
        </div>

        {hasChanges && items.length > 0 && (
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full mt-4 bg-amber-500 hover:bg-amber-600 shadow-lg shadow-amber-200"
          >
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                <FontAwesomeIcon icon={faCheck} className="mr-2 text-sm" />
                Save Gratitude
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
