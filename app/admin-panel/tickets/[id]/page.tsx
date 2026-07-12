'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send, Loader2, Clock, User, Mail, MessageSquare } from 'lucide-react'

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

export default function TicketDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [ticket, setTicket] = useState<any>(null)
  const [comments, setComments] = useState<any[]>([])
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchTicket = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}`)
      const data = await res.json()
      if (res.ok) {
        setTicket(data.ticket)
        setComments(data.comments || [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTicket() }, [id])

  const handleReply = async () => {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch(`/api/admin/tickets/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: replyText }),
      })
      if (res.ok) {
        setReplyText('')
        await fetchTicket()
      }
    } catch (e) {
      console.error(e)
    } finally {
      setSending(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-400 text-sm">Loading ticket...</div>
  if (!ticket) return <div className="p-8 text-center text-slate-400 text-sm">Ticket not found</div>

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-6">
      <Link href="/admin-panel/tickets" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="h-4 w-4" />
        Back to tickets
      </Link>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-mono text-slate-400">{ticket.ticket_no}</span>
              <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium border ${STATUS_COLORS[ticket.ticket_status] || STATUS_COLORS.new}`}>
                {ticket.ticket_status?.replace(/_/g, ' ') || 'new'}
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-900">{ticket.ticket_title}</h1>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl text-sm">
          <div className="flex items-center gap-2 text-slate-600">
            <User className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Submitter:</span>
            <span className="font-medium text-slate-900">{ticket.submitter?.nickname || ticket.submitter?.email || 'Unknown'}</span>
          </div>
          {ticket.submitter?.email && (
            <div className="flex items-center gap-2 text-slate-600">
              <Mail className="h-4 w-4 text-slate-400" />
              <span className="text-slate-500">Email:</span>
              <span className="font-medium text-slate-900">{ticket.submitter.email}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-slate-600">
            <Clock className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Created:</span>
            <span className="font-medium text-slate-900">{new Date(ticket.createdAt).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            <span className="text-slate-500">Comments:</span>
            <span className="font-medium text-slate-900">{comments.length}</span>
          </div>
        </div>

        {ticket.description_text && (
          <div className="mt-4 p-4 bg-white border border-slate-200 rounded-xl">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Description</p>
            <div className="text-sm text-slate-700 whitespace-pre-wrap">{ticket.description_text}</div>
          </div>
        )}
      </div>

      <div className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100">
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            Conversation ({comments.length})
          </h2>
        </div>

        <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
          {comments.length === 0 ? (
            <div className="p-6 text-center text-sm text-slate-400">No comments yet</div>
          ) : (
            comments.map((comment: any) => (
              <div key={comment.id} className="p-6">
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-full flex-shrink-0 ${comment.content?.includes('[Staff reply]') ? 'bg-purple-100' : 'bg-blue-100'}`}>
                    <MessageSquare className={`h-4 w-4 ${comment.content?.includes('[Staff reply]') ? 'text-purple-600' : 'text-blue-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-semibold text-slate-700">
                        {comment.content?.includes('[Staff reply]') ? 'Staff' : 'Customer'}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(comment.createdAt).toLocaleString()}</span>
                    </div>
                    <p className="text-sm text-slate-600 whitespace-pre-wrap">
                      {comment.content?.replace(/^\[Staff reply\]\n\n/, '').replace(/^\[Customer replied via email\]\n\n/, '')}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {ticket.ticket_status !== 'closed' && ticket.ticket_status !== 'resolved' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-slate-400" />
            Add Reply
          </h2>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply here..."
            rows={4}
            className="w-full p-4 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all resize-none"
          />
          <div className="flex justify-end mt-3">
            <button
              onClick={handleReply}
              disabled={sending || !replyText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white text-sm font-medium shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
            >
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
