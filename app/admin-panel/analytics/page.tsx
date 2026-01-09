'use client'

import { useCallback, useEffect, useState } from 'react'
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
  const [error, setError] = useState<string | null>(null)

  const loadAnalytics = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/analytics/engagement?days=${days}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')
      
      const data = await response.json()
      setEngagement(data.data)
    } catch (error: any) {
      setError(error?.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    loadAnalytics()
  }, [loadAnalytics])

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-gray-200" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 bg-gray-200" />
          ))}
        </div>
        <Skeleton className="h-96 bg-gray-200" />
      </div>
    )
  }

  if (error || !engagement) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-700">{error || 'Failed to load analytics'}</p>
      </Card>
    )
  }

  const { overall, byActivity, trend } = engagement

  const statCards = [
    {
      title: 'Total Prompts Sent',
      value: overall.total_prompts_sent.toLocaleString(),
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Total Reflections',
      value: overall.total_reflections.toLocaleString(),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50'
    },
    {
      title: 'Engagement Rate',
      value: `${overall.overall_engagement_rate.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Avg Reflection Length',
      value: `${overall.avg_reflection_length} words`,
      icon: Users,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50'
    },
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Analytics</h1>
          <p className="text-sm text-gray-500 mt-1">Engagement and performance metrics</p>
        </div>
        <Select value={days} onValueChange={setDays}>
          <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
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
            <Card key={card.title} className="bg-white border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-gray-500">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Reflection Trend Chart */}
      <Card className="bg-white border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reflection Activity</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <YAxis 
              stroke="#9ca3af"
              tick={{ fill: '#9ca3af' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                color: '#111827'
              }}
            />
            <Legend wrapperStyle={{ color: '#6b7280' }} />
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
        <Card className="bg-white border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Engagement by User Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={byActivity}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="status" 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <YAxis 
                stroke="#9ca3af"
                tick={{ fill: '#9ca3af' }}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827'
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

        <Card className="bg-white border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Distribution</h3>
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
                  backgroundColor: '#ffffff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  color: '#111827'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-white border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Daily Average</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {trend.length > 0 
              ? Math.round(trend.reduce((sum, day) => sum + day.reflections, 0) / trend.length)
              : 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Reflections per day</p>
        </Card>

        <Card className="bg-white border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Peak Day</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {trend.length > 0 
              ? Math.max(...trend.map(d => d.reflections))
              : 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Maximum reflections in a day</p>
        </Card>

        <Card className="bg-white border border-gray-100 p-6">
          <p className="text-sm text-gray-500">Active Users</p>
          <p className="text-3xl font-semibold text-gray-900 mt-2">
            {byActivity.find(a => a.status === 'active')?.count || 0}
          </p>
          <p className="text-xs text-gray-500 mt-1">Users active in last 7 days</p>
        </Card>
      </div>
    </div>
  )
}
