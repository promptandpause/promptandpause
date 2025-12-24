'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmailTemplateWithCustomization, EmailTemplateCategory } from '@/lib/types/emailTemplate'
import { Mail, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface TemplateListProps {
  templates: EmailTemplateWithCustomization[]
  selectedTemplate: EmailTemplateWithCustomization | null
  onSelect: (template: EmailTemplateWithCustomization) => void
}

const categoryColors = {
  transactional: 'bg-blue-500/10 text-blue-400 border-blue-400/30',
  engagement: 'bg-green-500/10 text-green-400 border-green-400/30',
  support: 'bg-purple-500/10 text-purple-400 border-purple-400/30',
  notification: 'bg-yellow-500/10 text-yellow-400 border-yellow-400/30',
}

export default function TemplateList({ templates, selectedTemplate, onSelect }: TemplateListProps) {
  const [categoryFilter, setCategoryFilter] = useState<EmailTemplateCategory | 'all'>('all')

  const filteredTemplates = categoryFilter === 'all'
    ? templates
    : templates.filter(t => t.category === categoryFilter)

  const categories: Array<EmailTemplateCategory | 'all'> = ['all', 'transactional', 'engagement', 'support', 'notification']

  return (
    <div className="space-y-4">
      {/* Category Filter */}
      <Card className="bg-slate-800/50 border-slate-700 p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant="ghost"
              onClick={() => setCategoryFilter(category)}
              className={`${
                categoryFilter === category
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
      </Card>

      {/* Template List */}
      <div className="space-y-2">
        {filteredTemplates.map((template) => (
          <Card
            key={template.id}
            className={`p-4 cursor-pointer transition-all ${
              selectedTemplate?.id === template.id
                ? 'bg-blue-500/10 border-blue-500'
                : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800 hover:border-slate-600'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-slate-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-white text-sm leading-tight">{template.name}</h3>
                  {template.is_active && (
                    <Badge className="bg-green-500/10 text-green-400 border-green-400/30 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-slate-400 line-clamp-2 mb-2">{template.description}</p>
                <div className="flex items-center gap-2">
                  <Badge className={categoryColors[template.category as keyof typeof categoryColors]}>
                    {template.category}
                  </Badge>
                  {template.customization && (
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      v{template.customization.version}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredTemplates.length === 0 && (
        <Card className="bg-slate-800/50 border-slate-700 p-8 text-center">
          <p className="text-slate-400 text-sm">No templates found</p>
        </Card>
      )}
    </div>
  )
}
