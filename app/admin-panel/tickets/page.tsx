'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, RefreshCw, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  pending_assignment: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  in_progress: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  waiting_customer: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  waiting_internal: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  resolved: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  closed: 'bg-muted text-muted-foreground border-border',
  cancelled: 'bg-rose-500/10 text-rose-600 border-rose-500/20',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-blue-500/10 text-blue-600',
  high: 'bg-orange-500/10 text-orange-600',
  urgent: 'bg-rose-500/10 text-rose-600',
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/tickets')
      const data = await res.json()
      if (res.ok) setTickets(data.tickets || [])
    } catch (e) {
      console.error('Failed to fetch tickets', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTickets() }, [])

  const filtered = tickets.filter((t: any) => {
    if (statusFilter !== 'all' && t.ticket_status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        (t.ticket_no || '').toLowerCase().includes(q) ||
        (t.ticket_title || '').toLowerCase().includes(q) ||
        (t.submitter_email || '').toLowerCase().includes(q)
      )
    }
    return true
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">Manage user inquiries and technical issues.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchTickets} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Card className="shadow-none border">
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
              <Input
                type="text"
                placeholder="Search by ticket #, title, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 h-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="waiting_customer">Waiting Customer</SelectItem>
                <SelectItem value="resolved">Resolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
      </Card>

      {loading ? (
        <div className="text-center py-16 text-muted-foreground text-sm">Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground text-sm">No tickets found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket: any) => (
            <Link key={ticket.id} href={`/admin-panel/tickets/${ticket.id}`}>
              <Card className="shadow-none border hover:border-primary/50 transition-colors cursor-pointer group">
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <div className="text-sm font-mono text-muted-foreground">{ticket.ticket_no}</div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn('font-mono text-[10px] py-0 px-1.5 uppercase tracking-wider', STATUS_COLORS[ticket.ticket_status] || STATUS_COLORS.new)}>
                          {ticket.ticket_status?.replace(/_/g, ' ') || 'new'}
                        </Badge>
                        <Badge variant="outline" className={cn('font-mono text-[10px] py-0 px-1.5 uppercase tracking-wider border-transparent', PRIORITY_COLORS[ticket.priority_level] || PRIORITY_COLORS.low)}>
                          {ticket.priority_level || 'low'}
                        </Badge>
                      </div>
                      <p className="text-sm font-medium truncate">{ticket.ticket_title}</p>
                      {ticket.submitter_email && (
                        <p className="text-xs text-muted-foreground mt-0.5">{ticket.submitter_email}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-4 flex-shrink-0">
                    <span className="text-xs text-muted-foreground">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <ArrowRight size={16} className="text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
