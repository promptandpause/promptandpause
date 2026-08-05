'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Card, CardHeader } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Search, Download, ExternalLink } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'

interface User {
  id: string
  email: string
  full_name: string
  subscription_status: string
  signup_date: string
  total_reflections: number
  engagement_rate_percent: number
  activity_status: string
  last_reflection_date: string | null
}

interface UserDetail {
  id: string
  email: string
  full_name: string
  timezone: string
  language: string
  subscription_status: string
  stripe_customer_id: string | null
  billing_cycle: string | null
  created_at: string
  updated_at: string
  stats: {
    total_prompts: number
    total_reflections: number
  }
}

interface AdminUserRow {
  email: string
}

interface ActivityLogRow {
  id: string
  admin_email: string
  action_type: string
  target_user_email: string | null
  created_at: string
}

export default function UsersPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 50

  const [adminEmails, setAdminEmails] = useState<Set<string>>(new Set())

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)

  const [activeTab, setActiveTab] = useState<'overview' | 'subscription' | 'activity' | 'record'>('overview')
  const [recentLogs, setRecentLogs] = useState<ActivityLogRow[]>([])
  const [logsLoading, setLogsLoading] = useState(false)

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const params = new URLSearchParams({
        limit: limit.toString(),
        offset: (page * limit).toString(),
      })
      
      if (search) params.append('search', search)
      if (subscriptionFilter !== 'all') params.append('subscription_status', subscriptionFilter)
      if (activityFilter !== 'all') params.append('activity_status', activityFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      
      const data = await response.json()
      setUsers(data.data)
      setTotal(data.total)
    } catch (error: any) {
      setUsers([])
      setTotal(0)
      setError(error?.message || 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }, [activityFilter, limit, page, search, subscriptionFilter])

  const loadAdminUsers = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/admin-users')
      if (!res.ok) return
      const data = await res.json()
      const emails = new Set<string>(
        (Array.isArray(data.users) ? (data.users as AdminUserRow[]) : [])
          .map((u) => (typeof u.email === 'string' ? u.email.toLowerCase() : ''))
          .filter((email): email is string => Boolean(email))
      )
      setAdminEmails(emails)
    } catch {
    }
  }, [])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  useEffect(() => {
    loadAdminUsers()
  }, [loadAdminUsers])

  useEffect(() => {
    const id = searchParams.get('id')
    setSelectedUserId(id)
    const q = searchParams.get('q')
    if (q != null) setSearch(q)
  }, [searchParams])

  const selectedUserRow = useMemo(() => {
    if (!selectedUserId) return null
    return users.find((u) => u.id === selectedUserId) || null
  }, [selectedUserId, users])

  const loadSelectedUserDetail = useCallback(async (id: string) => {
    try {
      setDetailLoading(true)
      setDetailError(null)
      const res = await fetch(`/api/admin/users/${id}`)
      if (!res.ok) throw new Error('Failed to fetch user')
      const data = await res.json()
      setSelectedUserDetail(data.data)
    } catch (err: any) {
      setDetailError(err.message || 'Failed to load user')
      setSelectedUserDetail(null)
    } finally {
      setDetailLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!selectedUserId) {
      setSelectedUserDetail(null)
      setDetailError(null)
      return
    }

    loadSelectedUserDetail(selectedUserId)
  }, [loadSelectedUserDetail, selectedUserId])

  useEffect(() => {
    if (activeTab !== 'activity') return
    const email = selectedUserDetail?.email || selectedUserRow?.email
    if (!email) return

    const loadLogs = async () => {
      try {
        setLogsLoading(true)
        const params = new URLSearchParams({
          limit: '10',
          offset: '0',
          search: email,
        })
        const res = await fetch(`/api/admin/activity?${params}`)
        if (!res.ok) return
        const data = await res.json()
        setRecentLogs((data.logs || []) as ActivityLogRow[])
      } finally {
        setLogsLoading(false)
      }
    }

    loadLogs()
  }, [activeTab, selectedUserDetail?.email, selectedUserRow?.email])

  async function handleExport() {
    try {
      const response = await fetch('/api/admin/users/export')
      if (!response.ok) throw new Error('Failed to export users')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error: any) {
      setError(error?.message || 'Failed to export users')
    }
  }

  const getPlanLabel = (status: string) => {
    if (status === 'premium') return 'Premium'
    if (status === 'cancelled') return 'Cancelled'
    return 'Free'
  }

  const getPlanPillClass = (status: string) => {
    if (status === 'premium') return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
    if (status === 'cancelled') return 'bg-amber-500/10 text-amber-600 border-amber-500/20'
    return 'bg-muted/50 text-muted-foreground border-border'
  }

  const getActivityDotClass = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500',
      moderate: 'bg-amber-500',
      inactive: 'bg-muted-foreground/40',
      dormant: 'bg-muted-foreground/40',
    }
    return map[status] || 'bg-muted-foreground/40'
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Users</h1>
          <p className="text-muted-foreground">Search and manage users.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleExport} variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[440px_1fr] gap-6 items-start">
        {/* Left pane: user list */}
        <Card className="shadow-none border overflow-hidden flex flex-col min-h-0 gap-0">
          <CardHeader className="pb-4">
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value)
                    setPage(0)
                  }}
                  placeholder="Search name or email"
                  className="pl-9 h-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Select
                  value={subscriptionFilter}
                  onValueChange={(value) => {
                    setSubscriptionFilter(value)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All plans</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select
                  value={activityFilter}
                  onValueChange={(value) => {
                    setActivityFilter(value)
                    setPage(0)
                  }}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Activity" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All activity</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="dormant">Dormant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-xs text-muted-foreground">Showing {users.length} of {total}</div>
            </div>
          </CardHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-6">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Activity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="py-4">
                      <div className="space-y-3">
                        {Array.from({ length: 8 }).map((_, i) => (
                          <div key={i} className="flex items-center gap-4">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-16" />
                            <Skeleton className="h-4 w-40" />
                          </div>
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={3} className="h-24 text-center text-sm text-muted-foreground">
                      No users found.
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((u) => {
                    const isSelected = selectedUserId === u.id
                    const isAdmin = adminEmails.has((u.email || '').toLowerCase())
                    return (
                      <TableRow
                        key={u.id}
                        onClick={() => {
                          setActiveTab('overview')
                          router.replace(`/admin-panel/users?id=${u.id}`)
                        }}
                        className={`cursor-pointer ${
                          isSelected ? 'bg-muted/50 hover:bg-muted/70' : 'hover:bg-muted/50'
                        }`}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-medium truncate">{u.full_name || 'No name'}</span>
                            {isAdmin && (
                              <Badge className="bg-muted text-muted-foreground border">Admin</Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground truncate">{u.email}</div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getPlanPillClass(u.subscription_status)}>
                            {getPlanLabel(u.subscription_status)}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-[180px]">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`h-2 w-2 shrink-0 rounded-full ${getActivityDotClass(u.activity_status)}`} />
                            <span className="text-xs text-muted-foreground truncate">
                              {u.last_reflection_date
                                ? `Last reflection ${formatDistanceToNow(new Date(u.last_reflection_date), { addSuffix: true })}`
                                : 'No reflections yet'}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-3 border-t bg-card">
              <div className="text-xs text-muted-foreground">Page {page + 1} of {totalPages}</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </Card>

        {/* Right pane: detail */}
        <Card className="shadow-none border overflow-hidden flex flex-col min-h-0">
          {!selectedUserId ? (
            <div className="flex-1 p-10 text-sm text-muted-foreground">Select a user to view details.</div>
          ) : detailLoading ? (
            <div className="flex-1 p-6 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailError ? (
            <div className="flex-1 p-6 text-sm text-destructive">{detailError}</div>
          ) : !selectedUserDetail ? (
            <div className="flex-1 p-6 text-sm text-muted-foreground">User not found.</div>
          ) : (
            <>
              <div className="px-6 py-5 border-b flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-lg font-semibold text-foreground truncate">
                    {selectedUserDetail.full_name || 'User'}
                  </h2>
                  <p className="text-sm text-muted-foreground truncate">{selectedUserDetail.email}</p>
                </div>
                <Link
                  href={`/admin-panel/users/${selectedUserDetail.id}`}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <ExternalLink className="h-4 w-4" />
                  Full record
                </Link>
              </div>

              <div className="px-6 py-4 flex-1 min-h-0 overflow-y-auto">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="min-h-0">
                  <TabsList className="bg-muted">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="subscription">Subscription</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                    <TabsTrigger value="record">Record</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Name</div>
                        <div className="text-sm text-foreground">{selectedUserDetail.full_name || '—'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Email</div>
                        <div className="text-sm text-foreground">{selectedUserDetail.email}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Plan</div>
                        <div className="text-sm text-foreground">{getPlanLabel(selectedUserDetail.subscription_status)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Created</div>
                        <div className="text-sm text-foreground">
                          {selectedUserRow?.signup_date
                            ? format(new Date(selectedUserRow.signup_date), 'MMM dd, yyyy')
                            : format(new Date(selectedUserDetail.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Reflections</div>
                        <div className="text-sm text-foreground">{selectedUserDetail.stats?.total_reflections ?? selectedUserRow?.total_reflections ?? 0}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-muted-foreground">Last reflection</div>
                        <div className="text-sm text-foreground">
                          {selectedUserRow?.last_reflection_date
                            ? formatDistanceToNow(new Date(selectedUserRow.last_reflection_date), { addSuffix: true })
                            : '—'}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="subscription" className="mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Plan</div>
                          <div className="text-sm text-foreground">{getPlanLabel(selectedUserDetail.subscription_status)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Billing cycle</div>
                          <div className="text-sm text-foreground">{selectedUserDetail.billing_cycle || '—'}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-muted-foreground">Stripe customer</div>
                        {selectedUserDetail.stripe_customer_id ? (
                          <a
                            href={`https://dashboard.stripe.com/customers/${selectedUserDetail.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-foreground underline underline-offset-4 hover:text-primary"
                          >
                            {selectedUserDetail.stripe_customer_id}
                          </a>
                        ) : (
                          <div className="text-sm text-muted-foreground">—</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Total prompts</div>
                          <div className="text-sm text-foreground">{selectedUserDetail.stats?.total_prompts ?? 0}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">Total reflections</div>
                          <div className="text-sm text-foreground">{selectedUserDetail.stats?.total_reflections ?? 0}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-foreground">Recent admin/system events</div>
                        <div className="mt-3 border rounded-lg overflow-hidden">
                          {logsLoading ? (
                            <div className="p-4 text-sm text-muted-foreground">Loading…</div>
                          ) : recentLogs.length === 0 ? (
                            <div className="p-4 text-sm text-muted-foreground">No recent events found.</div>
                          ) : (
                            <div className="divide-y divide-border">
                              {recentLogs.map((log) => (
                                <div key={log.id} className="px-4 py-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="text-sm text-foreground">
                                      {log.action_type.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs text-muted-foreground">{log.admin_email}</div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="record" className="mt-6">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-foreground">Open full user record</div>
                      <div className="text-sm text-muted-foreground">
                        Use the full record page for edit/delete operations.
                      </div>
                      <div>
                        <Link href={`/admin-panel/users/${selectedUserDetail.id}`} className="inline-flex">
                          <Button type="button" variant="outline">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open full record
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  )
}
