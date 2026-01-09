'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { EmailTemplateWithCustomization } from '@/lib/types/emailTemplate'
import TemplateList from './components/TemplateList'
import EmailTemplateEditor from './components/EmailTemplateEditor'
import EmailPreview from './components/EmailPreview'
import SendTestEmail from './components/SendTestEmail'
import TemplateVersionHistory from './components/TemplateVersionHistory'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileText } from 'lucide-react'

export default function EmailTemplatesPage() {
  const [templates, setTemplates] = useState<EmailTemplateWithCustomization[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplateWithCustomization | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewHTML, setPreviewHTML] = useState('')
  const [previewSubject, setPreviewSubject] = useState('')
  const [previewError, setPreviewError] = useState<string | null>(null)

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/admin/email-templates')
      if (!response.ok) throw new Error('Failed to fetch templates')
      
      const data = await response.json()
      setTemplates(data.templates)
      
      // Select first template by default
      setSelectedTemplate((prev) => {
        if (prev) return prev
        return data.templates.length > 0 ? data.templates[0] : null
      })
    } catch (error: any) {
      setError(error?.message || 'Failed to load templates')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  async function handleTemplateSelect(template: EmailTemplateWithCustomization) {
    setSelectedTemplate(template)
    // Generate preview
    await generatePreview(template)
  }

  async function generatePreview(template: EmailTemplateWithCustomization) {
    try {
      setPreviewError(null)
      // Create sample data based on template variables
      const sampleData: Record<string, string> = {}
      template.variables.forEach((variable) => {
        sampleData[variable] = `[Sample ${variable}]`
      })
      sampleData.userName = 'John Doe'
      sampleData.email = 'john@example.com'

      const response = await fetch(`/api/admin/email-templates/${template.id}/preview`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sampleData,
          customization: template.customization,
        }),
      })

      if (!response.ok) {
        const data = await response.json().catch(() => null)
        throw new Error(data?.error || 'Failed to generate preview')
      }

      const data = await response.json()
      setPreviewHTML(data.html || '')
      setPreviewSubject(data.subject || '')
    } catch (error: any) {
      setPreviewHTML('')
      setPreviewSubject('')
      setPreviewError(error?.message || 'Failed to generate preview')
    }
  }

  async function handleSave() {
    // Reload templates and regenerate preview
    await loadTemplates()
    if (selectedTemplate) {
      // Refetch the selected template
      const response = await fetch(`/api/admin/email-templates/${selectedTemplate.id}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedTemplate(data.template)
        await generatePreview(data.template)
      }
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-500">Loading templates...</div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col p-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-1">
          <FileText className="h-7 w-7 text-blue-600" />
          <h1 className="text-2xl font-semibold text-gray-900">Email Templates</h1>
        </div>
        <p className="text-sm text-gray-500">Customize and manage email templates</p>
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{error}</p>
        </Card>
      )}

      {previewError && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-700">{previewError}</p>
        </Card>
      )}

      {/* Main Content - 3 Column Layout */}
      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Left Sidebar - Template List (30%) */}
        <div className="col-span-3 overflow-y-auto">
          <TemplateList
            templates={templates}
            selectedTemplate={selectedTemplate}
            onSelect={handleTemplateSelect}
          />
        </div>

        {/* Center - Editor and Preview (45%) */}
        <div className="col-span-5 overflow-y-auto">
          {selectedTemplate ? (
            <Tabs defaultValue="editor" className="space-y-4">
              <TabsList className="bg-white border border-gray-200">
                <TabsTrigger value="editor">Editor</TabsTrigger>
                <TabsTrigger value="preview">Preview</TabsTrigger>
                <TabsTrigger value="history">History</TabsTrigger>
              </TabsList>

              <TabsContent value="editor" className="space-y-4">
                <EmailTemplateEditor
                  key={selectedTemplate.id}
                  template={selectedTemplate}
                  onSave={handleSave}
                />
              </TabsContent>

              <TabsContent value="preview">
                <EmailPreview
                  html={previewHTML}
                  subject={previewSubject}
                  templateKey={selectedTemplate.template_key}
                />
              </TabsContent>

              <TabsContent value="history">
                <TemplateVersionHistory templateId={selectedTemplate.id} />
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="bg-white border border-gray-100 p-12 text-center">
              <FileText className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Select a template to edit</p>
            </Card>
          )}
        </div>

        {/* Right Sidebar - Test Email (25%) */}
        <div className="col-span-4 overflow-y-auto">
          {selectedTemplate && (
            <SendTestEmail key={selectedTemplate.id} template={selectedTemplate} />
          )}
        </div>
      </div>
    </div>
  )
}
