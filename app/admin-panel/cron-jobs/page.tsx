'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Switch } from '@/components/ui/switch'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Clock,
  Play,
  FileText,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Power,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  formatSchedule,
  jobStatusLabel,
  isJobStatusFailure,
  type CronJob,
  type CronJobHistoryItem,
} from '@/lib/services/cronJobOrg'

export default function CronJobsPage() {
  const [jobs, setJobs] = useState<CronJob[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [runTarget, setRunTarget] = useState<CronJob | null>(null)
  const [running, setRunning] = useState(false)

  const [historyTarget, setHistoryTarget] = useState<CronJob | null>(null)
  const [history, setHistory] = useState<CronJobHistoryItem[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const loadJobs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/cron-jobs')
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch cron jobs')
      }
      const data = await response.json()
      setJobs(data.jobs || [])
    } catch (err: any) {
      setError(err?.message || 'Failed to load cron jobs')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadJobs()
  }, [loadJobs])

  async function refreshData() {
    try {
      setRefreshing(true)
      await loadJobs()
      toast.success('Cron jobs refreshed')
    } catch {
      toast.error('Failed to refresh cron jobs')
    } finally {
      setRefreshing(false)
    }
  }

  async function confirmRun() {
    if (!runTarget) return
    try {
      setRunning(true)
      const response = await fetch(`/api/admin/cron-jobs/${runTarget.jobId}/run`, {
        method: 'POST',
      })
      const data = await response.json()
      if (response.ok && data.success) {
        toast.success(`Ran "${title(runTarget)}" — HTTP ${data.httpStatus} in ${data.duration}ms`)
      } else {
        toast.error(data?.error || data?.statusText || 'Job run failed')
      }
    } catch {
      toast.error('Failed to run job')
    } finally {
      setRunning(false)
      setRunTarget(null)
    }
  }

  async function toggleJob(job: CronJob, enabled: boolean) {
    const previous = job.enabled
    setJobs(prev => prev.map(j => (j.jobId === job.jobId ? { ...j, enabled } : j)))
    try {
      const response = await fetch(`/api/admin/cron-jobs/${job.jobId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled }),
      })
      const data = await response.json()
      if (!response.ok) {
        throw new Error(data?.error || 'Failed to update job')
      }
      toast.success(`"${title(job)}" ${enabled ? 'enabled' : 'paused'}`)
    } catch (err: any) {
      setJobs(prev => prev.map(j => (j.jobId === job.jobId ? { ...j, enabled: previous } : j)))
      toast.error(err?.message || 'Failed to update job')
    }
  }

  async function openHistory(job: CronJob) {
    setHistoryTarget(job)
    setHistoryLoading(true)
    setHistory([])
    try {
      const response = await fetch(`/api/admin/cron-jobs/${job.jobId}/history`)
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Failed to load history')
      setHistory(data.history || [])
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load history')
    } finally {
      setHistoryLoading(false)
    }
  }

  function title(job: CronJob): string {
    return job.title || job.url.replace(/^https?:\/\//, '').replace(/\/$/, '')
  }

  function statusLabel(job: CronJob): { label: string; variant: 'default' | 'secondary' | 'destructive' } {
    if (!job.enabled) return { label: 'Paused', variant: 'secondary' }
    if (job.lastStatus > 0 && isJobStatusFailure(job.lastStatus)) {
      return { label: 'Failed', variant: 'destructive' }
    }
    return { label: 'Active', variant: 'default' }
  }

  function relativeTime(unixSeconds: number): string {
    if (!unixSeconds) return 'Never'
    const diff = Math.floor(Date.now() / 1000) - unixSeconds
    if (diff < 60) return 'just now'
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
    return `${Math.floor(diff / 86400)}d ago`
  }

  function formatHistoryTime(unixSeconds: number): string {
    return new Date(unixSeconds * 1000).toLocaleString()
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </div>
        <div className="grid gap-4">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="h-[72px]" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cron Jobs</h1>
          <p className="text-muted-foreground">Monitor and trigger system scheduled tasks.</p>
        </div>
        <Button variant="outline" onClick={refreshData} disabled={refreshing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Status
        </Button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Unable to load cron jobs</p>
            <p className="text-muted-foreground mt-1">{error}</p>
            {error.includes('CRONJOB_ORG_API_KEY') && (
              <p className="text-muted-foreground mt-1">
                Add the <code className="bg-muted px-1 rounded">CRONJOB_ORG_API_KEY</code> environment
                variable to Vercel, then redeploy.
              </p>
            )}
          </div>
        </div>
      )}

      {!error && (
        <div className="grid gap-4">
          {jobs.length === 0 ? (
            <Card className="shadow-none border border-dashed bg-muted/20">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Clock className="h-10 w-10 text-muted-foreground" />
                <p className="font-medium mt-4 text-muted-foreground">No cron jobs found</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Create jobs in the cron-job.org console to see them here.
                </p>
              </CardContent>
            </Card>
          ) : (
            jobs.map((job) => {
              const status = statusLabel(job)
              return (
                <Card key={job.jobId} className="shadow-none border">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div className="p-2 bg-muted rounded-md shrink-0">
                        <Clock size={20} className="text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{title(job)}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          <code className="bg-muted px-1 rounded">{formatSchedule(job.schedule)}</code>
                          <span>•</span>
                          <span>Last run: {relativeTime(job.lastExecution)}</span>
                          {job.lastDuration > 0 && (
                            <>
                              <span>•</span>
                              <span>{job.lastDuration}ms</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 shrink-0">
                      <Badge variant={status.variant}>{status.label}</Badge>
                      <div className="flex items-center gap-1" title={job.enabled ? 'Pause job' : 'Enable job'}>
                        <Power size={14} className="text-muted-foreground" />
                        <Switch
                          checked={job.enabled}
                          onCheckedChange={(checked) => toggleJob(job, checked)}
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={`Run ${title(job)} now`}
                        onClick={() => setRunTarget(job)}
                      >
                        <Play size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        title={`View history for ${title(job)}`}
                        onClick={() => openHistory(job)}
                      >
                        <FileText size={16} />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          )}
        </div>
      )}

      {/* Run now confirmation */}
      <AlertDialog open={!!runTarget} onOpenChange={(open) => !open && setRunTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run "{runTarget ? title(runTarget) : ''}" now?</AlertDialogTitle>
            <AlertDialogDescription>
              This will fire a single request to the job URL immediately. It will not be recorded in
              cron-job.org history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRun} disabled={running}>
              {running && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Run Now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* History dialog */}
      <Dialog open={!!historyTarget} onOpenChange={(open) => !open && setHistoryTarget(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Execution History</DialogTitle>
            <DialogDescription>
              Recent runs for "{historyTarget ? title(historyTarget) : ''}"
            </DialogDescription>
          </DialogHeader>

          {historyLoading ? (
            <div className="space-y-2 py-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
              <FileText className="h-8 w-8" />
              <p className="text-sm mt-2">No executions recorded yet.</p>
            </div>
          ) : (
            <div className="max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Executed</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>HTTP</TableHead>
                    <TableHead>Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((item) => (
                    <TableRow key={item.identifier}>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatHistoryTime(item.date)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {item.status === 1 ? (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                          ) : item.status === 0 ? (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <XCircle className="h-4 w-4 text-destructive" />
                          )}
                          <span className={item.status === 1 ? 'text-emerald-600' : item.status === 0 ? 'text-muted-foreground' : 'text-destructive'}>
                            {item.statusText || jobStatusLabel(item.status)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">{item.httpStatus ?? '-'}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.duration}ms</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter className="sm:justify-end">
            <Button variant="outline" onClick={() => setHistoryTarget(null)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
