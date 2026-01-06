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
import { createClient } from '@/lib/supabase/client'

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
  const [passwordForm, setPasswordForm] = useState({
    new_password: '',
    confirm_password: ''
  })
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    async function getUser() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) {
        setUserEmail(user.email)
      }
    }
    getUser()
  }, [])

  const loadProfile = useCallback(async () => {
    if (!userEmail) return

    try {
      setLoading(true)
      const response = await fetch('/api/admin/admin-users')
      
      if (!response.ok) {
        throw new Error('Failed to fetch profile')
      }
      
      const data = await response.json()
      const myProfile = data.users?.find((u: AdminProfile) => u.email === userEmail)
      
      if (myProfile) {
        setProfile(myProfile)
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast, userEmail])

  useEffect(() => {
    if (userEmail) {
      loadProfile()
    }
  }, [loadProfile, userEmail])

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
      super_admin: 'bg-purple-500/10 text-purple-400 border-purple-400/30',
      admin: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
      employee: 'bg-green-500/10 text-green-400 border-green-400/30',
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
        <div className="text-slate-400">Loading profile...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Profile not found</div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">My Profile</h1>
        <p className="text-slate-400">Manage your admin account settings</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your admin account details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-400 text-sm">Full Name</Label>
              <div className="text-white font-medium mt-1">{profile.full_name}</div>
            </div>
            <Separator className="bg-slate-800" />
            <div>
              <Label className="text-slate-400 text-sm flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <div className="text-white font-medium mt-1">{profile.email}</div>
              <p className="text-xs text-slate-500 mt-1">Email cannot be changed (contact super admin)</p>
            </div>
            <Separator className="bg-slate-800" />
            <div>
              <Label className="text-slate-400 text-sm flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Role
              </Label>
              <div className="mt-2">{getRoleBadge(profile.role)}</div>
            </div>
            {profile.department && (
              <>
                <Separator className="bg-slate-800" />
                <div>
                  <Label className="text-slate-400 text-sm">Department</Label>
                  <div className="text-white font-medium mt-1">{profile.department}</div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-slate-900 border-slate-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Account Activity
            </CardTitle>
            <CardDescription className="text-slate-400">
              Your account timeline
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-slate-400 text-sm flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Account Created
              </Label>
              <div className="text-white font-medium mt-1">
                {formatDistanceToNow(new Date(profile.created_at), { addSuffix: true })}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(profile.created_at).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </div>
            </div>
            <Separator className="bg-slate-800" />
            <div>
              <Label className="text-slate-400 text-sm">Last Login</Label>
              <div className="text-white font-medium mt-1">
                {profile.last_login_at 
                  ? formatDistanceToNow(new Date(profile.last_login_at), { addSuffix: true })
                  : 'Never'}
              </div>
              {profile.last_login_at && (
                <div className="text-xs text-slate-500 mt-1">
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
            <Separator className="bg-slate-800" />
            <div>
              <Label className="text-slate-400 text-sm">Account Status</Label>
              <div className="mt-2">
                <Badge variant="outline" className={profile.is_active ? 'bg-green-500/10 text-green-400 border-green-400/30' : 'bg-red-500/10 text-red-400 border-red-400/30'}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change Password
          </CardTitle>
          <CardDescription className="text-slate-400">
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-w-md">
            <div>
              <Label htmlFor="new_password" className="text-white">New Password</Label>
              <Input
                id="new_password"
                type="password"
                placeholder="Enter new password"
                value={passwordForm.new_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500 mt-1">Must be at least 8 characters long</p>
            </div>
            <div>
              <Label htmlFor="confirm_password" className="text-white">Confirm Password</Label>
              <Input
                id="confirm_password"
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm_password}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
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
        <Card className="bg-slate-900 border-slate-800 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-purple-400" />
              Super Admin Privileges
            </CardTitle>
            <CardDescription className="text-slate-400">
              You have full system access
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Full access to all admin panel features
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Can manage all admin users including other super admins
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Can update email addresses
              </li>
              <li className="flex items-center gap-2">
                <div className="h-1.5 w-1.5 rounded-full bg-purple-400" />
                Access to system settings and API management
              </li>
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
