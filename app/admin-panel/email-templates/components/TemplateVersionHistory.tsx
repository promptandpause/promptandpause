'use client'

import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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

  useEffect(() => {
    loadVersionHistory()
  }, [templateId])

  async function loadVersionHistory() {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/email-templates/${templateId}/versions`)
      
      if (response.ok) {
        const data = await response.json()
        setVersions(data.versions || [])
      }
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }

  async function handleRollback(versionId: string) {
    if (!confirm('Rollback to this version? Current changes will be saved in history.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/email-templates/${templateId}/rollback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ versionId }),
      })

      if (!response.ok) throw new Error('Rollback failed')

      toast({
        title: 'Success',
        description: 'Template rolled back successfully',
      })

      // Reload history
      await loadVersionHistory()
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to rollback template',
        variant: 'destructive',
      })
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
      <Card className="bg-slate-800/50 border-slate-700 p-6">
        <p className="text-slate-400 text-center">Loading version history...</p>
      </Card>
    )
  }

  return (
    <Card className="bg-slate-800/50 border-slate-700 p-6">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white mb-1">Version History</h3>
        <p className="text-sm text-slate-400">
          {versions.length} version{versions.length !== 1 ? 's' : ''} recorded
        </p>
      </div>

      {versions.length === 0 ? (
        <div className="text-center py-8 text-slate-400">
          <Clock className="h-12 w-12 mx-auto mb-2 text-slate-600" />
          <p>No version history available</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {versions.map((version, index) => (
            <div
              key={version.id}
              className="border border-slate-700 rounded-lg p-4 hover:bg-slate-800/30 transition-colors"
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
                      <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/30">
                        Current
                      </Badge>
                    )}
                  </div>

                  {/* Changes Summary */}
                  <p className="text-sm text-slate-300 mb-2">
                    {getChangesSummary(version.changes_json, version.change_type)}
                  </p>

                  {/* Notes */}
                  {version.notes && (
                    <p className="text-xs text-slate-500 italic mb-2">
                      &quot;{version.notes}&quot;
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex items-center gap-3 text-xs text-slate-500">
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
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRollback(version.id)}
                    className="border-slate-600 text-slate-300 hover:bg-slate-800 flex-shrink-0"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Rollback
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}
