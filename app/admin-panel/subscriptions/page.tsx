'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, Download, ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

interface Subscription {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  subscription_id: string | null
  stripe_customer_id: string | null
  billing_cycle: string | null
  subscription_end_date: string | null
  created_at: string
  updated_at: string
}

interface SubscriptionStats {
  freemium: number
  premium: number
  cancelled: number
  total: number
  mrr: number
  recent_cancellations: number
}

const STATUS_COLORS: Record<string, string> = {
  freemium: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
  premium: 'bg-green-500/10 text-green-400 border-green-400/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-400/30',
}

const CYCLE_COLORS: Record<string, string> = {
  monthly: 'bg-purple-500/10 text-purple-400 border-purple-400/30',
  yearly: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30',
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cycleFilter, setCycleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null)

  const loadSubscriptions = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: ((currentPage - 1) * limit).toString(),
      })

      if (statusFilter !== 'all') {
        params.append('subscription_status', statusFilter)
      }

      if (cycleFilter !== 'all') {
        params.append('billing_cycle', cycleFilter)
      }

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch subscriptions')

      const data = await response.json()
      setSubscriptions(data.subscriptions)
      setTotalPages(Math.ceil(data.total / limit))
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [currentPage, cycleFilter, limit, statusFilter])

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadSubscriptions()
  }, [loadSubscriptions])

  useEffect(() => {
    setSelectedSubscriptionId(searchParams.get('id'))
  }, [searchParams])

  const selectedRow = useMemo(() => {
    if (!selectedSubscriptionId) return null
    return subscriptions.find((s) => s.id === selectedSubscriptionId) || null
  }, [selectedSubscriptionId, subscriptions])

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/subscriptions/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
    }
  }

  async function handleSearch() {
    if (!search.trim()) {
      loadSubscriptions()
      return
    }

    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: '0',
        search: search.trim(),
      })

      if (statusFilter !== 'all') {
        params.append('subscription_status', statusFilter)
      }

      if (cycleFilter !== 'all') {
        params.append('billing_cycle', cycleFilter)
      }

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (!response.ok) throw new Error('Failed to search subscriptions')

      const data = await response.json()
      setSubscriptions(data.subscriptions)
      setTotalPages(Math.ceil(data.total / limit))
      setCurrentPage(1)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  async function handleExport() {
    try {
      // Fetch all subscriptions without pagination
      const params = new URLSearchParams({
        limit: '10000',
        offset: '0',
      })

      if (statusFilter !== 'all') {
        params.append('subscription_status', statusFilter)
      }

      if (cycleFilter !== 'all') {
        params.append('billing_cycle', cycleFilter)
      }

      if (search.trim()) {
        params.append('search', search.trim())
      }

      const response = await fetch(`/api/admin/subscriptions?${params}`)
      if (!response.ok) throw new Error('Failed to fetch subscriptions')

      const data = await response.json()
      const subs = data.subscriptions

      // Create CSV content
      const headers = ['Email', 'Full Name', 'Status', 'Billing Cycle', 'Stripe Customer ID', 'Subscription ID', 'Created At', 'End Date']
      const csvRows = [
        headers.join(','),
        ...subs.map((sub: Subscription) => [
          sub.email,
          sub.full_name || '',
          sub.subscription_status,
          sub.billing_cycle || '',
          sub.stripe_customer_id || '',
          sub.subscription_id || '',
          new Date(sub.created_at).toISOString(),
          sub.subscription_end_date ? new Date(sub.subscription_end_date).toISOString() : ''
        ].map(field => `"${field}"`).join(','))
      ]

      const csvContent = csvRows.join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      
      link.setAttribute('href', url)
      link.setAttribute('download', `subscriptions_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (error) {
    }
  }

  function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-slate-500/10 text-slate-400 border-slate-400/30'
  }

  function getCycleColor(cycle: string): string {
    return CYCLE_COLORS[cycle] || 'bg-slate-500/10 text-slate-400 border-slate-400/30'
  }

  if (loading && !subscriptions.length && !stats) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-32 bg-slate-800" />
          ))}
        </div>
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Subscriptions</h1>
          <p className="text-sm text-neutral-500">Manage subscriptions and billing.</p>
        </div>

        <Button onClick={handleExport} variant="outline" className="border-neutral-200 bg-white">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {stats && (
        <div className="text-xs text-neutral-500">
          Total {stats.total} · Premium {stats.premium} · Free {stats.freemium} · Cancelled {stats.cancelled}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left pane: list */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {/* Filters */}
          <div className="p-4 border-b border-neutral-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                placeholder="Search by email or name"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-9 bg-white border-neutral-200"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
              <Button onClick={handleSearch} className="bg-neutral-900 hover:bg-neutral-800">
                Search
              </Button>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-white border-neutral-200">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="freemium">Freemium</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger className="bg-white border-neutral-200">
                  <SelectValue placeholder="Billing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cycles</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-xs text-neutral-500">Showing {subscriptions.length} subscriptions</div>
          </div>

          {/* Subscriptions Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-neutral-200">
                  <th className="text-left p-4 text-neutral-500 font-medium">User</th>
                  <th className="text-left p-4 text-neutral-500 font-medium">Status</th>
                  <th className="text-left p-4 text-neutral-500 font-medium">Billing</th>
                  <th className="text-left p-4 text-neutral-500 font-medium">Subscribed</th>
                  <th className="text-left p-4 text-neutral-500 font-medium">End date</th>
                  <th className="text-left p-4 text-neutral-500 font-medium">Record</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <tr key={i} className="border-b border-neutral-200">
                      <td className="p-4" colSpan={6}>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-64" />
                          <Skeleton className="h-3 w-40" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : subscriptions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-500">
                      No subscriptions found.
                    </td>
                  </tr>
                ) : (
                  subscriptions.map((sub) => {
                    const isSelected = selectedSubscriptionId === sub.id
                    return (
                      <tr
                        key={sub.id}
                        className={`border-b border-neutral-200 hover:bg-neutral-50 cursor-pointer ${
                          isSelected ? 'bg-neutral-50' : 'bg-white'
                        }`}
                        onClick={() => {
                          router.replace(`/admin-panel/subscriptions?id=${sub.id}`)
                        }}
                      >
                        <td className="p-4">
                          <div>
                            <p className="text-sm font-medium text-neutral-900">{sub.full_name || 'No name'}</p>
                            <p className="text-xs text-neutral-500">{sub.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge className={`${getStatusColor(sub.subscription_status)} border capitalize`}>
                            {sub.subscription_status}
                          </Badge>
                        </td>
                        <td className="p-4">
                          {sub.billing_cycle ? (
                            <Badge className={`${getCycleColor(sub.billing_cycle)} border capitalize`}>
                              {sub.billing_cycle}
                            </Badge>
                          ) : (
                            <span className="text-sm text-neutral-500">—</span>
                          )}
                        </td>
                        <td className="p-4 text-sm text-neutral-700">
                          {format(new Date(sub.created_at), 'MMM dd, yyyy')}
                        </td>
                        <td className="p-4 text-sm text-neutral-700">
                          {sub.subscription_end_date
                            ? format(new Date(sub.subscription_end_date), 'MMM dd, yyyy')
                            : '—'}
                        </td>
                        <td className="p-4">
                          <Link
                            href={`/admin-panel/subscriptions/${sub.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                          >
                            <ExternalLink className="h-4 w-4" />
                            Full
                          </Link>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-white">
              <p className="text-xs text-neutral-500">Page {currentPage} of {totalPages}</p>
              <div className="flex gap-2">
                <Button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  variant="outline"
                  size="sm"
                  className="border-neutral-200"
                >
                  Previous
                </Button>
                <Button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  variant="outline"
                  size="sm"
                  className="border-neutral-200"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right pane: detail */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {!selectedSubscriptionId ? (
            <div className="p-10 text-sm text-neutral-500">Select a subscription to view details.</div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !selectedRow ? (
            <div className="p-6 text-sm text-neutral-500">Subscription not found.</div>
          ) : (
            <div>
              <div className="px-6 py-5 border-b border-neutral-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-neutral-900 truncate">
                      {selectedRow.full_name || 'User'}
                    </h2>
                    <p className="text-sm text-neutral-500 truncate">{selectedRow.email}</p>
                  </div>
                  <Link
                    href={`/admin-panel/subscriptions/${selectedRow.id}`}
                    className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Full record
                  </Link>
                </div>
              </div>

              <div className="px-6 py-6">
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Status</div>
                    <div className="text-sm text-neutral-900 capitalize">{selectedRow.subscription_status}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Billing cycle</div>
                    <div className="text-sm text-neutral-900">{selectedRow.billing_cycle || '—'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Subscribed</div>
                    <div className="text-sm text-neutral-900">{format(new Date(selectedRow.created_at), 'MMM dd, yyyy')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">End date</div>
                    <div className="text-sm text-neutral-900">
                      {selectedRow.subscription_end_date
                        ? format(new Date(selectedRow.subscription_end_date), 'MMM dd, yyyy')
                        : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Stripe customer</div>
                    {selectedRow.stripe_customer_id ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${selectedRow.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-neutral-900 underline underline-offset-4"
                      >
                        {selectedRow.stripe_customer_id}
                      </a>
                    ) : (
                      <div className="text-sm text-neutral-700">—</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-neutral-500">Stripe subscription</div>
                    <div className="text-sm text-neutral-900 font-mono break-all">
                      {selectedRow.subscription_id || '—'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
