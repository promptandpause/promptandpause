'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, MessageSquare, BarChart3 } from 'lucide-react'

interface EngagementData {
  overall: {
    total_prompts_sent: number
    total_reflections: number
    overall_engagement_rate: number
    avg_reflection_length: number
  }
  byActivity: Array<{
    status: string
    count: number
    avgEngagement: number
  }>
  trend: Array<{
    date: string
    reflections: number
  }>
}

const COLORS = {
  active: '#4ade80',
  moderate: '#60a5fa',
  inactive: '#94a3b8',
  dormant: '#64748b'
}

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState('30')
  const [engagement, setEngagement] = useState<EngagementData | null>(null)

  useEffect(() => {
    loadAnalytics()
  }, [days])

  async function loadAnalytics() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/analytics/engagement?days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const data = await response.json()
      setEngagement(data.data)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  if (!engagement) {
    return (
      <Card className="p-6 bg-red-500/10 border-red-500/20">
        <p className="text-red-400">Failed to load analytics</p>
      </Card>
    )
  }

  const { overall, byActivity, trend } = engagement

  const statCards = [
    {
      title: 'Total Prompts Sent',
      value: overall.total_prompts_sent.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10'
    },
    {
      title: 'Total Reflections',
      value: overall.total_reflections.toLocaleString(),
      icon: TrendingUp,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10'
    },
    {
      title: 'Engagement Rate',
      value: `${overall.overall_engagement_rate.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10'
    },
    {
      title: 'Avg Reflection Length',
      value: `${overall.avg_reflection_length} words`,
      icon: Users,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Analytics</h1>
          <p className="text-slate-400 mt-1">Engagement and performance metrics</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="bg-slate-800/50 border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">{card.title}</p>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Reflection Trend Chart */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Reflection Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis 
              dataKey="date" 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <YAxis 
              stroke="#94a3b8"
              tick={{ fill: '#94a3b8' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                border: '1px solid #334155',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend wrapperStyle={{ color: '#94a3b8' }} />
            <Line 
              type="monotone" 
              dataKey="reflections" 
              stroke="#60a5fa" 
              strokeWidth={2}
              dot={{ fill: '#60a5fa' }}
              name="Reflections"
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Engagement by Activity Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Engagement by User Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis 
                dataKey="status" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value: number) => `${value.toFixed(1)}%`}
              />
              <Bar 
                dataKey="avgEngagement" 
                fill="#8b5cf6"
                radius={[8, 8, 0, 0]}
                name="Avg Engagement %"
              />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <h3 className="text-lg font-semibold text-white mb-4">User Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={byActivity}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {byActivity.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={COLORS[entry.status as keyof typeof COLORS] || '#64748b'} 
                  />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#1e293b', 
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <p className="text-sm text-slate-400">Daily Average</p>
          <p className="text-3xl font-bold text-white mt-2">
            {trend.length > 0 
              ? Math.round(trend.reduce((sum, day) => sum + day.reflections, 0) / trend.length)
              : 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Reflections per day</p>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <p className="text-sm text-slate-400">Peak Day</p>
          <p className="text-3xl font-bold text-white mt-2">
            {trend.length > 0 
              ? Math.max(...trend.map(d => d.reflections))
              : 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Maximum reflections in a day</p>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700 p-6">
          <p className="text-sm text-slate-400">Active Users</p>
          <p className="text-3xl font-bold text-white mt-2">
            {byActivity.find(a => a.status === 'active')?.count || 0}
          </p>
          <p className="text-xs text-slate-500 mt-1">Users active in last 7 days</p>
        </Card>
      </div>
    </div>
  )
}
