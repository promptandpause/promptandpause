'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Mail, 
  Search, 
  CheckCircle, 
  XCircle, 
  Clock,
  AlertCircle,
  Eye,
  TrendingUp,
  Send
} from 'lucide-react'
import { format } from 'date-fns'

interface EmailLog {
  id: string
  recipient_email: string
  subject: string
  status: 'sent' | 'delivered' | 'bounced' | 'opened'
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
  const [searchEmail, setSearchEmail] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [templateFilter, setTemplateFilter] = useState<string>('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchData()
  }, [page, statusFilter, templateFilter])

  const fetchData = async () => {
    setLoading(true)
    try {
      // Fetch stats
      const statsRes = await fetch('/api/admin/emails/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      // Fetch templates
      const templatesRes = await fetch('/api/admin/emails/templates')
      if (templatesRes.ok) {
        const templatesData = await templatesRes.json()
        setTemplates(templatesData.templates)
      }

      // Fetch logs
      const params = new URLSearchParams({
        page: page.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(templateFilter && { template_id: templateFilter }),
        ...(searchEmail && { recipient_email: searchEmail }),
      })

      const logsRes = await fetch(`/api/admin/emails?${params}`)
      if (logsRes.ok) {
        const logsData = await logsRes.json()
        setLogs(logsData.logs)
        setTotalPages(logsData.totalPages)
      }
    } catch (error) {
      console.error('Error fetching email data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      sent: { color: 'bg-blue-500/10 text-blue-400 border-blue-400/30', icon: Send },
      delivered: { color: 'bg-green-500/10 text-green-400 border-green-400/30', icon: CheckCircle },
      bounced: { color: 'bg-red-500/10 text-red-400 border-red-400/30', icon: XCircle },
      opened: { color: 'bg-purple-500/10 text-purple-400 border-purple-400/30', icon: Eye },
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
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading email tracking...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Email Tracking</h1>
        <p className="text-slate-400">Monitor email delivery and engagement</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{stats?.total_sent || 0}</div>
              <Mail className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-400">
                {stats?.delivery_rate?.toFixed(1) || 0}%
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.total_delivered || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-400">
                {stats?.open_rate?.toFixed(1) || 0}%
              </div>
              <Eye className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.total_opened || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-400">
                {stats?.bounce_rate?.toFixed(1) || 0}%
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              {stats?.total_bounced || 0} bounced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Email Logs</CardTitle>
          <CardDescription className="text-slate-400">
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
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="delivered">Delivered</option>
              <option value="bounced">Bounced</option>
              <option value="opened">Opened</option>
            </select>

            <select
              value={templateFilter}
              onChange={(e) => {
                setTemplateFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Templates</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Logs Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Recipient</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Sent At</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Opened At</th>
                </tr>
              </thead>
              <tbody>
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-8 text-slate-400">
                      No email logs found
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4 text-sm text-white">{log.recipient_email}</td>
                      <td className="py-3 px-4 text-sm text-slate-300">
                        {log.subject}
                        {log.email_templates && (
                          <div className="text-xs text-slate-500 mt-1">
                            {log.email_templates.name}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(log.status)}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-400">
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
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
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
