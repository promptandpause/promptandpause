'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Users,
  DollarSign,
  TrendingUp,
  Crown,
  Activity as ActivityIcon,
  CircleCheck,
  AlertCircle,
  Server,
  CreditCard,
  ArrowUpRight,
  Sparkles
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface DashboardStats {
  mrr: number
  total_users: number
  free_users: number
  premium_users: number
  monthly_subs: number
  annual_subs: number
  engagement_rate: number
  total_prompts_sent: number
  total_reflections: number
  new_signups_30d: number
}

interface Activity {
  type: 'signup' | 'subscription'
  user_email: string
  user_name: string
  timestamp: string
  details: any
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard redirectPath="/admin-panel" requireAdmin={true}>
      <AdminPanelContent />
    </AuthGuard>
  )
}

function StatCard({ title, value, icon: Icon, description, trend, trendUp, color }: {
  title: string; value: string; icon: any; description: string; trend?: string; trendUp?: boolean; color: string
}) {
  return (
    <div className="group bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-3 rounded-lg ${color.replace('text-', 'bg-')}/10`}>
          <Icon className={`h-5 w-5 ${color}`} />
        </div>
        {trend && (
          <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-md ${
            trendUp ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
          }`}>
            <ArrowUpRight className="h-3 w-3" />
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-bold text-slate-900 tracking-tight">{value}</p>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  )
}

function QuickStatCard({ title, value, description }: {
  title: string; value: string; description: string
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 hover:shadow-md hover:border-slate-300 transition-all duration-200">
      <div className="space-y-2">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
        <p className="text-3xl font-bold text-slate-900 tracking-tight">{value}</p>
        <div className="h-1.5 w-full rounded-full bg-slate-100 mt-3 overflow-hidden">
          <div className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600" style={{ width: '65%' }} />
        </div>
        <p className="text-xs text-slate-400">{description}</p>
      </div>
    </div>
  )
}

function AdminPanelContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gbp = new Intl.NumberFormat('en-GB', {
    style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2,
  })

  useEffect(() => { loadDashboardData() }, [])

  async function loadDashboardData() {
    try {
      setLoading(true); setError(null)
      const statsResponse = await fetch('/api/admin/dashboard/stats')
      if (!statsResponse.ok) throw new Error('Failed to fetch stats')
      const statsData = await statsResponse.json()
      setStats(statsData.data)

      const activityResponse = await fetch('/api/admin/dashboard/activity?limit=10')
      if (!activityResponse.ok) throw new Error('Failed to fetch activity')
      const activityData = await activityResponse.json()
      setActivities(activityData.data)

      const healthResponse = await fetch('/api/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData)
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setError(err.message)
    } finally { setLoading(false) }
  }

  if (loading) {
    return (
      <div className="p-8 space-y-8">
        <div>
          <Skeleton className="h-8 w-64 bg-slate-200" />
          <Skeleton className="h-4 w-96 bg-slate-200 mt-2" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-36 rounded-xl bg-slate-200" />)}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="p-8">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm font-medium text-red-700">Error loading dashboard</p>
          </div>
          <p className="text-sm text-red-600/80">{error}</p>
        </div>
      </div>
    )
  }

  const conversionRate = stats.total_users > 0 ? ((stats.premium_users / stats.total_users) * 100).toFixed(1) : '0.0'
  const avgPrompts = stats.total_users > 0 ? (stats.total_prompts_sent / stats.total_users).toFixed(1) : '0'
  const arpu = stats.total_users > 0 ? gbp.format(stats.mrr / stats.total_users) : gbp.format(0)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-medium text-emerald-700">Live</span>
          </div>
          <p className="text-sm text-slate-500">Overview of key metrics and system status</p>
        </div>
        <button onClick={loadDashboardData} className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition-all flex items-center gap-2 shadow-sm">
          <Sparkles className="h-3.5 w-3.5" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Monthly Recurring Revenue" value={gbp.format(stats.mrr)} icon={DollarSign}
          description={`${stats.monthly_subs} monthly · ${stats.annual_subs} annual`} trend="+12.5%" trendUp color="text-emerald-600" />
        <StatCard title="Total Users" value={stats.total_users.toLocaleString()} icon={Users}
          description={`${stats.free_users.toLocaleString()} free · ${stats.premium_users.toLocaleString()} premium`} trend="+5.2%" trendUp color="text-blue-600" />
        <StatCard title="Engagement Rate" value={`${stats.engagement_rate.toFixed(1)}%`} icon={TrendingUp}
          description={`${stats.total_reflections.toLocaleString()} reflections`} color="text-violet-600" />
        <StatCard title="New Signups (30d)" value={stats.new_signups_30d.toLocaleString()} icon={Crown}
          description={`${stats.total_prompts_sent.toLocaleString()} prompts sent`} color="text-amber-600" />
      </div>

      {/* System Health */}
      {systemHealth && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="p-6">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-blue-50">
                  <Server className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-base font-semibold text-slate-900">System Health</h2>
                  <p className="text-xs text-slate-500">All monitored services</p>
                </div>
              </div>
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                systemHealth.overall === 'operational' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                systemHealth.overall === 'degraded' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-red-50 text-red-700 border border-red-200'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  systemHealth.overall === 'operational' ? 'bg-emerald-500' :
                  systemHealth.overall === 'degraded' ? 'bg-amber-500' : 'bg-red-500'
                }`} />
                {systemHealth.overall === 'operational' ? 'All Systems Operational' :
                 systemHealth.overall === 'degraded' ? 'Some Systems Degraded' : 'System Issues Detected'}
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {systemHealth.systems?.map((system: any) => (
                <div key={system.name} className={`p-4 rounded-lg border ${
                  system.status === 'operational' ? 'bg-emerald-50 border-emerald-200' :
                  system.status === 'degraded' ? 'bg-amber-50 border-amber-200' :
                  'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-slate-900">{system.name}</p>
                    {system.status === 'operational' ? <CircleCheck className="h-4 w-4 text-emerald-600" /> :
                     <AlertCircle className="h-4 w-4 text-amber-600" />}
                  </div>
                  <p className={`text-xs font-medium ${
                    system.status === 'operational' ? 'text-emerald-700' :
                    system.status === 'degraded' ? 'text-amber-700' : 'text-red-700'
                  }`}>
                    {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                  </p>
                  {system.responseTime !== undefined && system.responseTime > 0 && (
                    <p className="text-xs text-slate-500 mt-2">Response: {system.responseTime}ms</p>
                  )}
                  {system.error && <p className="text-xs text-red-600 mt-2 line-clamp-2">{system.error}</p>}
                </div>
              ))}
            </div>
          </div>
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-xs text-slate-500">Last updated: {new Date(systemHealth.timestamp).toLocaleString()}</p>
            <p className="text-xs text-slate-500">{systemHealth.systems?.length || 0} systems monitored</p>
          </div>
        </div>
      )}

      {/* Middle row */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl shadow-sm">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="p-2.5 rounded-lg bg-violet-50">
                <ActivityIcon className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Recent Activity</h2>
                <p className="text-xs text-slate-500">Latest user events</p>
              </div>
            </div>
            <div className="space-y-1">
              {activities.length === 0 ? (
                <div className="text-center py-8"><p className="text-sm text-slate-500">No recent activity</p></div>
              ) : (
                activities.map((activity, index) => (
                  <div key={index} className="flex items-start gap-4 p-3 rounded-lg hover:bg-slate-50 transition-colors">
                    <div className={`p-2.5 rounded-lg flex-shrink-0 ${activity.type === 'signup' ? 'bg-blue-50' : 'bg-emerald-50'}`}>
                      {activity.type === 'signup' ? <Users className="h-4 w-4 text-blue-600" /> : <CreditCard className="h-4 w-4 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900">
                        {activity.type === 'signup' ? 'New user signed up' : 'Subscription updated'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        {activity.user_email}
                        {activity.type === 'subscription' && activity.details?.event_type && (
                          <span className="ml-1.5 text-slate-400">({activity.details.event_type})</span>
                        )}
                      </p>
                    </div>
                    <span className="text-xs text-slate-400 whitespace-nowrap pt-1">
                      {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="space-y-4">
          <QuickStatCard title="Conversion Rate" value={`${conversionRate}%`} description="Premium / Total Users" />
          <QuickStatCard title="Avg Prompts/User" value={avgPrompts} description="Total prompts / Total users" />
          <QuickStatCard title="ARPU" value={arpu} description="Average Revenue Per User" />
        </div>
      </div>
    </div>
  )
}