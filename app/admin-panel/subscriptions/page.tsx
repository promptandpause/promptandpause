'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CreditCard, DollarSign, TrendingDown, Users, Search, Download } from 'lucide-react'
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [cycleFilter, setCycleFilter] = useState('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 50

  useEffect(() => {
    loadStats()
  }, [])

  useEffect(() => {
    loadSubscriptions()
  }, [currentPage, statusFilter, cycleFilter])

  async function loadStats() {
    try {
      const response = await fetch('/api/admin/subscriptions/stats')
      if (!response.ok) throw new Error('Failed to fetch stats')
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  async function loadSubscriptions() {
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
      console.error('Error loading subscriptions:', error)
    } finally {
      setLoading(false)
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
      console.error('Error searching subscriptions:', error)
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
      console.error('Error exporting subscriptions:', error)
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

  const statCards = stats ? [
    {
      title: 'MRR',
      value: `$${stats.mrr.toLocaleString()}`,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Premium Subscribers',
      value: stats.premium.toLocaleString(),
      icon: Users,
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
    },
    {
      title: 'Free Users',
      value: stats.freemium.toLocaleString(),
      icon: CreditCard,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
    {
      title: 'Recent Cancellations',
      value: stats.recent_cancellations.toLocaleString(),
      icon: TrendingDown,
      color: 'text-red-400',
      bgColor: 'bg-red-500/10',
    },
  ] : []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Subscriptions</h1>
          <p className="text-slate-400 mt-1">Manage user subscriptions and billing</p>
        </div>
        <Button
          onClick={handleExport}
          className="bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.title} className="bg-slate-800/50 border-slate-700">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-2 rounded-lg ${card.bgColor}`}>
                      <Icon className={`h-5 w-5 ${card.color}`} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-slate-400">{card.title}</p>
                    <p className="text-2xl font-bold text-white">{card.value}</p>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by email or name..."
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
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="freemium">Freemium</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={cycleFilter} onValueChange={setCycleFilter}>
              <SelectTrigger className="w-[180px] bg-slate-900 border-slate-700 text-white">
                <SelectValue placeholder="Billing" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cycles</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Subscriptions Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left p-4 text-slate-400 font-medium">User</th>
                <th className="text-left p-4 text-slate-400 font-medium">Status</th>
                <th className="text-left p-4 text-slate-400 font-medium">Billing Cycle</th>
                <th className="text-left p-4 text-slate-400 font-medium">Subscribed</th>
                <th className="text-left p-4 text-slate-400 font-medium">End Date</th>
                <th className="text-left p-4 text-slate-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-4">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                    </div>
                  </td>
                </tr>
              ) : subscriptions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    No subscriptions found
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => (
                  <tr key={sub.id} className="border-b border-slate-700/50 hover:bg-slate-900/50">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-white">{sub.full_name || 'No name'}</p>
                        <p className="text-xs text-slate-400">{sub.email}</p>
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
                        <span className="text-sm text-slate-500">-</span>
                      )}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {format(new Date(sub.created_at), 'MMM dd, yyyy')}
                    </td>
                    <td className="p-4 text-sm text-slate-300">
                      {sub.subscription_end_date 
                        ? format(new Date(sub.subscription_end_date), 'MMM dd, yyyy')
                        : '-'
                      }
                    </td>
                    <td className="p-4">
                      <Link href={`/admin-panel/subscriptions/${sub.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-700 text-blue-400 hover:bg-slate-800 hover:text-blue-300"
                        >
                          View
                        </Button>
                      </Link>
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
