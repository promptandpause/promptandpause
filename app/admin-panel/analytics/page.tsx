'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp, Users, MessageSquare, BarChart3, CalendarDays, Download } from 'lucide-react'

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
      <div className="space-y-8">
        <Skeleton className="h-8 w-64 bg-muted" />
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 bg-muted" />
          ))}
        </div>
        <Skeleton className="h-96 bg-muted" />
      </div>
    )
  }

  if (error || !engagement) {
    return (
      <Card className="shadow-none border border-destructive/50">
        <CardContent>
          <p className="text-destructive">{error || 'Failed to load analytics'}</p>
        </CardContent>
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
      bgColor: 'bg-blue-50',
      footnote: 'Prompts delivered in period'
    },
    {
      title: 'Total Reflections',
      value: overall.total_reflections.toLocaleString(),
      icon: TrendingUp,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      footnote: 'Reflections submitted'
    },
    {
      title: 'Engagement Rate',
      value: `${overall.overall_engagement_rate.toFixed(1)}%`,
      icon: BarChart3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      footnote: 'Reflections per prompt'
    },
    {
      title: 'Avg Reflection Length',
      value: `${overall.avg_reflection_length} words`,
      icon: Users,
      color: 'text-amber-700',
      bgColor: 'bg-amber-50',
      footnote: 'Words per reflection'
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Engagement and performance metrics</p>
        </div>
        <div className="flex gap-2">
          <Select value={days} onValueChange={setDays}>
            <SelectTrigger className="w-[180px]">
              <CalendarDays className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="mr-2 h-4 w-4" /> Export Report
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="shadow-none border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between gap-2">
                  {card.title}
                  <div className={`rounded-lg p-2 ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{card.footnote}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Reflection Trend Chart */}
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle>Reflection Activity</CardTitle>
          <CardDescription>Reflections submitted over the selected period</CardDescription>
        </CardHeader>
        <CardContent className="h-[350px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis 
                dataKey="date" 
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="var(--muted-foreground)"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'var(--card)',
                  borderColor: 'var(--border)',
                  borderRadius: '8px'
                }}
              />
              <Legend wrapperStyle={{ color: 'var(--muted-foreground)' }} />
              <Line 
                type="monotone" 
                dataKey="reflections" 
                stroke="var(--primary)" 
                strokeWidth={2}
                dot={{ fill: 'var(--primary)' }}
                name="Reflections"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Engagement by Activity Status */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle>Engagement by User Status</CardTitle>
            <CardDescription>Average engagement rate by user status</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byActivity}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                <XAxis 
                  dataKey="status" 
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="var(--muted-foreground)"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  cursor={{ fill: 'var(--muted)', opacity: 0.2 }}
                  contentStyle={{ 
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${value.toFixed(1)}%`}
                />
                <Bar 
                  dataKey="avgEngagement" 
                  fill="var(--primary)"
                  radius={[4, 4, 0, 0]}
                  name="Avg Engagement %"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle>User Distribution</CardTitle>
            <CardDescription>User base by activity status</CardDescription>
          </CardHeader>
          <CardContent className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
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
                    backgroundColor: 'var(--card)',
                    borderColor: 'var(--border)',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="shadow-none border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trend.length > 0 
                ? Math.round(trend.reduce((sum, day) => sum + day.reflections, 0) / trend.length)
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Reflections per day</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Peak Day</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {trend.length > 0 
                ? Math.max(...trend.map(d => d.reflections))
                : 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Maximum reflections in a day</p>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {byActivity.find(a => a.status === 'active')?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Users active in last 7 days</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
