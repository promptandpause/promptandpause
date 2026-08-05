"use client"

import { useState, useEffect } from 'react'
import { useParams, useSearchParams } from 'next/navigation'
import { useTheme } from '@/contexts/ThemeContext'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Loader2, TrendingUp } from 'lucide-react'

interface AnalyticsDay {
  date: string
  active_member_count: number
  reflections_count: number
  avg_mood_score: number | null
}

export default function WorkspaceAnalyticsPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const params = useParams()
  const orgId = params.id as string
  const searchParams = useSearchParams()
  const from = searchParams.get('from') || ''
  const to = searchParams.get('to') || ''

  const [data, setData] = useState<AnalyticsDay[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let url = `/api/org/${orgId}/analytics?`
    if (from) url += `from=${from}&`
    if (to) url += `to=${to}&`

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject('Failed to load analytics'))
      .then(body => {
        setData(body.data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to load analytics')
        setLoading(false)
      })
  }, [orgId, from, to])

  if (loading) {
    return (
      <div className={`flex items-center justify-center py-16 ${isDark ? 'bg-[#0A0E18]' : 'bg-white'}`}>
        <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/30' : 'text-slate-500'}`} />
      </div>
    )
  }

  if (error || !data.length) {
    return (
      <div className={`text-center py-16 ${isDark ? 'text-white/50' : 'text-slate-600'}`}>
        {error || 'No analytics data available yet'}
      </div>
    )
  }

  const chartData = data.map(d => ({
    date: d.date,
    reflections: d.reflections_count,
    members: d.active_member_count < 5 ? null : d.active_member_count,
    label: d.active_member_count < 5 ? 'Not enough data yet' : `${d.active_member_count} active`,
  }))

  return (
    <div className="space-y-6">
      <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-100'}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <TrendingUp className="h-4 w-4" /> Reflections over time
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'} />
            <XAxis 
              dataKey="date" 
              stroke={isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke={isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
              style={{ fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{
                background: isDark ? '#1B2436' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any, props: any) => {
                if (name === 'members' && value === null) {
                  return ['Not enough data yet', 'Active members']
                }
                return [value, name]
              }}
            />
            <Line 
              type="monotone" 
              dataKey="reflections" 
              stroke="#6366F1" 
              strokeWidth={2}
              dot={false}
              name="Reflections"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className={`p-4 rounded-xl border ${isDark ? 'bg-white/[0.04] border-white/10' : 'bg-slate-50 border-slate-100'}`}>
        <h3 className={`text-sm font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          <TrendingUp className="h-4 w-4" /> Active members over time
        </h3>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'} />
            <XAxis 
              dataKey="date" 
              stroke={isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
              style={{ fontSize: '11px' }}
            />
            <YAxis 
              stroke={isDark ? 'rgba(255,255,255,0.3)' : '#94A3B8'}
              style={{ fontSize: '11px' }}
            />
            <Tooltip 
              contentStyle={{
                background: isDark ? '#1B2436' : '#fff',
                border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
                borderRadius: '8px',
              }}
              formatter={(value: any, name: any, props: any) => {
                if (name === 'members' && value === null) {
                  return ['Not enough data yet', 'Active members']
                }
                return [value, name]
              }}
            />
            <Line 
              type="monotone" 
              dataKey="members" 
              stroke="#818CF8" 
              strokeWidth={2}
              dot={false}
              name="Active members"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
