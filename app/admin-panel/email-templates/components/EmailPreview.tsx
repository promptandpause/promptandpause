'use client'

import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Mail } from 'lucide-react'

interface EmailPreviewProps {
  html: string
  subject: string
  templateKey: string
}

export default function EmailPreview({ html, subject, templateKey }: EmailPreviewProps) {
  return (
    <Card className="bg-white border border-gray-100 overflow-hidden">
      {/* Preview Header */}
      <div className="border-b border-gray-100 p-4 bg-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-600" />
            <h3 className="text-gray-900 font-semibold">Email Preview</h3>
          </div>
          <Badge variant="outline" className="text-gray-600 border-gray-200">
            {templateKey}
          </Badge>
        </div>
        
        {/* Subject Line */}
        <div className="space-y-1">
          <p className="text-xs text-gray-500 font-medium">Subject:</p>
          <p className="text-sm text-gray-700">{subject || 'No subject'}</p>
        </div>
      </div>

      {/* Email HTML Preview */}
      <div className="p-4 bg-white">
        {html ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              srcDoc={html}
              title="Email Preview"
              className="w-full h-[600px] bg-white"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-gray-500">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-2 text-gray-300" />
              <p>No preview available</p>
              <p className="text-sm">Save template to generate preview</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
