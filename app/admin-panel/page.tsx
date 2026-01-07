'use client'

import { AuthGuard } from '@/components/auth/AuthGuard'
import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  MessageSquare,
  Crown,
  Activity as ActivityIcon,
  CircleCheck,
  AlertCircle,
  Server,
  CreditCard,
  Clock,
  Mail,
  FileText,
  Wrench,
  UserCircle,
  BarChart3,
  Settings,
  Shield,
  LayoutDashboard
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

interface SystemHealth {
  name: string
  status: 'operational' | 'degraded' | 'down'
  lastChecked: string
  uptime: number
}

export default function AdminDashboardPage() {
  return (
    <AuthGuard redirectPath="/admin-panel" requireAdmin={true}>
      <AdminPanelContent />
    </AuthGuard>
  )
}

function AdminPanelContent() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadDashboardData()
  }, [])

  async function loadDashboardData() {
    try {
      setLoading(true)
      setError(null)

      // Fetch stats
      const statsResponse = await fetch('/api/admin/dashboard/stats')
      if (!statsResponse.ok) {
        throw new Error('Failed to fetch stats')
      }
      const statsData = await statsResponse.json()
      setStats(statsData.data)

      // Fetch activity
      const activityResponse = await fetch('/api/admin/dashboard/activity?limit=10')
      if (!activityResponse.ok) {
        throw new Error('Failed to fetch activity')
      }
      const activityData = await activityResponse.json()
      setActivities(activityData.data)

      // Fetch system health
      const healthResponse = await fetch('/api/health')
      if (healthResponse.ok) {
        const healthData = await healthResponse.json()
        setSystemHealth(healthData)
      }
    } catch (err: any) {
      console.error('Error loading dashboard:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-64 bg-gray-200" />
          <Skeleton className="h-4 w-96 bg-gray-200 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 bg-gray-200" />
          ))}
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <Card className="p-6 bg-red-50 border-red-200">
        <p className="text-red-600">Error loading dashboard: {error}</p>
      </Card>
    )
  }

  const statCards = [
    {
      title: 'Monthly Recurring Revenue',
      value: `$${stats.mrr.toFixed(2)}`,
      icon: DollarSign,
      description: `${stats.monthly_subs} monthly, ${stats.annual_subs} annual`,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Total Users',
      value: stats.total_users.toString(),
      icon: Users,
      description: `${stats.free_users} free, ${stats.premium_users} premium`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Engagement Rate',
      value: `${stats.engagement_rate.toFixed(1)}%`,
      icon: TrendingUp,
      description: `${stats.total_reflections} reflections`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'New Signups (30d)',
      value: stats.new_signups_30d.toString(),
      icon: Crown,
      description: `${stats.total_prompts_sent} prompts sent`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-2">Overview of key metrics and recent activity</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <Card key={card.title} className="bg-white border border-gray-100 hover:shadow-sm transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-gray-600">{card.title}</p>
                  <p className="text-2xl font-semibold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.description}</p>
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* System Health Status */}
      {systemHealth && (
        <Card className="bg-white border border-gray-100">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Server className="h-6 w-6 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">System Health</h2>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                systemHealth.overall === 'operational'
                  ? 'bg-green-50 text-green-700 border border-green-100'
                  : systemHealth.overall === 'degraded'
                  ? 'bg-yellow-50 text-yellow-700 border border-yellow-100'
                  : 'bg-red-50 text-red-700 border border-red-100'
              }`}>
                {systemHealth.overall === 'operational' && 'All Systems Operational'}
                {systemHealth.overall === 'degraded' && 'Some Systems Degraded'}
                {systemHealth.overall === 'down' && 'System Issues Detected'}
              </div>
            </div>
            
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {systemHealth.systems && systemHealth.systems.map((system: any) => (
                <div key={system.name} className={`p-4 rounded-lg border ${
                  system.status === 'operational' 
                    ? 'bg-green-50 border-green-100' 
                    : system.status === 'degraded'
                    ? 'bg-yellow-50 border-yellow-100'
                    : 'bg-red-50 border-red-100'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium text-gray-900">{system.name}</p>
                    {system.status === 'operational' ? (
                      <CircleCheck className="h-5 w-5 text-green-600" />
                    ) : system.status === 'degraded' ? (
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                  <p className={`text-sm font-medium ${
                    system.status === 'operational'
                      ? 'text-green-700'
                      : system.status === 'degraded'
                      ? 'text-yellow-700'
                      : 'text-red-700'
                  }`}>
                    {system.status.charAt(0).toUpperCase() + system.status.slice(1)}
                  </p>
                  <div className="space-y-2 mt-3">
                    {system.responseTime !== undefined && system.responseTime > 0 && (
                      <p className="text-sm text-gray-600">
                        Response: {system.responseTime}ms
                      </p>
                    )}
                    {system.error && (
                      <p className="text-sm text-red-600 line-clamp-2" title={system.error}>
                        {system.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Last updated: {new Date(systemHealth.timestamp).toLocaleString()}
              </p>
              <p className="text-sm text-gray-600">
                {systemHealth.systems.length} systems monitored
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      <Card className="bg-white border border-gray-100">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <ActivityIcon className="h-6 w-6 text-blue-600" />
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
          </div>
          
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-gray-500 text-sm">No recent activity</p>
            ) : (
              activities.map((activity, index) => (
                <div
                  key={index}
                  className="flex items-start gap-4 pb-4 border-b border-gray-50 last:border-0 last:pb-0"
                >
                  <div className={`p-3 rounded-lg ${
                    activity.type === 'signup' ? 'bg-blue-50' : 'bg-green-50'
                  }`}>
                    {activity.type === 'signup' ? (
                      <Users className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Crown className="h-5 w-5 text-green-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'signup' ? 'New signup' : 'Subscription change'}
                    </p>
                    <p className="text-sm text-gray-600 truncate">
                      {activity.user_email}
                      {activity.type === 'subscription' && activity.details?.event_type && (
                        <span className="ml-2 text-xs">
                          ({activity.details.event_type})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="text-sm text-gray-500 whitespace-nowrap">
                    {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Card>

      {/* Quick Stats Row */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-white border border-gray-100 p-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">Conversion Rate</p>
            <p className="text-3xl font-semibold text-gray-900">
              {stats.total_users > 0 
                ? ((stats.premium_users / stats.total_users) * 100).toFixed(1)
                : 0}%
            </p>
            <p className="text-sm text-gray-500">
              Premium / Total Users
            </p>
          </div>
        </Card>
        
        <Card className="bg-white border border-gray-100 p-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">Average Prompts per User</p>
            <p className="text-3xl font-semibold text-gray-900">
              {stats.total_users > 0
                ? (stats.total_prompts_sent / stats.total_users).toFixed(1)
                : 0}
            </p>
            <p className="text-sm text-gray-500">
              Total prompts sent / Total users
            </p>
          </div>
        </Card>

        <Card className="bg-white border border-gray-100 p-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-gray-600">ARPU</p>
            <p className="text-3xl font-semibold text-gray-900">
              ${stats.total_users > 0
                ? (stats.mrr / stats.total_users).toFixed(2)
                : '0.00'}
            </p>
            <p className="text-sm text-gray-500">
              Average Revenue Per User
            </p>
          </div>
        </Card>
      </div>
    </div>
  )
}
