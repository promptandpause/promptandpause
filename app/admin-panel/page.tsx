'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Users, CreditCard, TrendingUp, Calendar, ArrowUpRight, MoreHorizontal } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, Server, CircleCheck } from 'lucide-react'
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

interface AdminUser {
  id: string
  email: string
  full_name: string
  subscription_status: string | null
  created_at?: string
  signup_date?: string
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [activities, setActivities] = useState<Activity[]>([])
  const [recentUsers, setRecentUsers] = useState<AdminUser[]>([])
  const [systemHealth, setSystemHealth] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const gbp = new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

  const loadDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const [statsResponse, activityResponse, usersResponse, healthResponse] = await Promise.all([
        fetch('/api/admin/dashboard/stats'),
        fetch('/api/admin/dashboard/activity?limit=10'),
        fetch('/api/admin/users?limit=5'),
        fetch('/api/health'),
      ])

      if (!statsResponse.ok) throw new Error('Failed to fetch stats')
      const statsData = await statsResponse.json()
      setStats(statsData.data)

      if (activityResponse.ok) {
        const activityData = await activityResponse.json()
        setActivities(activityData.data || [])
      }

      if (usersResponse.ok) {
        const usersData = await usersResponse.json()
        setRecentUsers(usersData.data || [])
      }

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
  }, [])

  useEffect(() => {
    loadDashboardData()
  }, [loadDashboardData])

  function initials(name: string, email: string): string {
    const source = name || email
    return source
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  }

  function joinedAt(user: AdminUser): string {
    const raw = user.created_at || user.signup_date
    if (!raw) return '—'
    return new Date(raw).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  if (loading && !stats) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-96 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28" />)}
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Skeleton className="lg:col-span-4 h-[350px]" />
          <Skeleton className="lg:col-span-3 h-[350px]" />
        </div>
        <Skeleton className="h-64" />
      </div>
    )
  }

  if (error && !stats) {
    return (
      <div className="p-8">
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  const conversionRate = stats && stats.total_users > 0
    ? ((stats.premium_users / stats.total_users) * 100).toFixed(1)
    : '0.0'
  const avgPrompts = stats && stats.total_users > 0
    ? (stats.total_prompts_sent / stats.total_users).toFixed(1)
    : '0'
  const arpu = stats && stats.total_users > 0 ? gbp.format(stats.mrr / stats.total_users) : gbp.format(0)

  const kpis = stats ? [
    { title: 'Total Users', value: stats.total_users.toLocaleString(), icon: Users, delta: `+${stats.new_signups_30d.toLocaleString()} this month`, up: true },
    { title: 'Total MRR', value: gbp.format(stats.mrr), icon: CreditCard, delta: `${stats.monthly_subs} monthly · ${stats.annual_subs} annual`, up: true },
    { title: 'Daily Prompts', value: stats.total_prompts_sent.toLocaleString(), icon: TrendingUp, delta: `${stats.total_reflections.toLocaleString()} reflections`, up: true },
    { title: 'Engagement Rate', value: `${stats.engagement_rate.toFixed(1)}%`, icon: Calendar, delta: `${stats.free_users.toLocaleString()} free · ${stats.premium_users.toLocaleString()} premium`, up: true },
  ] : []

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
          <p className="text-muted-foreground">Welcome back, here&apos;s what&apos;s happening with Prompt & Pause today.</p>
        </div>
        <Button variant="outline" onClick={loadDashboardData}>Refresh</Button>
      </div>

      {/* KPI Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} className="shadow-none border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground">
                  <span className={cn('text-emerald-500 font-medium inline-flex items-center', !kpi.up && 'text-rose-500')}>
                    {kpi.up ? <ArrowUpRight className="h-3 w-3 ml-0.5" /> : null}
                  </span> {kpi.delta}
                </p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* System Health */}
        <Card className="lg:col-span-4 shadow-none border">
          <CardHeader>
            <CardTitle>System Health</CardTitle>
            <CardDescription>Monitored services status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth?.systems?.length ? (
              <>
                <div className="flex items-center gap-2">
                  <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border',
                    systemHealth.overall === 'operational' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20' :
                    systemHealth.overall === 'degraded' ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' :
                    'bg-rose-500/10 text-rose-600 border-rose-500/20')}>
                    <span className={cn('h-1.5 w-1.5 rounded-full',
                      systemHealth.overall === 'operational' ? 'bg-emerald-500' :
                      systemHealth.overall === 'degraded' ? 'bg-amber-500' : 'bg-rose-500')} />
                    {systemHealth.overall === 'operational' ? 'All Systems Operational' :
                     systemHealth.overall === 'degraded' ? 'Some Systems Degraded' : 'System Issues Detected'}
                  </span>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {systemHealth.systems.slice(0, 6).map((system: any) => (
                    <div key={system.name} className={cn('flex items-start gap-3 p-3 rounded-lg border',
                      system.status === 'operational' ? 'bg-emerald-500/5 border-emerald-500/20' :
                      system.status === 'degraded' ? 'bg-amber-500/5 border-amber-500/20' :
                      'bg-rose-500/5 border-rose-500/20')}>
                      <div className="mt-0.5">
                        {system.status === 'operational'
                          ? <CircleCheck className="h-4 w-4 text-emerald-500" />
                          : <AlertCircle className="h-4 w-4 text-amber-500" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-none truncate">{system.name}</p>
                        <p className="text-xs text-muted-foreground mt-1 capitalize">{system.status}</p>
                        {system.responseTime > 0 && (
                          <p className="text-xs text-muted-foreground">{system.responseTime}ms</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Last updated: {new Date(systemHealth.timestamp).toLocaleString()}
                </p>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Health checks unavailable.</p>
            )}
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card className="lg:col-span-3 shadow-none border">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>System Activity</CardTitle>
              <CardDescription>Live events from the last 24 hours.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/admin-panel/activity">View All</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {activities.length === 0 ? (
              <p className="text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              <div className="space-y-6">
                {activities.slice(0, 6).map((item, index) => (
                  <div key={index} className="flex items-center">
                    <div className={cn(
                      'w-2 h-2 rounded-full mr-4 shrink-0',
                      item.type === 'subscription' ? 'bg-emerald-500' : 'bg-blue-500'
                    )} />
                    <div className="flex-1 space-y-1 min-w-0">
                      <p className="text-sm font-medium leading-none truncate">
                        {item.type === 'signup' ? 'New user registered' : 'Subscription updated'}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {item.user_email}
                        {item.type === 'subscription' && item.details?.event_type && (
                          <> ({item.details.event_type})</>
                        )}
                      </p>
                    </div>
                    <div className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Key ratios */}
      <div className="grid gap-4 md:grid-cols-3">
        {[
          { title: 'Conversion Rate', value: `${conversionRate}%`, desc: 'Premium / Total users' },
          { title: 'Avg Prompts / User', value: avgPrompts, desc: 'Total prompts / Total users' },
          { title: 'ARPU', value: arpu, desc: 'Average revenue per user' },
        ].map((m) => (
          <Card key={m.title} className="shadow-none border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">{m.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{m.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Registrations Table */}
      <Card className="shadow-none border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Registrations</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin-panel/users">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No registrations yet
                  </TableCell>
                </TableRow>
              ) : recentUsers.map((user) => (
                <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{initials(user.full_name, user.email)}</AvatarFallback>
                      </Avatar>
                      <span className="truncate max-w-[160px]">{user.full_name || 'User'}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.subscription_status && user.subscription_status !== 'free' ? 'default' : 'secondary'}>
                      {user.subscription_status === 'free' || !user.subscription_status ? 'Free' : user.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{joinedAt(user)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin-panel/users/${user.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
