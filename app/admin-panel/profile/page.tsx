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
      super_admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
      admin: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
      employee: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
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
        <div className="text-muted-foreground">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{error || 'Profile not found'}</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-8 w-full max-w-5xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
        <p className="text-muted-foreground">Manage your admin account settings</p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription>
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">Full Name</Label>
              <div className="text-foreground font-medium mt-1">{profile.full_name}</div>
            </div>
            <Separator />
            <div>
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="text-foreground font-medium mt-1">{profile.email}</div>
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed (contact super admin)</p>
            </div>
            <Separator />
            <div>
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <div className="mt-2">{getRoleBadge(profile.role)}</div>
            </div>
            {profile.department && (
              <>
                <Separator />
                <div>
                  <Label className="text-sm text-muted-foreground">Department</Label>
                  <div className="text-foreground font-medium mt-1">{profile.department}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-none border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Activity
            </CardTitle>
            <CardDescription>
              Your account timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </Label>
              <div className="text-foreground font-medium mt-1">
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <Separator />
            <div>
              <Label className="text-sm text-muted-foreground">Last Login</Label>
              <div className="text-foreground font-medium mt-1">
                {profile.last_login_at 
                  ? formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true })
                  : 'Never'}
              </div>
              {profile.last_login_at && (
                <div className="text-xs text-muted-foreground mt-1">
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
            <Separator />
            <div>
              <Label className="text-sm text-muted-foreground">Account Status</Label>
              <div className="mt-2">
                <Badge
                  variant="outline"
                  className={
                    profile.is_active
                      ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                      : 'bg-red-500/10 text-red-600 border-red-500/20'
                  }
                >
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="new_password">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
              />
              <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters long</p>
            </div>
            <div>
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
              />
            </div>
            <Button 
              onClick={handleChangePassword}
              disabled={isChangingPassword || !passwordForm.new_password || !passwordForm.confirm_password}
            >
              {isChangingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {profile.role === 'super_admin' && (
        <Card className="shadow-none border-purple-500/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-600" />
              Super Admin Privileges
            </CardTitle>
            <CardDescription>
              You have full system access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Full access to all admin panel features
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Can manage all admin users including other super admins
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Can update email addresses
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                Access to system settings and API management
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
