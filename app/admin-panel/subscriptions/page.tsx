'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  Search,
  XCircle,
  type LucideIcon,
} from 'lucide-react'
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

const STATUS_BADGES: Record<string, { className: string; icon: LucideIcon }> = {
  free: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  freemium: { className: 'bg-amber-500/10 text-amber-600 border-amber-500/20', icon: Clock },
  premium: { className: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20', icon: CheckCircle2 },
  cancelled: { className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: XCircle },
}

const CYCLE_BADGES: Record<string, string> = {
  monthly: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  yearly: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
}

function getStatusBadge(status: string): { className: string; icon: LucideIcon } {
  return STATUS_BADGES[status] || { className: 'bg-slate-500/10 text-slate-600 border-slate-500/20', icon: XCircle }
}

function getCycleBadge(cycle: string): string {
  return CYCLE_BADGES[cycle] || 'bg-slate-500/10 text-slate-600 border-slate-500/20'
}

function StatusBadge({ status }: { status: string }) {
  const { className, icon: Icon } = getStatusBadge(status)
  return (
    <Badge className={cn(className, 'border capitalize')}>
      <Icon className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  )
}

export default function SubscriptionsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [stats, setStats] = useState<SubscriptionStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
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
      setError(null)
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
    } catch (error: any) {
      setSubscriptions([])
      setTotalPages(1)
      setError(error?.message || 'Failed to fetch subscriptions')
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
    } catch (error: any) {
      setStats(null)
      setError(error?.message || 'Failed to fetch subscription stats')
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
    } catch (error: any) {
      setError(error?.message || 'Failed to search subscriptions')
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
    } catch (error: any) {
      setError(error?.message || 'Failed to export subscriptions')
    }
  }

  if (loading && !subscriptions.length && !stats) {
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscriptions</h1>
          <p className="text-muted-foreground">Manage user billing, plans, and Stripe synchronization.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[
            { title: 'Total Subscriptions', value: stats.total.toLocaleString(), desc: 'All subscription records' },
            { title: 'Premium', value: stats.premium.toLocaleString(), desc: 'Active paid subscribers' },
            { title: 'Freemium', value: stats.freemium.toLocaleString(), desc: 'Free plan users' },
            { title: 'Cancelled', value: stats.cancelled.toLocaleString(), desc: `${stats.recent_cancellations} recent cancellations` },
          ].map((kpi) => (
            <Card key={kpi.title} className="shadow-none border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{kpi.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Unable to load subscriptions</p>
            <p className="text-muted-foreground mt-1">{error}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left pane: list */}
        <Card className="shadow-none border min-w-0">
          <CardHeader className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by email or name"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-8 w-[250px] h-9"
                />
              </div>
              <Button onClick={handleSearch}>Search</Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={cycleFilter} onValueChange={setCycleFilter}>
                <SelectTrigger className="w-[150px] h-9">
                  <SelectValue placeholder="Billing" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All cycles</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="yearly">Yearly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="space-y-4 py-2">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                ))}
              </div>
            ) : subscriptions.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted-foreground">No subscriptions found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Billing</TableHead>
                    <TableHead>Subscribed</TableHead>
                    <TableHead>End date</TableHead>
                    <TableHead className="text-right">Record</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((sub) => {
                    const isSelected = selectedSubscriptionId === sub.id
                    return (
                      <TableRow
                        key={sub.id}
                        className={cn('cursor-pointer transition-colors', isSelected && 'bg-muted')}
                        onClick={() => {
                          router.replace(`/admin-panel/subscriptions?id=${sub.id}`)
                        }}
                      >
                        <TableCell className="font-mono text-xs">{sub.id.slice(0, 8)}</TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium">{sub.full_name || 'No name'}</p>
                            <p className="text-xs text-muted-foreground">{sub.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sub.subscription_status} />
                        </TableCell>
                        <TableCell>
                          {sub.billing_cycle ? (
                            <Badge className={cn(getCycleBadge(sub.billing_cycle), 'border capitalize')}>
                              {sub.billing_cycle}
                            </Badge>
                          ) : (
                            <span className="text-sm text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(sub.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {sub.subscription_end_date
                            ? format(new Date(sub.subscription_end_date), 'MMM dd, yyyy')
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/admin-panel/subscriptions/${sub.id}`}
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="mr-2 h-4 w-4" />
                              Full
                            </Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>

          <CardFooter className="border-t">
            <p className="text-xs text-muted-foreground">Showing {subscriptions.length} subscriptions</p>
            {totalPages > 1 && (
              <div className="flex items-center gap-3 ml-auto">
                <p className="text-xs text-muted-foreground">Page {currentPage} of {totalPages}</p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    variant="outline"
                    size="sm"
                  >
                    Previous
                  </Button>
                  <Button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    variant="outline"
                    size="sm"
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardFooter>
        </Card>

        {/* Right pane: detail */}
        <Card className="shadow-none border min-w-0">
          {!selectedSubscriptionId ? (
            <CardContent className="py-10 text-sm text-muted-foreground">
              Select a subscription to view details.
            </CardContent>
          ) : loading ? (
            <CardContent className="space-y-4 py-6">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </CardContent>
          ) : !selectedRow ? (
            <CardContent className="py-6 text-sm text-muted-foreground">
              Subscription not found.
            </CardContent>
          ) : (
            <>
              <CardHeader className="flex-row items-start justify-between gap-4">
                <div className="min-w-0">
                  <CardTitle className="text-lg truncate">
                    {selectedRow.full_name || 'User'}
                  </CardTitle>
                  <CardDescription className="truncate">{selectedRow.email}</CardDescription>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin-panel/subscriptions/${selectedRow.id}`}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Full record
                  </Link>
                </Button>
              </CardHeader>

              <CardContent>
                <div className="grid grid-cols-1 gap-5">
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Status</div>
                    <StatusBadge status={selectedRow.subscription_status} />
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Billing cycle</div>
                    {selectedRow.billing_cycle ? (
                      <Badge className={cn(getCycleBadge(selectedRow.billing_cycle), 'border capitalize')}>
                        {selectedRow.billing_cycle}
                      </Badge>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Subscribed</div>
                    <div className="text-sm">{format(new Date(selectedRow.created_at), 'MMM dd, yyyy')}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">End date</div>
                    <div className="text-sm">
                      {selectedRow.subscription_end_date
                        ? format(new Date(selectedRow.subscription_end_date), 'MMM dd, yyyy')
                        : '—'}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Stripe customer</div>
                    {selectedRow.stripe_customer_id ? (
                      <a
                        href={`https://dashboard.stripe.com/customers/${selectedRow.stripe_customer_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-foreground underline underline-offset-4 break-all"
                      >
                        {selectedRow.stripe_customer_id}
                      </a>
                    ) : (
                      <div className="text-sm text-muted-foreground">—</div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Stripe subscription</div>
                    <div className="text-sm font-mono break-all">
                      {selectedRow.subscription_id || '—'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
