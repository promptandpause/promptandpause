'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
  { value: 'user_view', label: 'User View' },
  { value: 'user_update', label: 'User Update' },
  { value: 'user_delete', label: 'User Delete' },
  { value: 'subscription_update', label: 'Subscription Update' },
  { value: 'export_data', label: 'Data Export' },
  { value: 'login', label: 'Login' },
  { value: 'other', label: 'Other' },
]

const ACTION_COLORS: Record<string, string> = {
  user_view: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
  user_update: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30',
  user_delete: 'bg-red-500/10 text-red-400 border-red-400/30',
  subscription_update: 'bg-purple-500/10 text-purple-400 border-purple-400/30',
  export_data: 'bg-green-500/10 text-green-400 border-green-400/30',
  login: 'bg-slate-500/10 text-slate-400 border-slate-400/30',
  other: 'bg-slate-500/10 text-slate-400 border-slate-400/30',
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actionType, setActionType] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  useEffect(() => {
    loadLogs()
  }, [currentPage, actionType])

  async function loadLogs() {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      })

      if (actionType !== 'all') {
        params.append('action_type', actionType)
      }

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activity logs')

      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(Math.ceil(data.total / limit))
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (!search.trim()) {
      loadLogs()
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0',
        search: search.trim(),
      })

      if (actionType !== 'all') {
        params.append('action_type', actionType)
      }

      const response = await fetch(`/api/admin/activity?${params}`)
      if (!response.ok) throw new Error('Failed to search logs')

      const data = await response.json()
      setLogs(data.logs)
      setTotalPages(Math.ceil(data.total / limit))
      setCurrentPage(1)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  async function exportLogs() {
    try {
      const params = new URLSearchParams()
      if (actionType !== 'all') {
        params.append('action_type', actionType)
      }
      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/admin/activity/export?${params}`)
      if (!response.ok) throw new Error('Failed to export logs')

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      alert('Failed to export logs')
    }
  }

  function getActionColor(action: string): string {
    return ACTION_COLORS[action] || ACTION_COLORS.other
  }

  if (loading && logs.length === 0) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Activity Logs</h1>
        <p className="text-slate-400 mt-1">Admin actions and system events</p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by user email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-slate-900 border-slate-700 text-white"
              />
            </div>
            <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
              Search
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger className="w-[200px] bg-slate-900 border-slate-700 text-white">
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
              className="border-slate-700 text-white hover:bg-slate-800"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </div>
        </div>
      </Card>

      {/* Activity Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-medium">Timestamp</th>
                <th className="text-left p-4 text-slate-400 font-medium">Admin</th>
                <th className="text-left p-4 text-slate-400 font-medium">Action</th>
                <th className="text-left p-4 text-slate-400 font-medium">Target User</th>
                <th className="text-left p-4 text-slate-400 font-medium">Details</th>
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
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400">
                    No activity logs found
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700/50 hover:bg-slate-900/50">
                    <td className="p-4 text-sm text-slate-300">
                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm:ss')}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {log.admin_email}
                    </td>
                    <td className="p-4">
                      <Badge className={`${getActionColor(log.action_type)} border`}>
                        {log.action_type.replace(/_/g, ' ')}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {log.target_user_email || log.target_user_id || '-'}
                    </td>
                    <td className="p-4 text-sm text-slate-400">
                      {log.details ? (
                        <details className="cursor-pointer">
                          <summary className="text-blue-400 hover:text-blue-300">
                            View details
                          </summary>
                          <pre className="mt-2 text-xs bg-slate-950 p-2 rounded border border-slate-700 overflow-x-auto">
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
