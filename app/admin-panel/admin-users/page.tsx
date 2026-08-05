'use client'

import { useCallback, useEffect, useState } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building2, Edit, Mail, Search, Shield, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { useToast } from '@/hooks/use-toast'

interface AdminUser {
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

interface CurrentAdmin {
  user_id: string
  email: string
  role: 'super_admin' | 'admin' | 'employee'
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [currentAdmin, setCurrentAdmin] = useState<CurrentAdmin | null>(null)
  const [meLoading, setMeLoading] = useState(true)
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null)
  const { toast } = useToast()

  const canManageAdminUsers = currentAdmin?.role === 'super_admin' || currentAdmin?.role === 'admin'
  const isSuperAdmin = currentAdmin?.role === 'super_admin'

  // Create form state
  const [createForm, setCreateForm] = useState({
    email: '',
    full_name: '',
    role: 'admin' as 'super_admin' | 'admin' | 'employee',
    department: ''
  })

  // Edit form state
  const [editForm, setEditForm] = useState({
    full_name: '',
    role: 'admin' as 'super_admin' | 'admin' | 'employee',
    department: '',
    is_active: true
  })

  const loadMe = useCallback(async () => {
    try {
      setMeLoading(true)
      setError(null)
      const res = await fetch('/api/admin/admin-users/me')
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load admin profile')
      }

      const data = await res.json()
      setCurrentAdmin(data.user || null)
    } catch (err: any) {
      setCurrentAdmin(null)
      setError(err?.message || 'Failed to load admin profile')
    } finally {
      setMeLoading(false)
    }
  }, [])

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/admin-users')
      
      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch admin users')
      }
      
      const data = await response.json()
      setUsers(data.users || [])
    } catch (error: any) {
      setError(error?.message || 'Failed to load admin users')
      toast({
        title: 'Error',
        description: error?.message || 'Failed to load admin users',
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  useEffect(() => {
    loadMe()
  }, [loadMe])

  useEffect(() => {
    if (meLoading) return
    if (!canManageAdminUsers) return
    loadUsers()
  }, [canManageAdminUsers, loadUsers, meLoading])

  async function handleCreateUser() {
    try {
      const response = await fetch('/api/admin/admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(createForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user')
      }

      toast({
        title: 'Success',
        description: data.message || 'Admin user created successfully'
      })

      setIsCreateDialogOpen(false)
      setCreateForm({
        email: '',
        full_name: '',
        role: 'admin',
        department: ''
      })
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  async function handleUpdateUser() {
    if (!selectedUser) return

    try {
      const response = await fetch(`/api/admin/admin-users/${selectedUser.user_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update admin user')
      }

      toast({
        title: 'Success',
        description: 'Admin user updated successfully'
      })

      setIsEditDialogOpen(false)
      setSelectedUser(null)
      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    }
  }

  const [deactivateConfirmOpen, setDeactivateConfirmOpen] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState<AdminUser | null>(null)

  async function handleDeactivateUser(user: AdminUser) {
    setUserToDeactivate(user)
    setDeactivateConfirmOpen(true)
  }

  async function confirmDeactivate() {
    if (!userToDeactivate) return

    try {
      if (currentAdmin?.user_id && currentAdmin.user_id === userToDeactivate.user_id) {
        throw new Error('You cannot deactivate your own admin account')
      }

      const response = await fetch(`/api/admin/admin-users/${userToDeactivate.user_id}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to deactivate admin user')
      }

      toast({
        title: 'Success',
        description: 'Admin user deactivated successfully'
      })

      loadUsers()
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setDeactivateConfirmOpen(false)
      setUserToDeactivate(null)
    }
  }

  function openEditDialog(user: AdminUser) {
    setSelectedUser(user)
    setEditForm({
      full_name: user.full_name,
      role: user.role,
      department: user.department || '',
      is_active: user.is_active
    })
    setIsEditDialogOpen(true)
  }

  const roleLabels: Record<string, string> = {
    super_admin: 'Super Admin',
    admin: 'Admin',
    employee: 'Employee',
  }

  const getRoleBadge = (role: string) => (
    <Badge variant="outline" className="font-normal">
      {roleLabels[role] || role}
    </Badge>
  )

  const getInitials = (name: string) =>
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() || '')
      .join('') || '?'

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.full_name.toLowerCase().includes(search.toLowerCase())
  )

  if (meLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading…</div>
      </div>
    )
  }

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">{error || 'Unable to load admin profile'}</div>
      </div>
    )
  }

  if (!canManageAdminUsers) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">Manage staff access and permission levels.</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don’t have permission to manage admin users.
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Users</h1>
          <p className="text-muted-foreground">Manage staff access and permission levels.</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>Invite New Admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Admin User</DialogTitle>
              <DialogDescription>
                Create a new admin user. They will receive an email with their credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@promptandpause.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
                <p className="text-xs text-muted-foreground mt-1">Must be @promptandpause.com domain</p>
              </div>
              <div>
                <Label htmlFor="full_name">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, role: value as 'super_admin' | 'admin' | 'employee' })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin - Full Access</SelectItem>
                    )}
                    <SelectItem value="admin">Admin - Can Manage Users</SelectItem>
                    <SelectItem value="employee">Employee - Limited Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  placeholder="Engineering, Support, etc."
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateUser}>Create User</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by email or name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading admin users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No admin users found</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="shadow-none border">
              <CardHeader className="flex flex-row items-center gap-4 pb-4">
                <Avatar className="h-12 w-12 border">
                  <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1 min-w-0">
                  <CardTitle className="text-base truncate">{user.full_name}</CardTitle>
                  {getRoleBadge(user.role)}
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(user)}
                    disabled={!isSuperAdmin && user.role === 'super_admin'}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {user.is_active && (
                    <AlertDialog open={deactivateConfirmOpen && userToDeactivate?.id === user.id} onOpenChange={(open) => !open && setDeactivateConfirmOpen(false)}>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeactivateUser(user)}
                          disabled={Boolean(currentAdmin.user_id === user.user_id) || (!isSuperAdmin && user.role === 'super_admin')}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Deactivate Admin User</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to deactivate {user.full_name || user.email}? This will revoke their admin access.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={confirmDeactivate} className="bg-red-600 hover:bg-red-700">
                            Deactivate
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3 pt-0">
                <div className="flex items-center text-sm text-muted-foreground gap-2">
                  <Mail size={14} />
                  {user.email}
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground gap-2">
                  <span className="flex items-center gap-2 min-w-0">
                    <Shield size={14} />
                    {roleLabels[user.role] || user.role}
                  </span>
                  <Badge
                    variant="outline"
                    className={
                      user.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                {user.department && (
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <Building2 size={14} />
                    {user.department}
                  </div>
                )}
              </CardContent>
              <CardFooter className="text-xs text-muted-foreground">
                {user.last_login_at
                  ? `Last login ${formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true })}`
                  : 'Never logged in'}
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Admin User</DialogTitle>
            <DialogDescription>
              Update admin user details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Email</Label>
              <Input
                value={selectedUser?.email || ''}
                disabled
                className="bg-muted text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <Label htmlFor="edit_full_name">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit_role">Role</Label>
              <Select value={editForm.role} onValueChange={(value: any) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin - Full Access</SelectItem>
                  )}
                  <SelectItem value="admin">Admin - Can Manage Users</SelectItem>
                  <SelectItem value="employee">Employee - Limited Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_department">Department</Label>
              <Input
                id="edit_department"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateUser}>Update User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
