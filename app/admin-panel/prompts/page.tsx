'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Search, MoreVertical, CheckCircle2, AlertCircle, User, Calendar, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'

interface Prompt {
  id: string
  title: string
  content: string
  category: string
  tags: string[]
  is_active: boolean
  created_at: string
  created_by: string
}

const CATEGORIES = ['reflection', 'mindfulness', 'gratitude', 'goal-setting', 'stress-relief', 'other']

export default function PromptLibraryPage() {
  const [prompts, setPrompts] = useState<Prompt[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'reflection',
    tags: '',
    is_active: true,
  })

  const searchRef = useRef(search)
  searchRef.current = search

  const fetchPrompts = useCallback(async () => {
    setLoading(true)
    try {
      setError(null)
      const params = new URLSearchParams({
        page: page.toString(),
        ...(categoryFilter && { category: categoryFilter }),
        ...(searchRef.current && { search: searchRef.current }),
      })

      const res = await fetch(`/api/admin/prompts?${params}`)
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to fetch prompts')
      }

      const data = await res.json()
      setPrompts(data.prompts)
      setTotalPages(data.totalPages)
    } catch (error: any) {
      setPrompts([])
      setTotalPages(1)
      setError(error?.message || 'Failed to fetch prompts')
    } finally {
      setLoading(false)
    }
  }, [categoryFilter, page])

  useEffect(() => {
    fetchPrompts()
  }, [fetchPrompts])

  const handleSearch = () => {
    setPage(1)
    fetchPrompts()
  }

  const handleCreate = () => {
    setEditingPrompt(null)
    setFormData({
      title: '',
      content: '',
      category: 'reflection',
      tags: '',
      is_active: true,
    })
    setDialogOpen(true)
  }

  const handleEdit = (prompt: Prompt) => {
    setEditingPrompt(prompt)
    setFormData({
      title: prompt.title,
      content: prompt.content,
      category: prompt.category,
      tags: prompt.tags.join(', '),
      is_active: prompt.is_active,
    })
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    try {
      setError(null)
      const payload = {
        ...formData,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
      }

      const url = editingPrompt ? `/api/admin/prompts/${editingPrompt.id}` : '/api/admin/prompts'
      const method = editingPrompt ? 'PATCH' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to save prompt')
      }

      setDialogOpen(false)
      fetchPrompts()
    } catch (error: any) {
      setError(error?.message || 'Failed to save prompt')
    }
  }

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [promptToDelete, setPromptToDelete] = useState<string | null>(null)

  const handleDelete = async (id: string) => {
    setPromptToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!promptToDelete) return

    try {
      setError(null)
      const res = await fetch(`/api/admin/prompts/${promptToDelete}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || 'Failed to delete prompt')
      }

      fetchPrompts()
    } catch (error: any) {
      setError(error?.message || 'Failed to delete prompt')
    } finally {
      setDeleteConfirmOpen(false)
      setPromptToDelete(null)
    }
  }

  if (loading && prompts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-muted-foreground">Loading prompt library...</div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Prompt Library</h1>
          <p className="text-muted-foreground">Manage the writing prompts sent to users daily.</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Prompt
        </Button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 max-w-sm relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <Input
            placeholder="Search prompts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value)
              setPage(1)
            }}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <Button onClick={handleSearch} size="sm" className="h-9">
            <Search className="mr-2 h-4 w-4" />
            Search
          </Button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {prompts.length === 0 ? (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            No prompts found
          </div>
        ) : (
          prompts.map((prompt) => (
            <Card key={prompt.id} className="shadow-none border flex flex-col">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <Badge variant="outline" className="text-xs font-normal">{prompt.category}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical size={16} />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(prompt)}>
                        <Edit size={14} /> Edit Prompt
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(prompt.id)}>
                        <Trash2 size={14} /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <CardTitle className="text-lg mt-2">{prompt.title}</CardTitle>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground leading-relaxed italic">
                  "{prompt.content}"
                </p>
              </CardContent>
              <CardFooter className="pt-3 border-t text-xs text-muted-foreground flex items-center justify-between bg-muted/20">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1">
                    <User size={12} /> {prompt.created_by}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar size={12} /> {format(new Date(prompt.created_at), 'MMM dd, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {prompt.is_active ? (
                    <CheckCircle2 size={12} className="text-emerald-500" />
                  ) : (
                    <AlertCircle size={12} className="text-amber-500" />
                  )}
                  <span className={prompt.is_active ? 'text-emerald-600' : 'text-amber-600'}>
                    {prompt.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </CardFooter>
              <AlertDialog open={deleteConfirmOpen && promptToDelete === prompt.id} onOpenChange={(open) => !open && setDeleteConfirmOpen(false)}>
                <AlertDialogContent className="max-w-md">
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Prompt</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete "{prompt.title}"? This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white hover:bg-destructive/90">
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </Card>
          ))
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-muted-foreground">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </Button>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
            <DialogDescription>
              {editingPrompt ? 'Update the prompt details below' : 'Add a new prompt to the library'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Prompt title..."
              />
            </div>

            <div className="space-y-2">
              <Label>Content</Label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="min-h-[120px]"
                placeholder="Prompt content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Category</Label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label>Status</Label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tags (comma-separated)</Label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="mindfulness, wellness, daily"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              {editingPrompt ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
