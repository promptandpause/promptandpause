'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { format } from 'date-fns'
import Link from 'next/link'
import { ExternalLink } from 'lucide-react'

type DiscountType = 'student' | 'nhs'
type BillingCycle = 'monthly' | 'yearly'

type InvitationStatus = 'pending' | 'completed' | 'expired' | 'cancelled'

interface DiscountInvitationRow {
  id: string
  user_id: string
  admin_id: string
  discount_type: DiscountType
  billing_cycle: BillingCycle
  stripe_checkout_session_id: string | null
  stripe_checkout_url: string | null
  status: InvitationStatus
  expires_at: string
  created_at: string
  completed_at: string | null
  notes: string | null
  user?: { id: string; email: string | null; full_name: string | null }
  admin?: { id: string; email: string | null; full_name: string | null }
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  completed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  expired: 'bg-muted text-muted-foreground border',
  cancelled: 'bg-red-500/10 text-red-600 border-red-500/20',
}

export default function DiscountsAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [listError, setListError] = useState<string | null>(null)
  const [inviteError, setInviteError] = useState<string | null>(null)
  const [inviteSuccess, setInviteSuccess] = useState<string | null>(null)

  const [invitations, setInvitations] = useState<DiscountInvitationRow[]>([])

  // Invite form
  const [userIdentifier, setUserIdentifier] = useState('')
  const [discountType, setDiscountType] = useState<DiscountType>('student')
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const [notes, setNotes] = useState('')

  // Table filters
  const [statusFilter, setStatusFilter] = useState<'all' | InvitationStatus>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | DiscountType>('all')
  const [search, setSearch] = useState('')

  const [selectedInvitationId, setSelectedInvitationId] = useState<string | null>(null)

  const filteredInvitations = useMemo(() => {
    const s = search.trim().toLowerCase()

    return invitations.filter((inv) => {
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (typeFilter !== 'all' && inv.discount_type !== typeFilter) return false

      if (!s) return true
      const haystack = [
        inv.user?.email,
        inv.user?.full_name,
        inv.admin?.email,
        inv.discount_type,
        inv.billing_cycle,
        inv.status,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(s)
    })
  }, [invitations, search, statusFilter, typeFilter])

  const loadInvitations = useCallback(async () => {
    try {
      setLoading(true)
      setListError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (typeFilter !== 'all') params.set('discount_type', typeFilter)

      const res = await fetch(`/api/admin/discounts/invitations?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch invitations')
      }

      const data = await res.json()
      setInvitations(data.invitations || [])
    } catch (err: any) {
      setListError(err.message || 'Failed to load invitations')
    } finally {
      setLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    loadInvitations()
  }, [loadInvitations])

  useEffect(() => {
    setSelectedInvitationId(searchParams.get('id'))
  }, [searchParams])

  const selectedInvitation = useMemo(() => {
    if (!selectedInvitationId) return null
    return invitations.find((inv) => inv.id === selectedInvitationId) || null
  }, [invitations, selectedInvitationId])

  async function handleSendInvite() {
    try {
      setSubmitting(true)
      setInviteError(null)
      setInviteSuccess(null)

      const identifier = userIdentifier.trim()
      if (!identifier) {
        setInviteError('Enter a user UUID or email')
        return
      }

      // Prefer UUID if it looks like one; otherwise resolve via admin users API search
      let userId = identifier
      const looksLikeUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier)

      if (!looksLikeUuid) {
        const usersRes = await fetch(`/api/admin/users?limit=10&offset=0&search=${encodeURIComponent(identifier)}`)
        if (!usersRes.ok) {
          const usersErr = await usersRes.json().catch(() => null)
          throw new Error(usersErr?.error || 'Failed to resolve user by email')
        }
        const usersData = await usersRes.json()
        const match = (usersData?.data || []).find((u: any) => (u.email || '').toLowerCase() === identifier.toLowerCase())
        if (!match?.id) throw new Error('No user found with that email')
        userId = match.id
      }

      const res = await fetch('/api/admin/discounts/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          discount_type: discountType,
          billing_cycle: billingCycle,
          notes: notes.trim() || undefined,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || 'Failed to send invitation')
      }

      setInviteSuccess('Discount invite sent.')
      setUserIdentifier('')
      setNotes('')
      await loadInvitations()
    } catch (err: any) {
      setInviteError(err.message || 'Failed to send invitation')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Discounts</h1>
        <p className="text-muted-foreground">Send Student/NHS checkout links and track redemption status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left pane: create + list */}
        <div className="space-y-6">
          <Card className="shadow-none border overflow-hidden p-0 gap-0">
            <div className="p-4 border-b">
              <div className="text-sm font-medium text-foreground">Send discount invite</div>
            </div>

            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground">User UUID or email</div>
                  <Input
                    value={userIdentifier}
                    onChange={(e) => setUserIdentifier(e.target.value)}
                    placeholder="user uuid or email"
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Type</div>
                    <Select value={discountType} onValueChange={(v) => setDiscountType(v as DiscountType)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="student">Student</SelectItem>
                        <SelectItem value="nhs">NHS</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <div className="text-xs text-muted-foreground">Billing cycle</div>
                    <Select value={billingCycle} onValueChange={(v) => setBillingCycle(v as BillingCycle)}>
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Cycle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="md:col-span-2">
                  <div className="text-xs text-muted-foreground">Notes (optional)</div>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Internal note"
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Button onClick={handleSendInvite} disabled={submitting}>
                  {submitting ? 'Sending…' : 'Send invite'}
                </Button>

                {inviteError && <span className="text-sm text-destructive">{inviteError}</span>}
                {inviteSuccess && <span className="text-sm text-emerald-600">{inviteSuccess}</span>}
              </div>
            </div>
          </Card>

          <Card className="shadow-none border overflow-hidden p-0 gap-0">
            <div className="p-4 border-b space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-sm font-medium text-foreground">Invitations</div>
                  <div className="text-xs text-muted-foreground">Showing {filteredInvitations.length} invitations</div>
                </div>
              </div>

              {listError && (
                <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {listError}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-[1fr_180px_180px] gap-3">
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search"
                />

                <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All types</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="nhs">NHS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {loading ? (
              <div className="p-4 space-y-2">
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
                <Skeleton className="h-10" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Cycle</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Expires</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInvitations.map((inv) => {
                    const isSelected = selectedInvitationId === inv.id
                    return (
                      <TableRow
                        key={inv.id}
                        className={`cursor-pointer ${isSelected ? 'bg-muted/50' : ''}`}
                        onClick={() => {
                          router.replace(`/admin-panel/discounts?id=${inv.id}`)
                        }}
                      >
                        <TableCell>
                          <Badge className={`${STATUS_COLORS[inv.status]} border`}>{inv.status}</Badge>
                        </TableCell>
                        <TableCell className="text-foreground">{inv.discount_type}</TableCell>
                        <TableCell className="text-foreground">{inv.user?.email || inv.user_id}</TableCell>
                        <TableCell className="text-foreground">{inv.billing_cycle}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(inv.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(inv.expires_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {filteredInvitations.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-muted-foreground">
                        No invitations found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </Card>
        </div>

        {/* Right pane: detail */}
        <Card className="shadow-none border overflow-hidden p-0 gap-0">
          {!selectedInvitationId ? (
            <div className="p-10 text-sm text-muted-foreground">Select an invitation to view details.</div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !selectedInvitation ? (
            <div className="p-6 text-sm text-muted-foreground">Invitation not found.</div>
          ) : (
            <div>
              <div className="px-6 py-5 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground truncate">
                      {selectedInvitation.user?.full_name || selectedInvitation.user?.email || 'Invitation'}
                    </h2>
                    <p className="text-sm text-muted-foreground truncate">{selectedInvitation.user?.email || selectedInvitation.user_id}</p>
                  </div>
                  <Badge className={`${STATUS_COLORS[selectedInvitation.status]} border`}>{selectedInvitation.status}</Badge>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Discount type</div>
                  <div className="text-sm text-foreground">{selectedInvitation.discount_type}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Billing cycle</div>
                  <div className="text-sm text-foreground">{selectedInvitation.billing_cycle}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Created</div>
                  <div className="text-sm text-foreground">{format(new Date(selectedInvitation.created_at), 'MMM dd, yyyy HH:mm')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Expires</div>
                  <div className="text-sm text-foreground">{format(new Date(selectedInvitation.expires_at), 'MMM dd, yyyy HH:mm')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Admin</div>
                  <div className="text-sm text-foreground">{selectedInvitation.admin?.email || selectedInvitation.admin_id}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Checkout link</div>
                  {selectedInvitation.stripe_checkout_url ? (
                    <a
                      href={selectedInvitation.stripe_checkout_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-foreground underline underline-offset-4"
                    >
                      <ExternalLink className="h-4 w-4" />
                      Open
                    </a>
                  ) : (
                    <div className="text-sm text-muted-foreground">—</div>
                  )}
                </div>
                {selectedInvitation.notes && (
                  <div className="space-y-1">
                    <div className="text-xs text-muted-foreground">Notes</div>
                    <div className="text-sm text-foreground whitespace-pre-wrap">{selectedInvitation.notes}</div>
                  </div>
                )}
                {selectedInvitation.user?.id && (
                  <div className="pt-2">
                    <Link href={`/admin-panel/users?id=${selectedInvitation.user.id}`} className="inline-flex">
                      <Button type="button" variant="outline">
                        View user
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
