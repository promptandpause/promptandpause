"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Hash } from 'phosphor-react'

interface TrendingTag {
  tag: string
  count: number
}

export function TrendingTopics() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const [trending, setTrending] = useState<TrendingTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTrending()
  }, [])

  async function loadTrending() {
    try {
      const res = await fetch('/api/social/trending-tags')
      const { data } = await res.json()
      setTrending(data || [])
    } catch {}
    setLoading(false)
  }

  if (loading) {
    return (
      <div className={`rounded-3xl border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'} p-4`}>
        <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trending topics</h3>
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="mb-3">
            <div className={`h-3 w-24 rounded ${isDark ? 'bg-white/8' : 'bg-slate-100'} animate-pulse mb-1`} />
            <div className={`h-2.5 w-14 rounded ${isDark ? 'bg-white/5' : 'bg-slate-100'} animate-pulse`} />
          </div>
        ))}
      </div>
    )
  }

  if (trending.length === 0) {
    return (
      <div className={`rounded-3xl border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'} p-4`}>
        <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trending topics</h3>
        <p className={`text-sm ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
          No trending topics yet. Trends appear as the community shares reflections.
        </p>
      </div>
    )
  }

  return (
    <div className={`rounded-3xl border ${isDark ? 'bg-white/[0.04] border-white/[0.06]' : 'bg-white/70 border-slate-100 shadow-soft-card'} p-4`}>
      <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>Trending topics</h3>
      <div className="space-y-1">
        {trending.map((item, i) => (
          <motion.div
            key={item.tag}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className={`flex items-center gap-3 px-2 py-2.5 rounded-xl transition-colors ${
              isDark ? '' : ''
            }`}
          >
            <Hash size={16} weight="bold" className={`shrink-0 ${isDark ? 'text-[#818CF8]/60' : 'text-slate-400'}`} />
            <div className="flex-1 min-w-0">
              <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-slate-800'}`}>
                {item.tag}
              </p>
              <p className={`text-xs ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                {item.count} {item.count === 1 ? 'reflection' : 'reflections'}
              </p>
            </div>
          </motion.div>
        ))}
      </div>

    </div>
  )
}
