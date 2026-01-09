'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  Mail, 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Eye,
  Send
} from 'lucide-react'
import { format } from 'date-fns'

interface EmailLog {
  id: string
  recipient_email: string
  subject: string
  status: 'sent' | 'delivered' | 'bounced' | 'opened' | 'clicked' | 'failed' | 'delivery_delayed'
  sent_at: string
  delivered_at: string | null
  opened_at: string | null
  bounce_reason: string | null
  email_templates?: {
    name: string
    subject: string
  }
}

interface EmailStats {
  total_sent: number
  total_delivered: number
  total_bounced: number
  total_opened: number
  delivery_rate: number
  open_rate: number
  bounce_rate: number
}

export default function EmailTrackingPage() {
  const [logs, setLogs] = useState<EmailLog[]>([])
  const [stats, setStats] = useState<EmailStats | null>(null)
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchEmail, setSearchEmail] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [templateFilter, setTemplateFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const searchEmailRef = useRef(searchEmail)
  searchEmailRef.current = searchEmail

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      setError(null)
      // Fetch stats
      const statsRes = await fetch('/api/admin/emails/stats')
      if (!statsRes.ok) throw new Error('Failed to fetch email stats')
      const statsData = await statsRes.json()
      setStats(statsData.stats)

      // Fetch templates
      const templatesRes = await fetch('/api/admin/emails/templates')
      if (!templatesRes.ok) throw new Error('Failed to fetch email templates')
      const templatesData = await templatesRes.json()
      setTemplates(templatesData.templates)

      // Fetch logs
      const params = new URLSearchParams({
        page: page.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(templateFilter && { template_name: templateFilter }),
        ...(searchEmailRef.current && { recipient_email: searchEmailRef.current }),
      })

      const logsRes = await fetch(`/api/admin/emails?${params}`)
      if (!logsRes.ok) throw new Error('Failed to fetch email logs')
      const logsData = await logsRes.json()
      setLogs(logsData.logs)
      setTotalPages(logsData.totalPages)
    } catch (error: any) {
      setError(error?.message || 'Failed to load email tracking')
    } finally {
      setLoading(false)
    }
  }, [page, statusFilter, templateFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      sent: { color: 'bg-blue-50 text-blue-700 border-blue-200', icon: Send },
      delivered: { color: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle },
      bounced: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
      opened: { color: 'bg-purple-50 text-purple-700 border-purple-200', icon: Eye },
      clicked: { color: 'bg-indigo-50 text-indigo-700 border-indigo-200', icon: Eye },
      failed: { color: 'bg-red-50 text-red-700 border-red-200', icon: XCircle },
      delivery_delayed: { color: 'bg-yellow-50 text-yellow-700 border-yellow-200', icon: AlertCircle },
    }
    const variant = variants[status] || variants.sent
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
      <div className="space-y-6">
        <Skeleton className="h-8 w-56 bg-gray-200" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28 bg-gray-200" />
          ))}
        </div>
        <Skeleton className="h-96 bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900 mb-1">Email Tracking</h1>
        <p className="text-sm text-gray-500">Monitor email delivery and engagement</p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-white border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-gray-900">{stats?.total_sent || 0}</div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-emerald-700">
                {stats?.delivery_rate?.toFixed(1) || 0}%
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.total_delivered || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-purple-700">
                {stats?.open_rate?.toFixed(1) || 0}%
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.total_opened || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white border border-gray-100">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-gray-500">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-semibold text-red-700">
                {stats?.bounce_rate?.toFixed(1) || 0}%
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {stats?.total_bounced || 0} bounced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-white border border-gray-100">
        <CardHeader>
          <CardTitle className="text-gray-900">Email Logs</CardTitle>
          <CardDescription className="text-gray-500">
            View and filter email delivery logs
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search by recipient email..."
                value={searchEmail}
                onChange={(e) => setSearchEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-white border-gray-200 text-gray-900"
              />
              <Button onClick={handleSearch} className="bg-neutral-900 hover:bg-neutral-800">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-sm"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="bounced">Bounced</option>
              <option value="opened">Opened</option>
              <option value="clicked">Clicked</option>
              <option value="delivery_delayed">Delivery Delayed</option>
              <option value="failed">Failed</option>
            </select>

            <select
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-white border border-gray-200 rounded-md text-gray-900 text-sm"
            >
              <option value="">All Templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.template_key || template.template_name || template.name}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Recipient</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Sent At</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-500">Opened At</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-gray-500">
                      {loading ? 'Loading email logs...' : 'No email logs found'}
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm text-gray-900">{log.recipient_email}</td>
                      <td className="py-3 px-4 text-sm text-gray-700">
                        {log.subject}
                        {log.email_templates && (
                          <div className="text-xs text-gray-500 mt-1">
                            {log.email_templates.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-500">
                        {log.opened_at 
                          ? format(new Date(log.opened_at), 'MMM dd, yyyy HH:mm')
                          : '-'
                        }
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-gray-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-white border-gray-200 text-gray-900 hover:bg-gray-50"
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
