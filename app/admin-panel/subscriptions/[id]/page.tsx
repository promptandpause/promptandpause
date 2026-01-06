'use client'

import { useCallback, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  CreditCard, 
  Calendar, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Crown
} from 'lucide-react'
import { format } from 'date-fns'
import Link from 'next/link'

interface Subscription {
  id: string
  email: string
  full_name: string | null
  subscription_status: string
  subscription_id: string | null
  stripe_customer_id: string | null
  billing_cycle: string
  subscription_end_date: string | null
  created_at: string
  updated_at: string
}

interface SubscriptionEvent {
  id: string
  event_type: string
  old_status: string | null
  new_status: string
  created_at: string
  metadata: any
}

const STATUS_COLORS: Record<string, string> = {
  freemium: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
  premium: 'bg-green-500/10 text-green-400 border-green-400/30',
  cancelled: 'bg-red-500/10 text-red-400 border-red-400/30',
}

const EVENT_COLORS: Record<string, string> = {
  created: 'text-green-400',
  upgraded: 'text-green-400',
  downgraded: 'text-yellow-400',
  cancelled: 'text-red-400',
  renewed: 'text-blue-400',
  payment_failed: 'text-red-400',
  reactivated: 'text-green-400',
  admin_update: 'text-purple-400',
}

export default function SubscriptionDetailPage() {
  const params = useParams()
  const router = useRouter()
  const userId = params.id as string

  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [events, setEvents] = useState<SubscriptionEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [newCycle, setNewCycle] = useState('')
  const [giftTrialMonths, setGiftTrialMonths] = useState<number>(1)

  const loadSubscription = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/subscriptions/${userId}`)
      if (!response.ok) throw new Error('Failed to fetch subscription')

      const data = await response.json()
      setSubscription(data.subscription)
      setEvents(data.events)
      setNewStatus(data.subscription.subscription_status)
      // ✅ FIX: Default to 'monthly' if billing_cycle is null
      setNewCycle(data.subscription.billing_cycle || 'monthly')
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    loadSubscription()
  }, [loadSubscription])

  async function handleUpdate() {
    if (!subscription) return

    const updates: any = {}
    if (newStatus !== subscription.subscription_status) {
      updates.subscription_status = newStatus
    }
    if (newCycle !== subscription.billing_cycle) {
      updates.billing_cycle = newCycle
    }

    // ✅ FIX: When upgrading to premium, ALWAYS set billing_cycle and subscription_end_date
    if (newStatus === 'premium' && subscription.subscription_status !== 'premium') {
      // Ensure billing_cycle is set (default to monthly if somehow not set)
      if (!updates.billing_cycle) {
        updates.billing_cycle = newCycle || 'monthly'
      }
      
      const endDate = new Date()
      // Set end date based on billing cycle
      if (updates.billing_cycle === 'yearly' || newCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1) // 1 year from now
      } else {
        endDate.setMonth(endDate.getMonth() + 1) // 1 month from now
      }
      updates.subscription_end_date = endDate.toISOString()
    }

    // When downgrading from premium, clear subscription_end_date
    if (newStatus !== 'premium' && subscription.subscription_status === 'premium') {
      updates.subscription_end_date = null
    }

    if (Object.keys(updates).length === 0) {
      alert('No changes to update')
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update subscription')
      }

      const result = await response.json()
      loadSubscription()
    } catch (error) {
      alert(`Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdating(false)
    }
  }

  async function handleGiftTrial() {
    if (!subscription) return

    if (!confirm(`Gift ${giftTrialMonths} month${giftTrialMonths > 1 ? 's' : ''} of Premium access to this user?`)) {
      return
    }

    try {
      setUpdating(true)
      
      // Calculate trial end date
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + giftTrialMonths)

      const response = await fetch(`/api/admin/subscriptions/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subscription_status: 'premium',
          billing_cycle: 'gift_trial', // Mark as gift trial
          subscription_end_date: endDate.toISOString(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to gift trial')
      }

      alert(`Successfully gifted ${giftTrialMonths} month${giftTrialMonths > 1 ? 's' : ''} Premium trial!`)
      loadSubscription()
    } catch (error) {
      alert(`Failed to gift trial: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUpdating(false)
    }
  }

  async function handleCancel() {
    if (!subscription) return

    const reason = prompt('Enter cancellation reason (optional):')
    if (reason === null) return // User cancelled the prompt

    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return
    }

    try {
      setUpdating(true)
      const response = await fetch(`/api/admin/subscriptions/${userId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      })

      if (!response.ok) throw new Error('Failed to cancel subscription')

      alert('Subscription cancelled successfully')
      loadSubscription()
    } catch (error) {
      alert('Failed to cancel subscription')
    } finally {
      setUpdating(false)
    }
  }

  function getStatusColor(status: string): string {
    return STATUS_COLORS[status] || 'bg-slate-500/10 text-slate-400 border-slate-400/30'
  }

  function getEventColor(eventType: string): string {
    return EVENT_COLORS[eventType] || 'text-slate-400'
  }

  function getEventIcon(eventType: string) {
    switch (eventType) {
      case 'created':
      case 'upgraded':
      case 'reactivated':
        return <CheckCircle className="h-4 w-4" />
      case 'cancelled':
      case 'payment_failed':
        return <XCircle className="h-4 w-4" />
      case 'renewed':
        return <Calendar className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  if (!subscription) {
    return (
      <div className="space-y-6">
        <Link href="/admin-panel/subscriptions">
          <Button variant="ghost" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Subscriptions
          </Button>
        </Link>
        <Card className="p-6 bg-red-500/10 border-red-500/20">
          <p className="text-red-400">Subscription not found</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Link href="/admin-panel/subscriptions">
            <Button variant="ghost" className="text-slate-400 hover:text-white -ml-4 mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Subscriptions
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-white">Subscription Details</h1>
          <p className="text-slate-400">{subscription.email}</p>
        </div>
        <Badge className={`${getStatusColor(subscription.subscription_status)} border text-lg px-4 py-2 capitalize`}>
          {subscription.subscription_status}
        </Badge>
      </div>

      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="manage">Manage</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {/* ✅ ADDED: Show UUID */}
              <div className="md:col-span-2">
                <p className="text-sm text-slate-400">Supabase UUID</p>
                <div className="flex items-center gap-2">
                  <p className="text-white font-mono text-xs bg-slate-900 px-3 py-2 rounded border border-slate-700">
                    {subscription.id}
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                    onClick={() => {
                      navigator.clipboard.writeText(subscription.id)
                      alert('UUID copied to clipboard!')
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
              <div>
                <p className="text-sm text-slate-400">User Name</p>
                <p className="text-white font-medium">{subscription.full_name || 'No name'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Email</p>
                <p className="text-white font-medium">{subscription.email}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Status</p>
                <Badge className={`${getStatusColor(subscription.subscription_status)} border mt-1 capitalize`}>
                  {subscription.subscription_status}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-slate-400">Billing Cycle</p>
                <p className="text-white font-medium capitalize">{subscription.billing_cycle}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Stripe Customer ID</p>
                <p className="text-white font-mono text-sm">{subscription.stripe_customer_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Stripe Subscription ID</p>
                <p className="text-white font-mono text-sm">{subscription.subscription_id || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Subscribed Since</p>
                <p className="text-white font-medium">
                  {format(new Date(subscription.created_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Subscription End Date</p>
                <p className="text-white font-medium">
                  {subscription.subscription_end_date 
                    ? format(new Date(subscription.subscription_end_date), 'MMM dd, yyyy HH:mm')
                    : 'No end date'
                  }
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-400">Last Updated</p>
                <p className="text-white font-medium">
                  {format(new Date(subscription.updated_at), 'MMM dd, yyyy HH:mm')}
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription History</h3>
            {events.length === 0 ? (
              <p className="text-slate-400 text-center py-8">No subscription events found</p>
            ) : (
              <div className="space-y-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <div className={`mt-1 ${getEventColor(event.event_type)}`}>
                      {getEventIcon(event.event_type)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <p className={`font-medium ${getEventColor(event.event_type)} capitalize`}>
                          {event.event_type.replace(/_/g, ' ')}
                        </p>
                        <p className="text-xs text-slate-500">
                          {format(new Date(event.created_at), 'MMM dd, yyyy HH:mm')}
                        </p>
                      </div>
                      <p className="text-sm text-slate-400">
                        {event.old_status && (
                          <span>
                            From <span className="text-slate-300 capitalize">{event.old_status}</span> to{' '}
                          </span>
                        )}
                        <span className="text-slate-300 capitalize">{event.new_status}</span>
                      </p>
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-blue-400 cursor-pointer hover:text-blue-300">
                            View metadata
                          </summary>
                          <pre className="mt-2 text-xs bg-slate-950 p-2 rounded border border-slate-700 overflow-x-auto">
                            {JSON.stringify(event.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </TabsContent>

        {/* Manage Tab */}
        <TabsContent value="manage" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Update Subscription</h3>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Subscription Status</label>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Billing Cycle</label>
                <Select value={newCycle} onValueChange={setNewCycle}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={handleUpdate}
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                {updating ? 'Updating...' : 'Update Subscription'}
              </Button>
            </div>
          </Card>

          {/* ✅ NEW: Gift Trial Feature */}
          <Card className="bg-slate-800/50 border-yellow-500/20 p-6">
            <h3 className="text-lg font-semibold text-yellow-400 mb-2 flex items-center gap-2">
              <Crown className="h-5 w-5" />
              Gift Premium Trial
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Give this user free Premium access for a specific period. No Stripe subscription required.
            </p>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Trial Duration</label>
                <Select value={giftTrialMonths.toString()} onValueChange={(val) => setGiftTrialMonths(parseInt(val))}>
                  <SelectTrigger className="bg-slate-900 border-slate-700 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Month</SelectItem>
                    <SelectItem value="3">3 Months</SelectItem>
                    <SelectItem value="6">6 Months</SelectItem>
                    <SelectItem value="12">12 Months (1 Year)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                onClick={handleGiftTrial}
                disabled={updating}
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                {updating ? 'Gifting...' : `Gift ${giftTrialMonths} Month${giftTrialMonths > 1 ? 's' : ''} Premium`}
              </Button>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-red-500/20 p-6">
            <h3 className="text-lg font-semibold text-red-400 mb-2 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Danger Zone
            </h3>
            <p className="text-sm text-slate-400 mb-4">
              Cancelling a subscription will immediately revoke premium access. This action cannot be undone.
            </p>
            <Button
              onClick={handleCancel}
              disabled={updating || subscription.subscription_status === 'cancelled'}
              variant="destructive"
              className="w-full"
            >
              {updating ? 'Cancelling...' : 'Cancel Subscription'}
            </Button>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
