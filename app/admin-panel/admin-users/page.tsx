'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { Label } from '@/components/ui/label'
import { UserPlus, Shield, ShieldCheck, Users, Search, Edit, Trash2, Mail } from 'lucide-react'
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

  const getRoleBadge = (role: string) => {
    const styles = {
      super_admin: 'bg-purple-50 text-purple-700 border-purple-200',
      admin: 'bg-blue-50 text-blue-700 border-blue-200',
      employee: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    }
    const icons = {
      super_admin: <ShieldCheck className="h-3 w-3 mr-1" />,
      admin: <Shield className="h-3 w-3 mr-1" />,
      employee: <Users className="h-3 w-3 mr-1" />,
    }
    const labels = {
      super_admin: 'Super Admin',
      admin: 'Admin',
      employee: 'Employee',
    }
    return (
      <Badge variant="outline" className={styles[role as keyof typeof styles]}>
        {icons[role as keyof typeof icons]}
        {labels[role as keyof typeof labels]}
      </Badge>
    )
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(search.toLowerCase()) ||
    user.full_name.toLowerCase().includes(search.toLowerCase())
  )

  if (meLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">Loading…</div>
      </div>
    )
  }

  if (!currentAdmin) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-neutral-500">{error || 'Unable to load admin profile'}</div>
      </div>
    )
  }

  if (!canManageAdminUsers) {
    return (
      <div className="h-full flex flex-col p-6 gap-6">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Admin Users</h1>
          <p className="text-sm text-neutral-500">Manage admin panel access and roles</p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          You don’t have permission to manage admin users.
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-neutral-900">Admin Users</h1>
          <p className="text-sm text-neutral-500">Manage admin panel access and roles</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <UserPlus className="h-4 w-4 mr-2" />
              Create Admin User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white border-neutral-200">
            <DialogHeader>
              <DialogTitle className="text-neutral-900">Create Admin User</DialogTitle>
              <DialogDescription className="text-neutral-500">
                Create a new admin user. They will receive an email with their credentials.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email" className="text-neutral-900">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@promptandpause.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900"
                />
                <p className="text-xs text-neutral-500 mt-1">Must be @promptandpause.com domain</p>
              </div>
              <div>
                <Label htmlFor="full_name" className="text-neutral-900">Full Name *</Label>
                <Input
                  id="full_name"
                  placeholder="John Doe"
                  value={createForm.full_name}
                  onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900"
                />
              </div>
              <div>
                <Label htmlFor="role" className="text-neutral-900">Role *</Label>
                <Select
                  value={createForm.role}
                  onValueChange={(value) =>
                    setCreateForm({ ...createForm, role: value as 'super_admin' | 'admin' | 'employee' })
                  }
                >
                  <SelectTrigger className="bg-white border-neutral-200 text-neutral-900">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-neutral-200">
                    {isSuperAdmin && (
                      <SelectItem value="super_admin">Super Admin - Full Access</SelectItem>
                    )}
                    <SelectItem value="admin">Admin - Can Manage Users</SelectItem>
                    <SelectItem value="employee">Employee - Limited Access</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="department" className="text-neutral-900">Department</Label>
                <Input
                  id="department"
                  placeholder="Engineering, Support, etc."
                  value={createForm.department}
                  onChange={(e) => setCreateForm({ ...createForm, department: e.target.value })}
                  className="bg-white border-neutral-200 text-neutral-900"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="border-neutral-200 bg-white">
                Cancel
              </Button>
              <Button onClick={handleCreateUser} className="bg-blue-600 hover:bg-blue-700">
                Create User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <Card className="bg-white border-neutral-200">
        <CardHeader>
          <CardTitle className="text-neutral-900">Admin Users ({filteredUsers.length})</CardTitle>
          <CardDescription className="text-neutral-500">
            Domain-locked to @promptandpause.com
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-500" />
              <Input
                placeholder="Search by email or name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-white border-neutral-200 text-neutral-900"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8 text-neutral-500">Loading admin users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-neutral-500">No admin users found</div>
          ) : (
            <div className="rounded-md border border-neutral-200">
              <Table>
                <TableHeader>
                  <TableRow className="border-neutral-200">
                    <TableHead className="text-neutral-500">User</TableHead>
                    <TableHead className="text-neutral-500">Role</TableHead>
                    <TableHead className="text-neutral-500">Department</TableHead>
                    <TableHead className="text-neutral-500">Status</TableHead>
                    <TableHead className="text-neutral-500">Last Login</TableHead>
                    <TableHead className="text-neutral-500 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="border-neutral-200">
                      <TableCell>
                        <div>
                          <div className="font-medium text-neutral-900">{user.full_name}</div>
                          <div className="text-sm text-neutral-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {user.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-neutral-900">
                        {user.department || <span className="text-neutral-500">-</span>}
                      </TableCell>
                      <TableCell>
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
                      </TableCell>
                      <TableCell className="text-neutral-500 text-sm">
                        {user.last_login_at ? formatDistanceToNow(new Date(user.last_login_at), { addSuffix: true }) : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => openEditDialog(user)}
                            disabled={!isSuperAdmin && user.role === 'super_admin'}
                            className="text-neutral-600 hover:text-neutral-900 disabled:opacity-50"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {user.is_active && (
                            <AlertDialog open={deactivateConfirmOpen && userToDeactivate?.id === user.id} onOpenChange={(open) => !open && setDeactivateConfirmOpen(false)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleDeactivateUser(user)}
                                  disabled={Boolean(currentAdmin.user_id === user.user_id) || (!isSuperAdmin && user.role === 'super_admin')}
                                  className="text-red-400 hover:text-red-300 disabled:opacity-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="bg-white border-neutral-200">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-neutral-900">Deactivate Admin User</AlertDialogTitle>
                                  <AlertDialogDescription className="text-neutral-500">
                                    Are you sure you want to deactivate {user.full_name || user.email}? This will revoke their admin access.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="bg-white text-neutral-900 border-neutral-200">Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={confirmDeactivate} className="bg-red-600 hover:bg-red-700">
                                    Deactivate
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-white border-neutral-200">
          <DialogHeader>
            <DialogTitle className="text-neutral-900">Edit Admin User</DialogTitle>
            <DialogDescription className="text-neutral-500">
              Update admin user details and permissions
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-neutral-900">Email</Label>
              <Input
                value={selectedUser?.email || ''}
                disabled
                className="bg-neutral-50 border-neutral-200 text-neutral-500"
              />
              <p className="text-xs text-neutral-500 mt-1">Email cannot be changed here</p>
            </div>
            <div>
              <Label htmlFor="edit_full_name" className="text-neutral-900">Full Name</Label>
              <Input
                id="edit_full_name"
                value={editForm.full_name}
                onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                className="bg-white border-neutral-200 text-neutral-900"
              />
            </div>
            <div>
              <Label htmlFor="edit_role" className="text-neutral-900">Role</Label>
              <Select value={editForm.role} onValueChange={(value: any) => setEditForm({ ...editForm, role: value })}>
                <SelectTrigger className="bg-white border-neutral-200 text-neutral-900">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white border-neutral-200">
                  {isSuperAdmin && (
                    <SelectItem value="super_admin">Super Admin - Full Access</SelectItem>
                  )}
                  <SelectItem value="admin">Admin - Can Manage Users</SelectItem>
                  <SelectItem value="employee">Employee - Limited Access</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit_department" className="text-neutral-900">Department</Label>
              <Input
                id="edit_department"
                value={editForm.department}
                onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                className="bg-white border-neutral-200 text-neutral-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="border-neutral-200 bg-white">
              Cancel
            </Button>
            <Button onClick={handleUpdateUser} className="bg-blue-600 hover:bg-blue-700">
              Update User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
