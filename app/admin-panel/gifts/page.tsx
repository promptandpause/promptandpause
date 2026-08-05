'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
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
import { ExternalLink } from 'lucide-react'
import { format } from 'date-fns'

type GiftStatus = 'pending' | 'redeemed' | 'expired' | 'refunded'

interface GiftRow {
  id: string
  purchaser_email: string
  purchaser_name: string | null
  recipient_email: string | null
  recipient_user_id: string | null
  duration_months: number
  amount_paid: number
  status: GiftStatus
  purchased_at: string
  redeemed_at: string | null
  expires_at: string
  redemption_token: string
  recipient?: { id: string; email: string | null; full_name: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  redeemed: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  expired: 'bg-muted text-muted-foreground border',
  refunded: 'bg-red-500/10 text-red-600 border-red-500/20',
}

function formatGBPFromPence(amountPaid: number) {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP',
  }).format((amountPaid || 0) / 100)
}

export default function GiftsAdminPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [gifts, setGifts] = useState<GiftRow[]>([])

  const [statusFilter, setStatusFilter] = useState<'all' | GiftStatus>('all')
  const [search, setSearch] = useState('')

  const [selectedGiftId, setSelectedGiftId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase()
    return gifts.filter((g) => {
      if (statusFilter !== 'all' && g.status !== statusFilter) return false
      if (!s) return true

      const haystack = [
        g.purchaser_email,
        g.purchaser_name,
        g.recipient_email,
        g.recipient?.email,
        g.redemption_token,
        g.status,
        String(g.duration_months),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return haystack.includes(s)
    })
  }, [gifts, search, statusFilter])

  const loadGifts = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({ limit: '200', offset: '0' })
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (search.trim()) params.set('search', search.trim())

      const res = await fetch(`/api/admin/gifts?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch gifts')
      }

      const data = await res.json()
      setGifts(data.gifts || [])
    } catch (err: any) {
      setError(err.message || 'Failed to load gifts')
    } finally {
      setLoading(false)
    }
  }, [search, statusFilter])

  useEffect(() => {
    loadGifts()
  }, [loadGifts])

  useEffect(() => {
    setSelectedGiftId(searchParams.get('id'))
  }, [searchParams])

  const selectedGift = useMemo(() => {
    if (!selectedGiftId) return null
    return gifts.find((g) => g.id === selectedGiftId) || null
  }, [gifts, selectedGiftId])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gifts</h1>
        <p className="text-muted-foreground">Operational view of gift purchases and redemption status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left pane: list */}
        <Card className="shadow-none border overflow-hidden p-0 gap-0">
          <div className="p-4 border-b space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search purchaser/recipient/token"
              />

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Unclaimed</SelectItem>
                  <SelectItem value="redeemed">Claimed</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}
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
                  <TableHead>Duration</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Buyer</TableHead>
                  <TableHead>Recipient</TableHead>
                  <TableHead>Purchased</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => {
                  const isSelected = selectedGiftId === g.id
                  return (
                    <TableRow
                      key={g.id}
                      className={`cursor-pointer ${isSelected ? 'bg-muted/50' : ''}`}
                      onClick={() => {
                        router.replace(`/admin-panel/gifts?id=${g.id}`)
                      }}
                    >
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[g.status]} border`}>{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-foreground">{g.duration_months}m</TableCell>
                      <TableCell className="text-foreground">{formatGBPFromPence(g.amount_paid)}</TableCell>
                      <TableCell className="text-foreground">{g.purchaser_email}</TableCell>
                      <TableCell className="text-foreground">{g.recipient_email || g.recipient?.email || '—'}</TableCell>
                      <TableCell className="text-muted-foreground">{format(new Date(g.purchased_at), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-muted-foreground">
                      No gifts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </Card>

        {/* Right pane: detail */}
        <Card className="shadow-none border overflow-hidden p-0 gap-0">
          {!selectedGiftId ? (
            <div className="p-10 text-sm text-muted-foreground">Select a gift to view details.</div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !selectedGift ? (
            <div className="p-6 text-sm text-muted-foreground">Gift not found.</div>
          ) : (
            <div>
              <div className="px-6 py-5 border-b">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-foreground truncate">Gift subscription</h2>
                    <p className="text-sm text-muted-foreground truncate">{selectedGift.purchaser_email}</p>
                  </div>
                  <Badge className={`${STATUS_COLORS[selectedGift.status]} border`}>{selectedGift.status}</Badge>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Amount</div>
                  <div className="text-sm text-foreground">{formatGBPFromPence(selectedGift.amount_paid)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Duration</div>
                  <div className="text-sm text-foreground">{selectedGift.duration_months} months</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Recipient</div>
                  <div className="text-sm text-foreground">
                    {selectedGift.recipient_email || selectedGift.recipient?.email || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Purchased</div>
                  <div className="text-sm text-foreground">{format(new Date(selectedGift.purchased_at), 'MMM dd, yyyy')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Expires</div>
                  <div className="text-sm text-foreground">{format(new Date(selectedGift.expires_at), 'MMM dd, yyyy')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Redeemed at</div>
                  <div className="text-sm text-foreground">
                    {selectedGift.redeemed_at ? format(new Date(selectedGift.redeemed_at), 'MMM dd, yyyy') : '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-muted-foreground">Redemption token</div>
                  <div className="text-sm text-foreground font-mono break-all">{selectedGift.redemption_token}</div>
                </div>

                {selectedGift.recipient?.id && (
                  <div className="pt-2">
                    <Link href={`/admin-panel/users?id=${selectedGift.recipient.id}`} className="inline-flex">
                      <Button type="button" variant="outline">
                        <ExternalLink className="h-4 w-4 mr-2" />
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
