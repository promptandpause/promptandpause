'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Clock, CheckCircle, XCircle, Activity, TrendingUp, Play, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'

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

const AVAILABLE_JOBS = [
  {
    name: 'send-daily-prompts',
    displayName: 'Daily Prompt Emails',
    description: 'Send daily reflection prompts to users',
    icon: '📧'
  },
  {
    name: 'regenerate-weekly-insights',
    displayName: 'Weekly Insights Generation',
    description: 'Regenerate AI-powered weekly insights for users',
    icon: '🔄'
  }
]

export default function CronJobsPage() {
  const [runs, setRuns] = useState<CronJobRun[]>([])
  const [stats, setStats] = useState<CronJobStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
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

  async function refreshData() {
    setRefreshing(true)
    await Promise.all([loadStats(), loadRuns()])
    setRefreshing(false)
    toast.success('Data refreshed')
  }

  async function triggerJob(jobName: string) {
    if (!confirm(`Are you sure you want to manually trigger "${jobName}"?\n\nThis will send emails to eligible users.`)) {
      return
    }

    try {
      setTriggering(jobName)
      
      const response = await fetch(`/api/cron/${jobName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      const data = await response.json()

      if (response.ok) {
        toast.success(`Job triggered successfully! Processed ${data.stats?.totalProcessed || 0} users.`)
        // Reload data after a short delay
        setTimeout(() => {
          loadStats()
          loadRuns()
        }, 2000)
      } else {
        toast.error(data.error || 'Failed to trigger cron job')
      }
    } catch (error) {
      console.error('Error triggering cron job:', error)
      toast.error('Failed to trigger cron job')
    } finally {
      setTriggering(null)
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

  // Get unique job names from the runs list
  const uniqueJobs = Array.from(new Set(runs.map(r => r.job_name)))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Cron Job Monitoring</h1>
          <p className="text-slate-400 mt-1">Track scheduled job executions</p>
        </div>
        <Button
          onClick={refreshData}
          disabled={refreshing}
          variant="outline"
          className="border-slate-700 text-white hover:bg-slate-800"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Available Jobs - Manual Trigger */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Available Jobs</h2>
        <div className="grid gap-4">
          {AVAILABLE_JOBS.map((job) => (
            <Card key={job.name} className="bg-slate-800/50 border-slate-700">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{job.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">{job.displayName}</h3>
                      <p className="text-sm text-slate-400 mt-1">{job.description}</p>
                      <p className="text-xs text-slate-500 mt-2">
                        Job Name: <code className="bg-slate-900 px-2 py-0.5 rounded">{job.name}</code>
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => triggerJob(job.name)}
                    disabled={triggering === job.name}
                    className="bg-blue-500 hover:bg-blue-600 text-white min-w-[140px]"
                  >
                    {triggering === job.name ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Running...
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
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
                  <td colSpan={5} className="p-8 text-center">
                    <div className="flex flex-col items-center gap-3 text-slate-400">
                      <AlertCircle className="h-12 w-12 text-slate-600" />
                      <div>
                        <p className="font-medium">No cron job runs found</p>
                        <p className="text-sm mt-1">Trigger a job manually or wait for the scheduled run</p>
                      </div>
                    </div>
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
