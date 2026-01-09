'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
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
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  redeemed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  expired: 'bg-neutral-50 text-neutral-700 border-neutral-200',
  refunded: 'bg-red-50 text-red-700 border-red-200',
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
    <div className="space-y-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">Gifts</h1>
        <p className="text-sm text-neutral-500">Operational view of gift purchases and redemption status.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-6">
        {/* Left pane: list */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-neutral-200 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search purchaser/recipient/token"
                className="bg-white border-neutral-200"
              />

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
                <SelectTrigger className="bg-white border-neutral-200">
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
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
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
                <TableRow className="border-neutral-200">
                  <TableHead className="text-neutral-500">Status</TableHead>
                  <TableHead className="text-neutral-500">Duration</TableHead>
                  <TableHead className="text-neutral-500">Amount</TableHead>
                  <TableHead className="text-neutral-500">Buyer</TableHead>
                  <TableHead className="text-neutral-500">Recipient</TableHead>
                  <TableHead className="text-neutral-500">Purchased</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((g) => {
                  const isSelected = selectedGiftId === g.id
                  return (
                    <TableRow
                      key={g.id}
                      className={`border-neutral-200 cursor-pointer ${isSelected ? 'bg-neutral-50' : ''}`}
                      onClick={() => {
                        router.replace(`/admin-panel/gifts?id=${g.id}`)
                      }}
                    >
                      <TableCell>
                        <Badge className={`${STATUS_COLORS[g.status]} border`}>{g.status}</Badge>
                      </TableCell>
                      <TableCell className="text-neutral-900">{g.duration_months}m</TableCell>
                      <TableCell className="text-neutral-900">{formatGBPFromPence(g.amount_paid)}</TableCell>
                      <TableCell className="text-neutral-900">{g.purchaser_email}</TableCell>
                      <TableCell className="text-neutral-900">{g.recipient_email || g.recipient?.email || '—'}</TableCell>
                      <TableCell className="text-neutral-700">{format(new Date(g.purchased_at), 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow className="border-neutral-200">
                    <TableCell colSpan={6} className="text-neutral-500">
                      No gifts found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </div>

        {/* Right pane: detail */}
        <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden">
          {!selectedGiftId ? (
            <div className="p-10 text-sm text-neutral-500">Select a gift to view details.</div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : !selectedGift ? (
            <div className="p-6 text-sm text-neutral-500">Gift not found.</div>
          ) : (
            <div>
              <div className="px-6 py-5 border-b border-neutral-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="text-lg font-semibold text-neutral-900 truncate">Gift subscription</h2>
                    <p className="text-sm text-neutral-500 truncate">{selectedGift.purchaser_email}</p>
                  </div>
                  <Badge className={`${STATUS_COLORS[selectedGift.status]} border`}>{selectedGift.status}</Badge>
                </div>
              </div>

              <div className="px-6 py-6 space-y-5">
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Amount</div>
                  <div className="text-sm text-neutral-900">{formatGBPFromPence(selectedGift.amount_paid)}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Duration</div>
                  <div className="text-sm text-neutral-900">{selectedGift.duration_months} months</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Recipient</div>
                  <div className="text-sm text-neutral-900">
                    {selectedGift.recipient_email || selectedGift.recipient?.email || '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Purchased</div>
                  <div className="text-sm text-neutral-900">{format(new Date(selectedGift.purchased_at), 'MMM dd, yyyy')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Expires</div>
                  <div className="text-sm text-neutral-900">{format(new Date(selectedGift.expires_at), 'MMM dd, yyyy')}</div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Redeemed at</div>
                  <div className="text-sm text-neutral-900">
                    {selectedGift.redeemed_at ? format(new Date(selectedGift.redeemed_at), 'MMM dd, yyyy') : '—'}
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-neutral-500">Redemption token</div>
                  <div className="text-sm text-neutral-900 font-mono break-all">{selectedGift.redemption_token}</div>
                </div>

                {selectedGift.recipient?.id && (
                  <div className="pt-2">
                    <Link href={`/admin-panel/users?id=${selectedGift.recipient.id}`} className="inline-flex">
                      <Button type="button" variant="outline" className="border-neutral-200 bg-white">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View user
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
