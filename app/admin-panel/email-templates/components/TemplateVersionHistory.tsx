'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Clock, RotateCcw, User } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VersionHistoryItem {
  id: string
  template_id: string
  changed_by: string
  change_type: 'metadata' | 'customization'
  changes_json: Record<string, any>
  notes: string | null
  created_at: string
}

interface TemplateVersionHistoryProps {
  templateId: string
}

export default function TemplateVersionHistory({ templateId }: TemplateVersionHistoryProps) {
  const { toast } = useToast()
  const [versions, setVersions] = useState<VersionHistoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [rollbackConfirmOpen, setRollbackConfirmOpen] = useState(false)
  const [versionToRollback, setVersionToRollback] = useState<string | null>(null)

  const loadVersionHistory = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/email-templates/${templateId}/versions`)

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to load version history')
      }

      const data = await response.json()
      setVersions(data.versions || [])
    } catch (error: any) {
      setVersions([])
      setError(error?.message || 'Failed to load version history')
    } finally {
      setLoading(false)
    }
  }, [templateId])

  useEffect(() => {
    loadVersionHistory()
  }, [loadVersionHistory])

  async function handleRollback(versionId: string) {
    setVersionToRollback(versionId)
    setRollbackConfirmOpen(true)
  }

  async function confirmRollback() {
    if (!versionToRollback) return

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId: versionToRollback }),
      })

      if (!response.ok) throw new Error('Rollback failed')

      toast({
        title: 'Success',
        description: 'Template rolled back successfully',
      })
      loadVersionHistory()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rollback template',
        variant: 'destructive',
      })
    } finally {
      setRollbackConfirmOpen(false)
      setVersionToRollback(null)
    }
  }

  function formatDate(dateString: string) {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
    }).format(date)
  }

  function getChangesSummary(changes: Record<string, any>, changeType: string) {
    if (changeType === 'customization') {
      const keys = Object.keys(changes).filter((k) => k !== 'type' && k !== 'notes')
      return keys.length > 0 ? `Updated: ${keys.join(', ')}` : 'Customization updated'
    }
    return 'Metadata updated'
  }

  if (loading) {
    return (
      <Card className="bg-white border border-gray-100 p-6">
        <p className="text-gray-500 text-center">Loading version history...</p>
      </Card>
    )
  }

  return (
    <Card className="bg-white border border-gray-100 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Version History</h3>
        <p className="text-sm text-gray-500">
          {versions.length} version{versions.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 mb-4">
          {error}
        </div>
      )}

      {versions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="h-12 w-12 mx-auto mb-2 text-gray-300" />
          <p>No version history available</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  {/* Change Type Badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <Badge
                      variant={version.change_type === 'metadata' ? 'default' : 'outline'}
                      className="text-xs"
                    >
                      {version.change_type}
                    </Badge>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                        Current
                      </Badge>
                    )}
                  </div>

                  {/* Changes Summary */}
                  <p className="text-sm text-gray-700 mb-2">
                    {getChangesSummary(version.changes_json, version.change_type)}
                  </p>

                  {/* Notes */}
                  {version.notes && (
                    <p className="text-xs text-gray-500 italic mb-2">
                      &quot;{version.notes}&quot;
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      <span>{version.changed_by}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{formatDate(version.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* Rollback Button (not for current version) */}
                {index !== 0 && (
                  <AlertDialog open={rollbackConfirmOpen && versionToRollback === version.id} onOpenChange={(open) => !open && setRollbackConfirmOpen(false)}>
                    <AlertDialogTrigger asChild>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRollback(version.id)}
                        className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50 flex-shrink-0"
                      >
                        <RotateCcw className="h-3 w-3 mr-1" />
                        Rollback
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="bg-white border-gray-200">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-gray-900">Rollback Template</AlertDialogTitle>
                        <AlertDialogDescription className="text-gray-600">
                          Are you sure you want to rollback to this version? Current changes will be saved in history.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white text-gray-900 border-gray-200">Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRollback} className="bg-blue-600 hover:bg-blue-700">
                          Rollback
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
