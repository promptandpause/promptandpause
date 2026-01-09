'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { User, Mail, Shield, Calendar, Clock, Lock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface AdminProfile {
  id: string
  user_id: string
  email: string
  full_name: string
  role: 'super_admin' | 'admin' | 'employee'
  department?: string
  is_active: boolean
  created_at: string
  last_login_at?: string
}

export default function AdminProfilePage() {
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const { toast } = useToast()

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/admin-users/me')
      
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch profile')
      }
      
      const data = await response.json()
      setProfile(data.user || null)
    } catch (error: any) {
      setProfile(null)
      setError(error?.message || 'Failed to load profile')
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadProfile()
  }, [loadProfile])

  async function handleChangePassword() {
    if (!profile) return

    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast({
        title: 'Error',
        description: 'Passwords do not match',
        variant: 'destructive'
      })
      return
    }

    if (passwordForm.new_password.length < 8) {
      toast({
        title: 'Error',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsChangingPassword(true)
      const response = await fetch(`/api/admin/admin-users/${profile.user_id}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ new_password: passwordForm.new_password })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password')
      }

      toast({
        title: 'Success',
        description: 'Password changed successfully'
      })

      setPasswordForm({ new_password: '', confirm_password: '' })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsChangingPassword(false)
    }
  }

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
      admin: 'bg-blue-50 text-blue-700 border-blue-200',
      employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      employee: 'Employee',
    }
    return (
      <Badge variant="outline" className={styles[role as keyof typeof styles]}>
        {labels[role as keyof typeof labels]}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">{error || 'Profile not found'}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6 w-full max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-semibold text-neutral-900">My Profile</h1>
        <p className="text-sm text-neutral-500">Manage your admin account settings</p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-white border-neutral-200">
          <CardHeader>
            <CardTitle className="text-neutral-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-neutral-500 text-sm">Full Name</Label>
              <div className="text-neutral-900 font-medium mt-1">{profile.full_name}</div>
            </div>
            <Separator className="bg-neutral-200" />
            <div>
              <Label className="text-neutral-500 text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="text-neutral-900 font-medium mt-1">{profile.email}</div>
              <p className="text-xs text-neutral-500 mt-1">Email cannot be changed (contact super admin)</p>
            </div>
            <Separator className="bg-neutral-200" />
            <div>
              <Label className="text-neutral-500 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <div className="mt-2">{getRoleBadge(profile.role)}</div>
            </div>
            {profile.department && (
              <>
                <Separator className="bg-neutral-200" />
                <div>
                  <Label className="text-neutral-500 text-sm">Department</Label>
                  <div className="text-neutral-900 font-medium mt-1">{profile.department}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-white border-neutral-200">
          <CardHeader>
            <CardTitle className="text-neutral-900 flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Activity
            </CardTitle>
            <CardDescription className="text-neutral-500">
              Your account timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-neutral-500 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </Label>
              <div className="text-neutral-900 font-medium mt-1">
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </div>
              <div className="text-xs text-neutral-500 mt-1">
                {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <Separator className="bg-neutral-200" />
            <div>
              <Label className="text-neutral-500 text-sm">Last Login</Label>
              <div className="text-neutral-900 font-medium mt-1">
                {profile.last_login_at 
                  ? formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true })
                  : 'Never'}
              </div>
              {profile.last_login_at && (
                <div className="text-xs text-neutral-500 mt-1">
                  {new Date(profile.last_login_at).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              )}
            </div>
            <Separator className="bg-neutral-200" />
            <div>
              <Label className="text-neutral-500 text-sm">Account Status</Label>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={
                    profile.is_active
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-red-50 text-red-700 border-red-200'
                  }
                >
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white border-neutral-200">
        <CardHeader>
          <CardTitle className="text-neutral-900 flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription className="text-neutral-500">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="new_password" className="text-neutral-900">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="bg-white border-neutral-200 text-neutral-900"
              />
              <p className="text-xs text-neutral-500 mt-1">Must be at least 8 characters long</p>
            </div>
            <div>
              <Label htmlFor="confirm_password" className="text-neutral-900">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="bg-white border-neutral-200 text-neutral-900"
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordForm.new_password || !passwordForm.confirm_password}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile.role === 'super_admin' && (
        <Card className="bg-white border-neutral-200 border-purple-200">
          <CardHeader>
            <CardTitle className="text-neutral-900 flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-700" />
              Super Admin Privileges
            </CardTitle>
            <CardDescription className="text-neutral-500">
              You have full system access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-neutral-700">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-700" />
                Full access to all admin panel features
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-700" />
                Can manage all admin users including other super admins
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-700" />
                Can update email addresses
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-700" />
                Access to system settings and API management
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
