'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
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
      sent: { color: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Send },
      delivered: { color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle },
      bounced: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
      opened: { color: 'bg-purple-500/10 text-purple-600 border-purple-500/20', icon: Eye },
      clicked: { color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Eye },
      failed: { color: 'bg-red-500/10 text-red-600 border-red-500/20', icon: XCircle },
      delivery_delayed: { color: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20', icon: AlertCircle },
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
      <div className="space-y-8">
        <Skeleton className="h-8 w-56" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Tracking</h1>
        <p className="text-muted-foreground">Monitor email delivery and engagement</p>
      </div>

      {error && (
        <Card className="p-4 border-destructive/40 bg-destructive/10">
          <p className="text-sm text-destructive">{error}</p>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Sent</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-foreground">{stats?.total_sent || 0}</div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Delivery Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-emerald-600">
                {stats?.delivery_rate?.toFixed(1) || 0}%
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_delivered || 0} delivered
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-purple-600">
                {stats?.open_rate?.toFixed(1) || 0}%
              </div>
              <Eye className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_opened || 0} opened
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bounce Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-red-600">
                {stats?.bounce_rate?.toFixed(1) || 0}%
              </div>
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {stats?.total_bounced || 0} bounced
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle>Email Logs</CardTitle>
          <CardDescription>
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
              />
              <Button onClick={handleSearch} size="icon">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value)
                setPage(1)
              }}
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
              className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Recipient</TableHead>
                <TableHead>Subject</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Sent At</TableHead>
                <TableHead>Opened At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    {loading ? 'Loading email logs...' : 'No email logs found'}
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium text-sm">{log.recipient_email}</TableCell>
                    <TableCell className="text-sm">
                      {log.subject}
                      {log.email_templates && (
                        <div className="text-xs text-muted-foreground mt-1">
                          {log.email_templates.name}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.sent_at), 'MMM dd, yyyy HH:mm')}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.opened_at 
                        ? format(new Date(log.opened_at), 'MMM dd, yyyy HH:mm')
                        : '-'
                      }
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
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
