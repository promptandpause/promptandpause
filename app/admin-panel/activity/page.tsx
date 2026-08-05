'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { useToast } from '@/hooks/use-toast'
import { Download, Search, Filter, ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface ActivityLog {
  id: string
  admin_email: string
  action_type: string
  target_user_id: string | null
  target_user_email: string | null
  details: Record<string, any> | null
  created_at: string
}

const ACTION_TYPES = [
  { value: 'all', label: 'All Actions' },
  { value: 'user_viewed', label: 'User Viewed' },
  { value: 'user_updated', label: 'User Updated' },
  { value: 'user_deleted', label: 'User Deleted' },
  { value: 'subscription_viewed', label: 'Subscription Viewed' },
  { value: 'subscription_update', label: 'Subscription Updated' },
  { value: 'subscription_cancel', label: 'Subscription Cancelled' },
  { value: 'admin_user_created', label: 'Admin User Created' },
  { value: 'admin_user_updated', label: 'Admin User Updated' },
  { value: 'admin_user_deactivated', label: 'Admin User Deactivated' },
  { value: 'admin_password_updated', label: 'Admin Password Updated' },
  { value: 'admin_email_updated', label: 'Admin Email Updated' },
  { value: 'email_template_updated', label: 'Email Template Updated' },

  { value: 'prompt_created', label: 'Prompt Created' },
  { value: 'prompt_updated', label: 'Prompt Updated' },
  { value: 'prompt_deleted', label: 'Prompt Deleted' },
  { value: 'setting_updated', label: 'Setting Updated' },
  { value: 'feature_flag_updated', label: 'Feature Flag Updated' },
  { value: 'export_data', label: 'Data Export' },
  { value: 'other', label: 'Other' },
]

const ACTION_COLORS: Record<string, string> = {
  user_viewed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  user_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  user_deleted: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  subscription_viewed: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  subscription_update: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  subscription_cancel: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  admin_user_created: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  admin_user_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin_user_deactivated: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  admin_password_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  admin_email_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  email_template_updated: 'bg-purple-500/10 text-purple-600 border-purple-500/20',

  prompt_created: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  prompt_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  prompt_deleted: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
  setting_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  feature_flag_updated: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  export_data: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  other: 'bg-muted text-muted-foreground border-border',
}

export default function ActivityLogsPage() {
  const { toast } = useToast()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [appliedSearch, setAppliedSearch] = useState('')
  const [actionType, setActionType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  const loadLogs = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      })

      if (actionType !== 'all') {
        params.append('action_type', actionType)
      }

      if (appliedSearch.trim()) {
        params.append('search', appliedSearch.trim())
      }

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch activity logs')
      }

      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(Math.ceil(data.total / limit))
    } catch (error: any) {
      setError(error?.message || 'Failed to load activity logs')
    } finally {
      setLoading(false)
    }
  }, [actionType, appliedSearch, currentPage, limit])

  useEffect(() => {
    loadLogs()
  }, [loadLogs])

  async function handleSearch() {
    setError(null)
    const next = search.trim()
    setAppliedSearch(next)
    setCurrentPage(1)
  }

  async function exportLogs() {
    try {
      const params = new URLSearchParams()
      if (actionType !== 'all') {
        params.append('action_type', actionType)
      }
      if (appliedSearch.trim()) {
        params.append('search', appliedSearch.trim())
      }

      const response = await fetch(`/api/admin/activity/export?${params}`)
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to export logs')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error?.message || 'Failed to export logs',
        variant: 'destructive'
      })
    }
  }

  function getActionColor(action: string): string {
    return ACTION_COLORS[action] || ACTION_COLORS.other
  }

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activity Logs</h1>
          <p className="text-muted-foreground">Admin actions and system events</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={exportLogs}>
            <Download className="mr-2 h-4 w-4" /> Export
          </Button>
        </div>
      </div>

      {error && (
        <Card className="shadow-none border bg-rose-500/10 border-rose-500/20">
          <CardContent className="p-4">
            <p className="text-sm text-rose-600">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-none border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                placeholder="Search by user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-10 h-10"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={actionType} onValueChange={setActionType}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button onClick={handleSearch} className="h-10">
                Search
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="shadow-none border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Admin</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Target User</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    <Spinner className="mx-auto size-8 text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No activity logs found
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell className="text-sm">{log.admin_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={cn('font-mono text-[10px] py-0 px-1.5 uppercase tracking-wider', getActionColor(log.action_type))}>
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.target_user_email || log.target_user_id || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-primary hover:underline">
                            View
                          </summary>
                          <pre className="mt-2 text-xs bg-muted p-3 rounded-lg border overflow-x-auto text-foreground">
                            {JSON.stringify(log.details, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t">
              <p className="text-xs text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                >
                  <ChevronLeft size={16} className="mr-1" /> Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                >
                  Next <ChevronRight size={16} className="ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
