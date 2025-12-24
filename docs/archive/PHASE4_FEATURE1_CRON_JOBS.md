# Feature 1: Cron Job Monitoring - Complete Implementation

## Overview
Monitor cron job executions with success/failure tracking and execution logs.

---

## Files to Create

### 1. Admin Service Functions

Add to `lib/services/adminService.ts`:

```typescript
// ============================================================================
// CRON JOB MONITORING
// ============================================================================

/**
 * Get all cron job runs with filtering
 */
export async function getCronJobRuns(params: {
  limit?: number
  offset?: number
  job_name?: string
  status?: string
  start_date?: string
  end_date?: string
}) {
  try {
    const supabase = createServiceRoleClient()
    const { 
      limit = 50, 
      offset = 0, 
      job_name,
      status,
      start_date,
      end_date
    } = params

    let query = supabase
      .from('cron_job_runs')
      .select('*', { count: 'exact' })
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (job_name) {
      query = query.eq('job_name', job_name)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (start_date) {
      query = query.gte('started_at', start_date)
    }

    if (end_date) {
      query = query.lte('started_at', end_date)
    }

    const { data, error, count } = await query

    if (error) throw error

    return {
      runs: data || [],
      total: count || 0,
      success: true,
    }
  } catch (error: any) {
    console.error('Error fetching cron job runs:', error)
    return {
      runs: [],
      total: 0,
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get cron job statistics
 */
export async function getCronJobStats() {
  try {
    const supabase = createServiceRoleClient()

    // Get all runs
    const { data: runs } = await supabase
      .from('cron_job_runs')
      .select('job_name, status, execution_time_ms, started_at')

    if (!runs) {
      return {
        stats: {
          total_runs: 0,
          successful_runs: 0,
          failed_runs: 0,
          success_rate: 0,
          avg_execution_time: 0,
          jobs: [],
        },
        success: true,
      }
    }

    const total_runs = runs.length
    const successful_runs = runs.filter(r => r.status === 'success').length
    const failed_runs = runs.filter(r => r.status === 'failed').length
    const success_rate = total_runs > 0 ? (successful_runs / total_runs) * 100 : 0

    // Calculate average execution time
    const completedRuns = runs.filter(r => r.execution_time_ms !== null)
    const avg_execution_time = completedRuns.length > 0
      ? completedRuns.reduce((sum, r) => sum + (r.execution_time_ms || 0), 0) / completedRuns.length
      : 0

    // Group by job name
    const jobGroups = runs.reduce((acc: any, run) => {
      if (!acc[run.job_name]) {
        acc[run.job_name] = {
          name: run.job_name,
          total: 0,
          successful: 0,
          failed: 0,
          last_run: run.started_at,
        }
      }
      acc[run.job_name].total++
      if (run.status === 'success') acc[run.job_name].successful++
      if (run.status === 'failed') acc[run.job_name].failed++
      if (new Date(run.started_at) > new Date(acc[run.job_name].last_run)) {
        acc[run.job_name].last_run = run.started_at
      }
      return acc
    }, {})

    const jobs = Object.values(jobGroups)

    return {
      stats: {
        total_runs,
        successful_runs,
        failed_runs,
        success_rate: Math.round(success_rate * 100) / 100,
        avg_execution_time: Math.round(avg_execution_time),
        jobs,
      },
      success: true,
    }
  } catch (error: any) {
    console.error('Error fetching cron job stats:', error)
    return {
      stats: null,
      success: false,
      error: error.message,
    }
  }
}
```

---

## API Routes

### `/api/admin/cron-jobs/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { checkAdminAuth, getCronJobRuns } from '@/lib/services/adminService'

export async function GET(request: NextRequest) {
  try {
    const authCheck = await checkAdminAuth()
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const job_name = searchParams.get('job_name') || undefined
    const status = searchParams.get('status') || undefined
    const start_date = searchParams.get('start_date') || undefined
    const end_date = searchParams.get('end_date') || undefined

    const result = await getCronJobRuns({
      limit,
      offset,
      job_name,
      status,
      start_date,
      end_date,
    })

    return NextResponse.json({
      success: true,
      runs: result.runs,
      total: result.total,
    })
  } catch (error) {
    console.error('Error fetching cron jobs:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron jobs' },
      { status: 500 }
    )
  }
}
```

### `/api/admin/cron-jobs/stats/route.ts`

```typescript
import { NextResponse } from 'next/server'
import { checkAdminAuth, getCronJobStats } from '@/lib/services/adminService'

export async function GET() {
  try {
    const authCheck = await checkAdminAuth()
    if (!authCheck.isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 403 }
      )
    }

    const result = await getCronJobStats()

    if (!result.success) {
      throw new Error(result.error || 'Failed to fetch stats')
    }

    return NextResponse.json({
      success: true,
      stats: result.stats,
    })
  } catch (error) {
    console.error('Error fetching cron job stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch cron job stats' },
      { status: 500 }
    )
  }
}
```

---

## Page Component

### `/app/admin-panel/cron-jobs/page.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, CheckCircle, XCircle, Activity, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

interface CronJobRun {
  id: string
  job_name: string
  status: string
  started_at: string
  completed_at: string | null
  execution_time_ms: number | null
  error_message: string | null
  logs: any
}

interface CronJobStats {
  total_runs: number
  successful_runs: number
  failed_runs: number
  success_rate: number
  avg_execution_time: number
  jobs: Array<{
    name: string
    total: number
    successful: number
    failed: number
    last_run: string
  }>
}

const STATUS_COLORS: Record<string, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-400/30',
  failed: 'bg-red-500/10 text-red-400 border-red-400/30',
  running: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
}

export default function CronJobsPage() {
  const [runs, setRuns] = useState<CronJobRun[]>([])
  const [stats, setStats] = useState<CronJobStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [jobFilter, setJobFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadRuns()
  }, [currentPage, jobFilter, statusFilter])

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/cron-jobs/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function loadRuns() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      })

      if (jobFilter !== 'all') {
        params.append('job_name', jobFilter)
      }

      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }

      const response = await fetch(`/api/admin/cron-jobs?${params}`)
      if (!response.ok) throw new Error('Failed to fetch runs')

      const data = await response.json()
      setRuns(data.runs)
      setTotalPages(Math.ceil(data.total / limit))
    } catch (error) {
      console.error('Error loading runs:', error)
    } finally {
      setLoading(false)
    }
  }

  function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-slate-500/10 text-slate-400 border-slate-400/30'
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />
      case 'failed':
        return <XCircle className="h-4 w-4" />
      case 'running':
        return <Activity className="h-4 w-4 animate-spin" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading && !runs.length && !stats) {
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

  const statCards = stats ? [
    {
      title: 'Total Runs',
      value: stats.total_runs.toLocaleString(),
      icon: Activity,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Successful',
      value: stats.successful_runs.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Failed',
      value: stats.failed_runs.toLocaleString(),
      icon: XCircle,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
    {
      title: 'Success Rate',
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ] : []

  const uniqueJobs = stats?.jobs.map(j => j.name) || []

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Cron Job Monitoring</h1>
        <p className="text-slate-400 mt-1">Track scheduled job executions</p>
      </div>

      {stats && (
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
      )}

      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex gap-4">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Jobs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Jobs</SelectItem>
              {uniqueJobs.map(job => (
                <SelectItem key={job} value={job}>{job}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="success">Success</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
              <SelectItem value="running">Running</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-medium">Job Name</th>
                <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                <th className="text-left p-4 text-slate-400 font-medium">Started</th>
                <th className="text-left p-4 text-slate-400 font-medium">Duration</th>
                <th className="text-left p-4 text-slate-400 font-medium">Error</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : runs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No cron job runs found
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-slate-700/50 hover:bg-slate-900/50">
                    <td className="p-4 text-sm font-medium text-white">{run.job_name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <Badge className={`${getStatusColor(run.status)} border capitalize`}>
                          {run.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {format(new Date(run.started_at), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {run.execution_time_ms ? `${run.execution_time_ms}ms` : '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {run.error_message ? (
                        <details className="cursor-pointer">
                          <summary className="text-red-400 hover:text-red-300">
                            View error
                          </summary>
                          <pre className="mt-2 text-xs bg-slate-950 p-2 rounded border border-slate-700 overflow-x-auto max-w-md">
                            {run.error_message}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-slate-700 text-white hover:bg-slate-800 disabled:opacity-50"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
```

---

## Summary

**Feature 1 Complete!**

Files to create:
1. Add functions to `lib/services/adminService.ts`
2. Create `app/api/admin/cron-jobs/route.ts`
3. Create `app/api/admin/cron-jobs/stats/route.ts`
4. Create `app/admin-panel/cron-jobs/page.tsx`

**Next**: Feature 2 - System Settings
