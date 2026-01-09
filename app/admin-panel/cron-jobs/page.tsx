'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
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
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  failed: 'bg-red-50 text-red-700 border-red-200',
  running: 'bg-blue-50 text-blue-700 border-blue-200',
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
  const [error, setError] = useState<string | null>(null)
  const [triggering, setTriggering] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [jobFilter, setJobFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  const loadRuns = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
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
    } catch (error: any) {
      setError(error?.message || 'Failed to load cron job runs')
    } finally {
      setLoading(false)
    }
  }, [currentPage, jobFilter, limit, statusFilter])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadRuns()
  }, [loadRuns])

  async function loadStats() {
    try {
      setError(null)
      const response = await fetch('/api/admin/cron-jobs/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error: any) {
      setError(error?.message || 'Failed to load cron job stats')
    }
  }

  async function refreshData() {
    try {
      setRefreshing(true)
      setError(null)
      await Promise.all([loadStats(), loadRuns()])
      toast.success('Data refreshed')
    } catch (error: any) {
      setError(error?.message || 'Failed to refresh data')
      toast.error('Failed to refresh data')
    } finally {
      setRefreshing(false)
    }
  }

  const [triggerConfirmOpen, setTriggerConfirmOpen] = useState(false)
  const [jobToTrigger, setJobToTrigger] = useState<string | null>(null)

  async function triggerJob(jobName: string) {
    setJobToTrigger(jobName)
    setTriggerConfirmOpen(true)
  }

  async function confirmTrigger() {
    if (!jobToTrigger) return

    try {
      setTriggering(jobToTrigger)

      const response = await fetch('/api/admin/cron-jobs/trigger', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ job_name: jobToTrigger }),
      })

      const data = await response.json()

      if (response.ok) {
        const processed = data?.data?.stats?.totalProcessed || 0
        toast.success(`Job triggered successfully! Processed ${processed} users.`)
        setTimeout(() => {
          loadStats()
          loadRuns()
        }, 2000)
      } else {
        toast.error(data?.error || 'Failed to trigger cron job')
      }
    } catch (error) {
      toast.error('Failed to trigger cron job')
    } finally {
      setTriggering(null)
      setTriggerConfirmOpen(false)
      setJobToTrigger(null)
    }
  }

  function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-gray-50 text-gray-700 border-gray-200'
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-emerald-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'running':
        return <Activity className="h-4 w-4 text-blue-600 animate-spin" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  if (loading && !runs.length && !stats) {
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

  const statCards = stats ? [
    {
      title: 'Total Runs',
      value: stats.total_runs.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Successful',
      value: stats.successful_runs.toLocaleString(),
      icon: CheckCircle,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
    },
    {
      title: 'Failed',
      value: stats.failed_runs.toLocaleString(),
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: 'Success Rate',
      value: `${stats.success_rate.toFixed(1)}%`,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ] : []

  // Get unique job names from the runs list
  const uniqueJobs = Array.from(new Set(runs.map(r => r.job_name)))

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Cron Job Monitoring</h1>
          <p className="text-sm text-gray-500 mt-1">Track scheduled job executions</p>
        </div>
        <Button
          onClick={refreshData}
          disabled={refreshing}
          variant="outline"
          className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Available Jobs - Manual Trigger */}
      <div className="space-y-4">
        <h2 className="text-xl font-semibold text-gray-900">Available Jobs</h2>
        <div className="grid gap-4">
          {AVAILABLE_JOBS.map((job) => (
            <Card key={job.name} className="bg-white border border-gray-100">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">{job.icon}</div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{job.displayName}</h3>
                      <p className="text-sm text-gray-500 mt-1">{job.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        Job Name:{' '}
                        <code className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded">{job.name}</code>
                      </p>
                    </div>
                  </div>
                  <AlertDialog open={triggerConfirmOpen && jobToTrigger === job.name} onOpenChange={(open) => !open && setTriggerConfirmOpen(false)}>
                    <AlertDialogTrigger asChild>
                      <Button
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
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Trigger Cron Job</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          Are you sure you want to manually trigger "{job.displayName}"? This will send emails to eligible users.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white text-gray-900 border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmTrigger} className="bg-blue-600 hover:bg-blue-700">
                          Confirm
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
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
      )}

      <Card className="bg-white border border-gray-100 p-4">
        <div className="flex gap-4">
          <Select value={jobFilter} onValueChange={setJobFilter}>
            <SelectTrigger className="w-[200px] bg-white border-gray-200 text-gray-900">
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
            <SelectTrigger className="w-[180px] bg-white border-gray-200 text-gray-900">
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

      <Card className="bg-white border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-gray-500 font-medium">Job Name</th>
                <th className="text-left p-4 text-gray-500 font-medium">Status</th>
                <th className="text-left p-4 text-gray-500 font-medium">Started</th>
                <th className="text-left p-4 text-gray-500 font-medium">Duration</th>
                <th className="text-left p-4 text-gray-500 font-medium">Error</th>
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
                    <div className="flex flex-col items-center gap-3 text-gray-500">
                      <AlertCircle className="h-12 w-12 text-gray-300" />
                      <div>
                        <p className="font-medium">No cron job runs found</p>
                        <p className="text-sm mt-1">Trigger a job manually or wait for the scheduled run</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                runs.map((run) => (
                  <tr key={run.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-sm font-medium text-gray-900">{run.job_name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status)}
                        <Badge className={`${getStatusColor(run.status)} border capitalize`}>
                          {run.status}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {format(new Date(run.started_at), 'MMM dd, HH:mm:ss')}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {run.execution_time_ms ? `${run.execution_time_ms}ms` : '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {run.error_message ? (
                        <details className="cursor-pointer">
                          <summary className="text-red-700 hover:text-red-800">
                            View error
                          </summary>
                          <pre className="mt-2 text-xs bg-red-50 p-3 rounded-lg border border-red-200 overflow-x-auto max-w-md text-red-800">
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
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                variant="outline"
                size="sm"
                className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </Button>
              <Button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                variant="outline"
                size="sm"
                className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 disabled:opacity-50"
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
