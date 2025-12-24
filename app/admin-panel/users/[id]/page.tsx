'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { ArrowLeft, Edit2, Save, X, Trash2, Mail } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'
import { toast } from 'sonner'

interface UserDetail {
  id: string
  email: string
  full_name: string
  timezone: string
  language: string
  subscription_status: string
  stripe_customer_id: string
  billing_cycle: string
  created_at: string
  updated_at: string
  preferences: any
  stats: {
    total_prompts: number
    total_reflections: number
  }
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [user, setUser] = useState<UserDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    timezone: '',
    language: ''
  })

  useEffect(() => {
    loadUser()
  }, [id])

  async function loadUser() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${id}`)
      if (!response.ok) throw new Error('Failed to fetch user')
      
      const data = await response.json()
      setUser(data.data)
      setFormData({
        full_name: data.data.full_name || '',
        email: data.data.email || '',
        timezone: data.data.timezone || '',
        language: data.data.language || ''
      })
    } catch (error) {
      console.error('Error loading user:', error)
      toast.error('Failed to load user')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave() {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) throw new Error('Failed to update user')

      const data = await response.json()
      setUser(prev => prev ? { ...prev, ...data.data } : null)
      setEditing(false)
      toast.success('User updated successfully')
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error('Failed to update user')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })

      if (!response.ok) throw new Error('Failed to delete user')

      toast.success('User deleted successfully')
      router.push('/admin-panel/users')
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error('Failed to delete user')
    }
  }

  function handleCancel() {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        email: user.email || '',
        timezone: user.timezone || '',
        language: user.language || ''
      })
    }
    setEditing(false)
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-64 bg-slate-800" />
        <Skeleton className="h-96 bg-slate-800" />
      </div>
    )
  }

  if (!user) {
    return (
      <Card className="p-6 bg-red-500/10 border-red-500/20">
        <p className="text-red-400">User not found</p>
      </Card>
    )
  }

  const getStatusBadge = (status: string) => {
    const styles = {
      premium: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30',
      freemium: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
      cancelled: 'bg-red-500/10 text-red-400 border-red-400/30',
    }
    return styles[status as keyof typeof styles] || styles.freemium
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin-panel/users">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Users
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">{user.full_name || 'User'}</h1>
            <p className="text-slate-400 text-sm">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {!editing ? (
            <>
              <Button
                onClick={() => setEditing(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white"
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" className="border-red-500 text-red-400 hover:bg-red-500/10">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-slate-900 border-slate-700">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
                    <AlertDialogDescription className="text-slate-400">
                      Are you sure? This will permanently delete {user.full_name || user.email} and all their data. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel className="bg-slate-800 text-white border-slate-700">Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          ) : (
            <>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-green-500 hover:bg-green-600 text-white"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-slate-700 text-white"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">Overview</TabsTrigger>
          <TabsTrigger value="stats" className="data-[state=active]:bg-slate-700">Statistics</TabsTrigger>
          <TabsTrigger value="preferences" className="data-[state=active]:bg-slate-700">Preferences</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Basic Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-slate-400">Full Name</Label>
                {editing ? (
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                ) : (
                  <p className="text-white mt-1">{user.full_name || 'Not set'}</p>
                )}
              </div>
              <div>
                <Label className="text-slate-400">Email</Label>
                {editing ? (
                  <Input
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                    type="email"
                  />
                ) : (
                  <p className="text-white mt-1">{user.email}</p>
                )}
              </div>
              <div>
                <Label className="text-slate-400">Timezone</Label>
                {editing ? (
                  <Input
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                ) : (
                  <p className="text-white mt-1">{user.timezone || 'Not set'}</p>
                )}
              </div>
              <div>
                <Label className="text-slate-400">Language</Label>
                {editing ? (
                  <Input
                    value={formData.language}
                    onChange={(e) => setFormData({ ...formData, language: e.target.value })}
                    className="mt-1 bg-slate-900 border-slate-700 text-white"
                  />
                ) : (
                  <p className="text-white mt-1">{user.language || 'Not set'}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Subscription</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label className="text-slate-400">Status</Label>
                <div className="mt-1">
                  <Badge className={getStatusBadge(user.subscription_status)}>
                    {user.subscription_status}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-slate-400">Billing Cycle</Label>
                <p className="text-white mt-1">{user.billing_cycle || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-slate-400">Stripe Customer ID</Label>
                <p className="text-white mt-1 font-mono text-sm">{user.stripe_customer_id || 'N/A'}</p>
              </div>
              <div>
                <Label className="text-slate-400">Joined</Label>
                <p className="text-white mt-1">{format(new Date(user.created_at), 'PPP')}</p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Stats Tab */}
        <TabsContent value="stats" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <Label className="text-slate-400">Total Prompts</Label>
              <p className="text-3xl font-bold text-white mt-2">{user.stats.total_prompts}</p>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <Label className="text-slate-400">Total Reflections</Label>
              <p className="text-3xl font-bold text-white mt-2">{user.stats.total_reflections}</p>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700 p-6">
              <Label className="text-slate-400">Engagement Rate</Label>
              <p className="text-3xl font-bold text-white mt-2">
                {user.stats.total_prompts > 0 
                  ? ((user.stats.total_reflections / user.stats.total_prompts) * 100).toFixed(0)
                  : 0}%
              </p>
            </Card>
          </div>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-6">
          <Card className="bg-slate-800/50 border-slate-700 p-6">
            <h3 className="text-lg font-semibold text-white mb-4">User Preferences</h3>
            {user.preferences ? (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-slate-400">Notifications Enabled</Label>
                  <p className="text-white mt-1">{user.preferences.notifications_enabled ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Daily Reminders</Label>
                  <p className="text-white mt-1">{user.preferences.daily_reminders ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Weekly Digest</Label>
                  <p className="text-white mt-1">{user.preferences.weekly_digest ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Reminder Time</Label>
                  <p className="text-white mt-1">{user.preferences.reminder_time || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-slate-400">Prompt Frequency</Label>
                  <p className="text-white mt-1">{user.preferences.prompt_frequency || 'Not set'}</p>
                </div>
              </div>
            ) : (
              <p className="text-slate-400">No preferences set</p>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
