'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Headphones, Search, RefreshCw, ArrowRight, Clock, AlertCircle, CheckCircle2, HelpCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700 border-blue-200',
  pending_assignment: 'bg-amber-100 text-amber-700 border-amber-200',
  in_progress: 'bg-orange-100 text-orange-700 border-orange-200',
  waiting_customer: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  waiting_internal: 'bg-purple-100 text-purple-700 border-purple-200',
  resolved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  closed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-slate-100 text-slate-600',
  medium: 'bg-blue-100 text-blue-700',
  high: 'bg-orange-100 text-orange-700',
  urgent: 'bg-red-100 text-red-700',
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
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/20">
            <Headphones className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Tickets</h1>
            <p className="text-sm text-slate-500">Manage support tickets from the helpdesk</p>
          </div>
        </div>
        <button onClick={fetchTickets} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm transition-all shadow-sm">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by ticket #, title, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 pl-10 pr-4 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 px-3 rounded-xl bg-white border border-slate-300 text-slate-700 text-sm"
        >
          <option value="all">All Status</option>
          <option value="new">New</option>
          <option value="in_progress">In Progress</option>
          <option value="waiting_customer">Waiting Customer</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-slate-400 text-sm">Loading tickets...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400 text-sm">No tickets found</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ticket: any) => (
            <Link key={ticket.id} href={`/admin-panel/tickets/${ticket.id}`}>
              <div className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-purple-200 transition-all cursor-pointer">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-slate-400">{ticket.ticket_no}</span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_COLORS[ticket.ticket_status] || STATUS_COLORS.new}`}>
                        {ticket.ticket_status?.replace(/_/g, ' ') || 'new'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${PRIORITY_COLORS[ticket.priority_level] || PRIORITY_COLORS.low}`}>
                        {ticket.priority_level || 'low'}
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900 truncate">{ticket.ticket_title}</h3>
                    {ticket.submitter_email && (
                      <p className="text-xs text-slate-500 mt-1">{ticket.submitter_email}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                    <ArrowRight className="h-4 w-4 text-slate-300" />
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}