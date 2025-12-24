'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { BookOpen, Search, Plus, Edit, Trash2, CheckCircle, XCircle } from 'lucide-react'
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

  useEffect(() => {
    fetchPrompts()
  }, [page, categoryFilter])

  const fetchPrompts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        ...(categoryFilter && { category: categoryFilter }),
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/prompts?${params}`)
      if (res.ok) {
        const data = await res.json()
        setPrompts(data.prompts)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

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

      if (res.ok) {
        setDialogOpen(false)
        fetchPrompts()
      }
    } catch (error) {
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) return

    try {
      const res = await fetch(`/api/admin/prompts/${id}`, { method: 'DELETE' })
      if (res.ok) {
        fetchPrompts()
      }
    } catch (error) {
    }
  }

  if (loading && prompts.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-slate-400">Loading prompt library...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Prompt Library</h1>
          <p className="text-slate-400">Manage reusable prompts and templates</p>
        </div>
        <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          New Prompt
        </Button>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Prompts</CardTitle>
          <CardDescription className="text-slate-400">
            Browse and manage prompt templates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex gap-2">
              <Input
                placeholder="Search prompts..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="bg-slate-800 border-slate-700 text-white"
              />
              <Button onClick={handleSearch} className="bg-blue-600 hover:bg-blue-700">
                <Search className="h-4 w-4" />
              </Button>
            </div>
            
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value)
                setPage(1)
              }}
              className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {prompts.length === 0 ? (
              <div className="col-span-full text-center py-8 text-slate-400">
                No prompts found
              </div>
            ) : (
              prompts.map((prompt) => (
                <Card key={prompt.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-white text-lg">{prompt.title}</CardTitle>
                      {prompt.is_active ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-slate-500" />
                      )}
                    </div>
                    <CardDescription className="text-slate-400">
                      {prompt.category}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm text-slate-300 line-clamp-3">{prompt.content}</p>
                    
                    {prompt.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {prompt.tags.slice(0, 3).map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs bg-slate-700 border-slate-600">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="text-xs text-slate-500">
                      Created {format(new Date(prompt.created_at), 'MMM dd, yyyy')}
                    </div>

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(prompt)}
                        className="flex-1 bg-slate-700 border-slate-600 hover:bg-slate-600"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDelete(prompt.id)}
                        className="bg-red-900/20 border-red-800 hover:bg-red-900/40 text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                Previous
              </Button>
              <span className="flex items-center px-4 text-sm text-slate-400">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="bg-slate-800 border-slate-700 text-white hover:bg-slate-700"
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingPrompt ? 'Edit Prompt' : 'Create New Prompt'}</DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingPrompt ? 'Update the prompt details below' : 'Add a new prompt to the library'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300">Title</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="Prompt title..."
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Content</label>
              <Textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white min-h-[120px]"
                placeholder="Prompt content..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-slate-300">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-sm font-medium text-slate-300">Status</label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'active' })}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-white text-sm"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-300">Tags (comma-separated)</label>
              <Input
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="bg-slate-800 border-slate-700 text-white"
                placeholder="mindfulness, wellness, daily"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="bg-slate-800 border-slate-700">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {editingPrompt ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
