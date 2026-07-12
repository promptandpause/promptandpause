'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Flag,
  AlertTriangle,
  CheckCircle2,
  Trash2,
  ChevronDown,
  ChevronUp,
  ShieldAlert,
} from 'lucide-react'
import { format } from 'date-fns'

interface Report {
  id: string
  reporter_id: string
  target_type: 'reflection' | 'comment' | 'user'
  target_id: string
  reason: string
  details: string | null
  status: 'pending' | 'reviewed' | 'dismissed' | 'actioned'
  created_at: string
  reporter?: { email: string; full_name: string; username: string } | null
  target: any
  target_deleted: boolean
  target_author?: { email: string; full_name: string; username: string } | null
}

interface ReportStats {
  total: number
  pending: number
  self_harm_pending: number
  actioned: number
}

const REASON_LABELS: Record<string, string> = {
  spam: 'Spam',
  harassment: 'Harassment or bullying',
  self_harm: 'Self-harm or suicide content',
  hate_speech: 'Hate speech',
  inappropriate: 'Inappropriate content',
  other: 'Other',
}

export default function ContentReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [stats, setStats] = useState<ReportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState('pending')
  const [reasonFilter, setReasonFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [actingOnId, setActingOnId] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(reasonFilter && { reason: reasonFilter }),
      })

      const res = await fetch(`/api/admin/reports?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch reports')
      }

      const data = await res.json()
      setReports(data.reports)
      setStats(data.stats)
      setTotalPages(data.totalPages)
    } catch (err: any) {
      setReports([])
      setError(err?.message || 'Failed to fetch reports')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, reasonFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  async function updateStatus(reportId: string, status: string) {
    setActingOnId(reportId)
    try {
      const res = await fetch(`/api/admin/reports/${reportId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        await fetchData()
      }
    } finally {
      setActingOnId(null)
    }
  }

  async function removeContent(report: Report) {
    if (report.target_type === 'user') return
    if (!confirm(`Permanently delete this ${report.target_type}? This can't be undone.`)) return

    setActingOnId(report.id)
    try {
      const res = await fetch(`/api/admin/reports/${report.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'remove_content',
          target_type: report.target_type,
          target_id: report.target_id,
        }),
      })
      if (res.ok) {
        await fetchData()
      }
    } finally {
      setActingOnId(null)
    }
  }

  function getStatusBadge(status: string) {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-amber-50 text-amber-700 border-amber-200', icon: AlertTriangle },
      reviewed: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: CheckCircle2 },
      dismissed: { color: 'bg-neutral-50 text-neutral-700 border-neutral-200', icon: CheckCircle2 },
      actioned: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
    }
    const variant = variants[status] || variants.pending
    const Icon = variant.icon
    return (
      <Badge className={`${variant.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    )
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Content Reports</h1>
        <p className="text-sm text-neutral-500">Review reported reflections, comments, and users</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {stats && stats.self_harm_pending > 0 && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 flex items-center gap-2 font-medium">
          <ShieldAlert className="h-4 w-4 shrink-0" />
          {stats.self_harm_pending} pending self-harm {stats.self_harm_pending === 1 ? 'report needs' : 'reports need'} review — these are sorted to the top of the queue below.
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Total Reports</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-neutral-900">{stats?.total || 0}</div>
              <Flag className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-amber-700">{stats?.pending || 0}</div>
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Self-Harm (Pending)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-red-700">{stats?.self_harm_pending || 0}</div>
              <ShieldAlert className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-neutral-500">Actioned</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-emerald-700">{stats?.actioned || 0}</div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-neutral-200">
        <CardHeader>
          <CardTitle className="text-neutral-900">Reports</CardTitle>
          <CardDescription className="text-neutral-500">
            Click a report to see the reported content in full
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-md text-neutral-900 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="dismissed">Dismissed</option>
              <option value="actioned">Actioned</option>
            </select>

            <select
              value={reasonFilter}
              onChange={(e) => { setReasonFilter(e.target.value); setPage(1) }}
              className="px-3 py-2 bg-white border border-neutral-200 rounded-md text-neutral-900 text-sm"
            >
              <option value="">All Reasons</option>
              {Object.entries(REASON_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {reports.length === 0 ? (
              <div className="text-center py-8 text-neutral-500 text-sm">No reports found</div>
            ) : (
              reports.map((report) => {
                const isExpanded = expandedId === report.id
                const isSelfHarm = report.reason === 'self_harm'
                return (
                  <div
                    key={report.id}
                    className={`rounded-lg border overflow-hidden ${
                      isSelfHarm && report.status === 'pending'
                        ? 'border-red-300 bg-red-50/50'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : report.id)}
                      className="w-full flex items-center justify-between gap-4 px-4 py-3 text-left hover:bg-neutral-50"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isSelfHarm && <ShieldAlert className="h-4 w-4 text-red-600 shrink-0" />}
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-neutral-900 truncate">
                            {REASON_LABELS[report.reason] || report.reason} · {report.target_type}
                            {report.target_deleted && <span className="text-neutral-400 font-normal"> (content deleted)</span>}
                          </div>
                          <div className="text-xs text-neutral-500 truncate">
                            Reported by {report.reporter?.full_name || report.reporter?.email || 'Unknown'} ·{' '}
                            {format(new Date(report.created_at), 'MMM dd, yyyy')}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {getStatusBadge(report.status)}
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-neutral-400" /> : <ChevronDown className="h-4 w-4 text-neutral-400" />}
                      </div>
                    </button>

                    {isExpanded && (
                      <div className="px-4 pb-4 border-t border-neutral-100 pt-3 space-y-3">
                        {report.details && (
                          <div>
                            <div className="text-xs font-medium text-neutral-500 mb-1">Reporter's details</div>
                            <div className="text-sm text-neutral-800">{report.details}</div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs font-medium text-neutral-500 mb-1">
                            Reported {report.target_type}
                            {report.target_author && (
                              <> by {report.target_author.full_name || report.target_author.email}</>
                            )}
                          </div>
                          {report.target_deleted ? (
                            <div className="text-sm text-neutral-400 italic">
                              This content no longer exists (already deleted).
                            </div>
                          ) : report.target_type === 'user' ? (
                            <div className="text-sm text-neutral-800">
                              {report.target?.full_name || report.target?.username} ({report.target?.email})
                            </div>
                          ) : (
                            <div className="text-sm text-neutral-800 bg-neutral-50 rounded-md p-3 border border-neutral-200 whitespace-pre-wrap">
                              {report.target?.text}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 pt-1">
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingOnId === report.id}
                            onClick={() => updateStatus(report.id, 'dismissed')}
                            className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          >
                            Dismiss
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={actingOnId === report.id}
                            onClick={() => updateStatus(report.id, 'reviewed')}
                            className="bg-white border-neutral-200 text-neutral-700 hover:bg-neutral-50"
                          >
                            Mark Reviewed
                          </Button>
                          {!report.target_deleted && report.target_type !== 'user' && (
                            <Button
                              size="sm"
                              variant="outline"
                              disabled={actingOnId === report.id}
                              onClick={() => removeContent(report)}
                              className="bg-white border-red-200 text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Remove Content
                            </Button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-neutral-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-white border-neutral-200 text-neutral-900 hover:bg-neutral-50"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
