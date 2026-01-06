'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Search, 
  AlertCircle,
  CheckCircle2,
  Clock,
  AlertTriangle
} from 'lucide-react'
import { format } from 'date-fns'

interface SupportTicket {
  id: string
  user_id: string
  subject: string
  description: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  created_at: string
  updated_at: string
  profiles?: {
    email: string
    full_name: string
  }
}

interface SupportStats {
  total_tickets: number
  open_tickets: number
  in_progress_tickets: number
  resolved_tickets: number
  avg_response_time_hours: number
}

export default function SupportTicketsPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState<SupportTicket[]>([])
  const [stats, setStats] = useState<SupportStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const searchRef = useRef(search)
  searchRef.current = search

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const statsRes = await fetch('/api/admin/support/stats')
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData.stats)
      }

      const params = new URLSearchParams({
        page: page.toString(),
        ...(statusFilter && { status: statusFilter }),
        ...(priorityFilter && { priority: priorityFilter }),
        ...(searchRef.current && { search: searchRef.current }),
      })

      const ticketsRes = await fetch(`/api/admin/support?${params}`)
      if (ticketsRes.ok) {
        const ticketsData = await ticketsRes.json()
        setTickets(ticketsData.tickets)
        setTotalPages(ticketsData.totalPages)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [page, priorityFilter, statusFilter])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleSearch = () => {
    setPage(1)
    fetchData()
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      open: { color: 'bg-blue-500/10 text-blue-400 border-blue-400/30', icon: AlertCircle },
      in_progress: { color: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30', icon: Clock },
      resolved: { color: 'bg-green-500/10 text-green-400 border-green-400/30', icon: CheckCircle2 },
      closed: { color: 'bg-slate-500/10 text-slate-400 border-slate-400/30', icon: CheckCircle2 },
    }
    const variant = variants[status] || variants.open
    const Icon = variant.icon
    
    return (
      <Badge className={`${variant.color} border`}>
        <Icon className="h-3 w-3 mr-1" />
        {status.replace('_', ' ').charAt(0).toUpperCase() + status.replace('_', ' ').slice(1)}
      </Badge>
    )
  }

  const getPriorityBadge = (priority: string) => {
    const colors: Record<string, string> = {
      low: 'bg-slate-500/10 text-slate-400 border-slate-400/30',
      medium: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
      high: 'bg-orange-500/10 text-orange-400 border-orange-400/30',
      urgent: 'bg-red-500/10 text-red-400 border-red-400/30',
    }
    
    return (
      <Badge className={`${colors[priority] || colors.low} border`}>
        {priority.charAt(0).toUpperCase() + priority.slice(1)}
      </Badge>
    )
  }

  if (loading && !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading support tickets...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Support Tickets</h1>
        <p className="text-slate-400">Manage customer support requests</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Total Tickets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-white">{stats?.total_tickets || 0}</div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-blue-400">{stats?.open_tickets || 0}</div>
              <AlertCircle className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-yellow-400">{stats?.in_progress_tickets || 0}</div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-slate-400">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold text-green-400">{stats?.resolved_tickets || 0}</div>
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Tickets</CardTitle>
          <CardDescription className="text-slate-400">
            View and manage support tickets
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search tickets..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>

            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Subject</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">User</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Priority</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Created</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-slate-400">
                      No tickets found
                    </td>
                  </tr>
                ) : (
                  tickets.map((ticket) => (
                    <tr key={ticket.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                      <td className="py-3 px-4">
                        <div className="text-sm text-white font-medium">{ticket.subject}</div>
                        <div className="text-xs text-slate-400 line-clamp-1 mt-1">
                          {ticket.description}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="text-sm text-white">{ticket.profiles?.full_name || 'Unknown'}</div>
                        <div className="text-xs text-slate-400">{ticket.profiles?.email}</div>
                      </td>
                      <td className="py-3 px-4">{getStatusBadge(ticket.status)}</td>
                      <td className="py-3 px-4">{getPriorityBadge(ticket.priority)}</td>
                      <td className="py-3 px-4 text-sm text-slate-400">
                        {format(new Date(ticket.created_at), 'MMM dd, yyyy')}
                      </td>
                      <td className="py-3 px-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => router.push(`/admin-panel/support/${ticket.id}`)}
                          className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

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
