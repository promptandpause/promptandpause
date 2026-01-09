'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Download, Search, Filter } from 'lucide-react'
import { format } from 'date-fns'

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
  { value: 'support_ticket_updated', label: 'Support Ticket Updated' },
  { value: 'support_response_added', label: 'Support Response Added' },
  { value: 'prompt_created', label: 'Prompt Created' },
  { value: 'prompt_updated', label: 'Prompt Updated' },
  { value: 'prompt_deleted', label: 'Prompt Deleted' },
  { value: 'setting_updated', label: 'Setting Updated' },
  { value: 'feature_flag_updated', label: 'Feature Flag Updated' },
  { value: 'export_data', label: 'Data Export' },
  { value: 'other', label: 'Other' },
]

const ACTION_COLORS: Record<string, string> = {
  user_viewed: 'bg-blue-50 text-blue-700 border-blue-200',
  user_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  user_deleted: 'bg-red-50 text-red-700 border-red-200',
  subscription_viewed: 'bg-blue-50 text-blue-700 border-blue-200',
  subscription_update: 'bg-purple-50 text-purple-700 border-purple-200',
  subscription_cancel: 'bg-red-50 text-red-700 border-red-200',
  admin_user_created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  admin_user_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  admin_user_deactivated: 'bg-red-50 text-red-700 border-red-200',
  admin_password_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  admin_email_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  email_template_updated: 'bg-purple-50 text-purple-700 border-purple-200',
  support_ticket_updated: 'bg-blue-50 text-blue-700 border-blue-200',
  support_response_added: 'bg-blue-50 text-blue-700 border-blue-200',
  prompt_created: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  prompt_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  prompt_deleted: 'bg-red-50 text-red-700 border-red-200',
  setting_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  feature_flag_updated: 'bg-amber-50 text-amber-700 border-amber-200',
  export_data: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  other: 'bg-gray-50 text-gray-700 border-gray-200',
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
        <Skeleton className="h-8 w-64 bg-gray-200" />
        <Skeleton className="h-96 bg-gray-200" />
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Activity Logs</h1>
        <p className="text-sm text-gray-500 mt-1">Admin actions and system events</p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {/* Filters */}
      <Card className="bg-white border border-gray-100 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-white border-gray-200 text-gray-900"
              />
            </div>
            <Button onClick={handleSearch} className="bg-neutral-900 hover:bg-neutral-800">
              Search
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-[200px] bg-white border-gray-200 text-gray-900">
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

            <Button
              onClick={exportLogs}
              variant="outline"
              className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Table */}
      <Card className="bg-white border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left p-4 text-gray-500 font-medium">Timestamp</th>
                <th className="text-left p-4 text-gray-500 font-medium">Admin</th>
                <th className="text-left p-4 text-gray-500 font-medium">Action</th>
                <th className="text-left p-4 text-gray-500 font-medium">Target User</th>
                <th className="text-left p-4 text-gray-500 font-medium">Details</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="p-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neutral-900"></div>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 text-sm text-gray-700">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {log.admin_email}
                    </td>
                    <td className="p-4">
                      <Badge className={`${getActionColor(log.action_type)} border`}>
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-gray-700">
                      {log.target_user_email || log.target_user_id || '-'}
                    </td>
                    <td className="p-4 text-sm text-gray-500">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-700 hover:text-blue-800">
                            View
                          </summary>
                          <pre className="mt-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-200 overflow-x-auto text-gray-800">
                            {JSON.stringify(log.details, null, 2)}
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

        {/* Pagination */}
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
