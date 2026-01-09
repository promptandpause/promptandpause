'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
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
import { EmailTemplateWithCustomization } from '@/lib/types/emailTemplate'
import { Save, RotateCcw } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface EmailTemplateEditorProps {
  template: EmailTemplateWithCustomization
  onSave: () => void
}

export default function EmailTemplateEditor({ template, onSave }: EmailTemplateEditorProps) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  
  const [customization, setCustomization] = useState({
    logo_url: template.customization?.logo_url || '',
    primary_color: template.customization?.primary_color || '#667eea',
    secondary_color: template.customization?.secondary_color || '#A3E635',
    background_color: template.customization?.background_color || '#F5F5DC',
    button_text_color: template.customization?.button_text_color || '#FFFFFF',
    custom_header_text: template.customization?.custom_header_text || '',
    custom_footer_text: template.customization?.custom_footer_text || '',
  })

  async function handleSave() {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/email-templates/${template.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'customization',
          ...customization,
          notes: 'Updated via admin panel',
        }),
      })

      if (!response.ok) throw new Error('Failed to save')

      toast({ title: 'Success', description: 'Template saved successfully' })
      onSave()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' })
    } finally {
      setSaving(false)
    }
  }

  const [restoreConfirmOpen, setRestoreConfirmOpen] = useState(false)

  async function handleRestore() {
    setRestoreConfirmOpen(true)
  }

  async function confirmRestore() {
    try {
      const response = await fetch(`/api/admin/email-templates/${template.id}/restore`, {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to restore')

      toast({ title: 'Success', description: 'Restored to defaults' })
      setRestoreConfirmOpen(false)
      onSave()
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to restore', variant: 'destructive' })
    }
  }

  return (
    <Card className="bg-white border border-gray-100 p-6 space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-1">{template.name}</h2>
        <p className="text-sm text-gray-500">{template.description}</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label className="text-gray-700">Logo URL</Label>
          <Input
            value={customization.logo_url}
            onChange={(e) => setCustomization({ ...customization, logo_url: e.target.value })}
            className="bg-white border-gray-200 text-gray-900"
            placeholder="https://..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="text-gray-700">Primary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={customization.primary_color}
                onChange={(e) => setCustomization({ ...customization, primary_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={customization.primary_color}
                onChange={(e) => setCustomization({ ...customization, primary_color: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-700">Secondary Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={customization.secondary_color}
                onChange={(e) => setCustomization({ ...customization, secondary_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={customization.secondary_color}
                onChange={(e) => setCustomization({ ...customization, secondary_color: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-700">Background Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={customization.background_color}
                onChange={(e) => setCustomization({ ...customization, background_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={customization.background_color}
                onChange={(e) => setCustomization({ ...customization, background_color: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 flex-1"
              />
            </div>
          </div>

          <div>
            <Label className="text-gray-700">Button Text Color</Label>
            <div className="flex gap-2">
              <Input
                type="color"
                value={customization.button_text_color}
                onChange={(e) => setCustomization({ ...customization, button_text_color: e.target.value })}
                className="w-16 h-10"
              />
              <Input
                value={customization.button_text_color}
                onChange={(e) => setCustomization({ ...customization, button_text_color: e.target.value })}
                className="bg-white border-gray-200 text-gray-900 flex-1"
              />
            </div>
          </div>
        </div>

        <div>
          <Label className="text-gray-700">Custom Header Text</Label>
          <Textarea
            value={customization.custom_header_text}
            onChange={(e) => setCustomization({ ...customization, custom_header_text: e.target.value })}
            className="bg-white border-gray-200 text-gray-900"
            rows={2}
            placeholder="Optional custom header text..."
          />
        </div>

        <div>
          <Label className="text-gray-700">Custom Footer Text</Label>
          <Textarea
            value={customization.custom_footer_text}
            onChange={(e) => setCustomization({ ...customization, custom_footer_text: e.target.value })}
            className="bg-white border-gray-200 text-gray-900"
            rows={2}
            placeholder="Optional custom footer text..."
          />
        </div>
      </div>

      <div className="flex gap-2 pt-4 border-t border-gray-100">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-blue-500 hover:bg-blue-600 text-white flex-1"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
        <AlertDialog open={restoreConfirmOpen} onOpenChange={setRestoreConfirmOpen}>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="border-gray-200 bg-white text-gray-900 hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Restore Defaults
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent className="bg-white border-gray-200">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-gray-900">Restore to Defaults</AlertDialogTitle>
              <AlertDialogDescription className="text-gray-600">
                Are you sure you want to restore this template to its default settings? All customizations will be lost.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel className="bg-white text-gray-900 border-gray-200">Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRestore} className="bg-blue-600 hover:bg-blue-700">
                Restore
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Card>
  )
}
