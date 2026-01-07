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
    } catch (error) {
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
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
    } catch (error) {
    }
  }

  const getPlanLabel = (status: string) => {
    if (status === 'premium') return 'Premium'
    if (status === 'cancelled') return 'Cancelled'
    return 'Free'
  }

  const getPlanPillClass = (status: string) => {
    if (status === 'premium') return 'bg-neutral-900 text-white'
    if (status === 'cancelled') return 'bg-neutral-200 text-neutral-800'
    return 'bg-white text-neutral-800 border border-neutral-200'
  }

  const getActivityDotClass = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-emerald-500',
      moderate: 'bg-amber-500',
      inactive: 'bg-neutral-300',
      dormant: 'bg-neutral-300',
    }
    return map[status] || 'bg-neutral-300'
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Users</h1>
          <p className="text-sm text-neutral-500">Search and manage users.</p>
        </div>

        <Button onClick={handleExport} variant="outline" className="border-neutral-200 bg-white">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] gap-6">
        {/* Left pane: user list */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-200 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                placeholder="Search name or email"
                className="pl-9 bg-white border-neutral-200"
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
                <SelectTrigger className="bg-white border-neutral-200">
                  <SelectValue placeholder="Plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All plans</SelectItem>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="freemium">Free</SelectItem>
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
                <SelectTrigger className="bg-white border-neutral-200">
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

            <div className="text-xs text-neutral-500">Showing {users.length} of {total}</div>
          </div>

          <div className="divide-y divide-neutral-200">
            {loading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-3 w-64" />
                  </div>
                ))}
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-sm text-neutral-500">No users found.</div>
            ) : (
              users.map((u) => {
                const isSelected = selectedUserId === u.id
                const isAdmin = adminEmails.has((u.email || '').toLowerCase())
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => {
                      setActiveTab('overview')
                      router.replace(`/admin-panel/users?id=${u.id}`)
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-neutral-50 ${
                      isSelected ? 'bg-neutral-50' : 'bg-white'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-neutral-900 truncate">
                          {u.full_name || 'No name'}
                        </div>
                        <div className="text-xs text-neutral-500 truncate">{u.email}</div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${getActivityDotClass(u.activity_status)}`} />
                          <span className="text-xs text-neutral-500">
                            {u.last_reflection_date
                              ? `Last reflection ${formatDistanceToNow(new Date(u.last_reflection_date), { addSuffix: true })}`
                              : 'No reflections yet'}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        {isAdmin && (
                          <span className="text-[11px] px-2 py-1 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
                            Admin
                          </span>
                        )}
                        <span className={`text-[11px] px-2 py-1 rounded-full ${getPlanPillClass(u.subscription_status)}`}>
                          {getPlanLabel(u.subscription_status)}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-200 bg-white">
              <div className="text-xs text-neutral-500">Page {page + 1} of {totalPages}</div>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-neutral-200"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                >
                  Previous
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="border-neutral-200"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right pane: detail */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {!selectedUserId ? (
            <div className="p-10 text-sm text-neutral-500">
              Select a user to view details.
            </div>
          ) : detailLoading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : detailError ? (
            <div className="p-6 text-sm text-red-600">{detailError}</div>
          ) : !selectedUserDetail ? (
            <div className="p-6 text-sm text-neutral-500">User not found.</div>
          ) : (
            <div>
              <div className="px-6 py-5 border-b border-neutral-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-neutral-900 truncate">
                      {selectedUserDetail.full_name || 'User'}
                    </h2>
                    <p className="text-sm text-neutral-500 truncate">{selectedUserDetail.email}</p>
                  </div>
                  <Link
                    href={`/admin-panel/users/${selectedUserDetail.id}`}
                    className="inline-flex items-center gap-2 text-sm text-neutral-700 hover:text-neutral-900"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Full record
                  </Link>
                </div>
              </div>

              <div className="px-6 py-4">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                  <TabsList className="bg-neutral-100 border border-neutral-200">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-white">Overview</TabsTrigger>
                    <TabsTrigger value="subscription" className="data-[state=active]:bg-white">Subscription</TabsTrigger>
                    <TabsTrigger value="activity" className="data-[state=active]:bg-white">Activity</TabsTrigger>
                    <TabsTrigger value="record" className="data-[state=active]:bg-white">Record</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="mt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Name</div>
                        <div className="text-sm text-neutral-900">{selectedUserDetail.full_name || '—'}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Email</div>
                        <div className="text-sm text-neutral-900">{selectedUserDetail.email}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Plan</div>
                        <div className="text-sm text-neutral-900">{getPlanLabel(selectedUserDetail.subscription_status)}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Created</div>
                        <div className="text-sm text-neutral-900">
                          {selectedUserRow?.signup_date
                            ? format(new Date(selectedUserRow.signup_date), 'MMM dd, yyyy')
                            : format(new Date(selectedUserDetail.created_at), 'MMM dd, yyyy')}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Reflections</div>
                        <div className="text-sm text-neutral-900">{selectedUserDetail.stats?.total_reflections ?? selectedUserRow?.total_reflections ?? 0}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-xs text-neutral-500">Last reflection</div>
                        <div className="text-sm text-neutral-900">
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
                          <div className="text-xs text-neutral-500">Plan</div>
                          <div className="text-sm text-neutral-900">{getPlanLabel(selectedUserDetail.subscription_status)}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-neutral-500">Billing cycle</div>
                          <div className="text-sm text-neutral-900">{selectedUserDetail.billing_cycle || '—'}</div>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="text-xs text-neutral-500">Stripe customer</div>
                        {selectedUserDetail.stripe_customer_id ? (
                          <a
                            href={`https://dashboard.stripe.com/customers/${selectedUserDetail.stripe_customer_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-neutral-900 underline underline-offset-4"
                          >
                            {selectedUserDetail.stripe_customer_id}
                          </a>
                        ) : (
                          <div className="text-sm text-neutral-700">—</div>
                        )}
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="activity" className="mt-6">
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1">
                          <div className="text-xs text-neutral-500">Total prompts</div>
                          <div className="text-sm text-neutral-900">{selectedUserDetail.stats?.total_prompts ?? 0}</div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-neutral-500">Total reflections</div>
                          <div className="text-sm text-neutral-900">{selectedUserDetail.stats?.total_reflections ?? 0}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-sm font-medium text-neutral-900">Recent admin/system events</div>
                        <div className="mt-3 border border-neutral-200 rounded-lg overflow-hidden">
                          {logsLoading ? (
                            <div className="p-4 text-sm text-neutral-500">Loading…</div>
                          ) : recentLogs.length === 0 ? (
                            <div className="p-4 text-sm text-neutral-500">No recent events found.</div>
                          ) : (
                            <div className="divide-y divide-neutral-200">
                              {recentLogs.map((log) => (
                                <div key={log.id} className="px-4 py-3">
                                  <div className="flex items-center justify-between gap-4">
                                    <div className="text-sm text-neutral-900">
                                      {log.action_type.replace(/_/g, ' ')}
                                    </div>
                                    <div className="text-xs text-neutral-500">
                                      {format(new Date(log.created_at), 'MMM dd, yyyy HH:mm')}
                                    </div>
                                  </div>
                                  <div className="mt-1 text-xs text-neutral-500">{log.admin_email}</div>
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
                      <div className="text-sm font-medium text-neutral-900">Open full user record</div>
                      <div className="text-sm text-neutral-500">
                        Use the full record page for edit/delete operations.
                      </div>
                      <div>
                        <Link href={`/admin-panel/users/${selectedUserDetail.id}`} className="inline-flex">
                          <Button type="button" variant="outline" className="border-neutral-200 bg-white">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open full record
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
