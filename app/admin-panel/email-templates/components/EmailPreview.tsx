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
    <Card className="bg-slate-800/50 border-slate-700 overflow-hidden">
      {/* Preview Header */}
      <div className="border-b border-slate-700 p-4 bg-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-semibold">Email Preview</h3>
          </div>
          <Badge variant="outline" className="text-slate-400 border-slate-600">
            {templateKey}
          </Badge>
        </div>
        
        {/* Subject Line */}
        <div className="space-y-1">
          <p className="text-xs text-slate-500 font-medium">Subject:</p>
          <p className="text-sm text-slate-300">{subject || 'No subject'}</p>
        </div>
      </div>

      {/* Email HTML Preview */}
      <div className="p-4 bg-white">
        {html ? (
          <div className="border border-slate-200 rounded-lg overflow-hidden">
            <iframe
              srcDoc={html}
              title="Email Preview"
              className="w-full h-[600px] bg-white"
              sandbox="allow-same-origin"
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-64 text-slate-400">
            <div className="text-center">
              <Mail className="h-12 w-12 mx-auto mb-2 text-slate-500" />
              <p>No preview available</p>
              <p className="text-sm">Save template to generate preview</p>
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}
