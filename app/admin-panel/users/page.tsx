'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Search, Download, Eye, ChevronLeft, ChevronRight } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [subscriptionFilter, setSubscriptionFilter] = useState('all')
  const [activityFilter, setActivityFilter] = useState('all')
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const limit = 50

  useEffect(() => {
    loadUsers()
  }, [search, subscriptionFilter, activityFilter, page])

  async function loadUsers() {
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
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

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
      console.error('Error exporting users:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      premium: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30',
      freemium: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
      cancelled: 'bg-red-500/10 text-red-400 border-red-400/30',
    }
    return styles[status as keyof typeof styles] || styles.freemium
  }

  const getActivityBadge = (status: string) => {
    const styles = {
      active: 'bg-green-500/10 text-green-400 border-green-400/30',
      moderate: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
      inactive: 'bg-slate-500/10 text-slate-400 border-slate-400/30',
      dormant: 'bg-slate-500/10 text-slate-400 border-slate-400/30',
    }
    return styles[status as keyof typeof styles] || styles.inactive
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Users</h1>
          <p className="text-slate-400 mt-1">Manage and view all users</p>
        </div>
        <Button 
          onClick={handleExport}
          className="bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(0)
                }}
                className="pl-10 bg-slate-900 border-slate-700 text-white"
              />
            </div>
          </div>

          {/* Subscription Filter */}
          <Select 
            value={subscriptionFilter} 
            onValueChange={(value) => {
              setSubscriptionFilter(value)
              setPage(0)
            }}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Plans" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Plans</SelectItem>
              <SelectItem value="premium">Premium</SelectItem>
              <SelectItem value="freemium">Free</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>

          {/* Activity Filter */}
          <Select 
            value={activityFilter} 
            onValueChange={(value) => {
              setActivityFilter(value)
              setPage(0)
            }}
          >
            <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
              <SelectValue placeholder="All Activity" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Activity</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="moderate">Moderate</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="dormant">Dormant</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 text-sm text-slate-400">
          Showing {users.length} of {total} users
        </div>
      </Card>

      {/* Table */}
      <Card className="bg-slate-800/50 border-slate-700">
        <Table>
          <TableHeader>
            <TableRow className="border-slate-700 hover:bg-slate-800/50">
              <TableHead className="text-slate-300">User</TableHead>
              <TableHead className="text-slate-300">Plan</TableHead>
              <TableHead className="text-slate-300">Activity</TableHead>
              <TableHead className="text-slate-300">Reflections</TableHead>
              <TableHead className="text-slate-300">Engagement</TableHead>
              <TableHead className="text-slate-300">Last Active</TableHead>
              <TableHead className="text-slate-300">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 10 }).map((_, i) => (
                <TableRow key={i} className="border-slate-700">
                  <TableCell><Skeleton className="h-10 w-full bg-slate-700" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                  <TableCell><Skeleton className="h-6 w-20 bg-slate-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12 bg-slate-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16 bg-slate-700" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24 bg-slate-700" /></TableCell>
                  <TableCell><Skeleton className="h-8 w-20 bg-slate-700" /></TableCell>
                </TableRow>
              ))
            ) : users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-slate-400 py-8">
                  No users found
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => (
                <TableRow key={user.id} className="border-slate-700 hover:bg-slate-800/30">
                  <TableCell>
                    <div>
                      <div className="font-medium text-white">{user.full_name || 'No name'}</div>
                      <div className="text-sm text-slate-400">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusBadge(user.subscription_status)}>
                      {user.subscription_status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getActivityBadge(user.activity_status)}>
                      {user.activity_status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-white">
                    {user.total_reflections}
                  </TableCell>
                  <TableCell className="text-white">
                    {user.engagement_rate_percent.toFixed(0)}%
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {user.last_reflection_date 
                      ? formatDistanceToNow(new Date(user.last_reflection_date), { addSuffix: true })
                      : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin-panel/users/${user.id}`}>
                      <Button variant="ghost" size="sm" className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-4 border-t border-slate-700">
            <div className="text-sm text-slate-400">
              Page {page + 1} of {totalPages}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="border-slate-700 text-white hover:bg-slate-800"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  )
}
