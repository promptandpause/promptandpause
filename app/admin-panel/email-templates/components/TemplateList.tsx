'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmailTemplateWithCustomization, EmailTemplateCategory } from '@/lib/types/emailTemplate'
import { Mail, Clock } from 'lucide-react'

interface TemplateListProps {
  templates: EmailTemplateWithCustomization[]
  selectedTemplate: EmailTemplateWithCustomization | null
  onSelect: (template: EmailTemplateWithCustomization) => void
}

const categoryColors = {
  transactional: 'bg-blue-50 text-blue-700 border-blue-200',
  engagement: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  support: 'bg-purple-50 text-purple-700 border-purple-200',
  notification: 'bg-amber-50 text-amber-700 border-amber-200',
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
      <Card className="bg-white border border-gray-100 p-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant="ghost"
              onClick={() => setCategoryFilter(category)}
              className={`${
                categoryFilter === category
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:text-gray-900'
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
                ? 'bg-blue-50 border-blue-200'
                : 'bg-white border-gray-100 hover:bg-gray-50'
            }`}
            onClick={() => onSelect(template)}
          >
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h3 className="font-medium text-gray-900 text-sm leading-tight">{template.name}</h3>
                  {template.is_active && (
                    <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-xs">
                      Active
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-gray-500 line-clamp-2 mb-2">{template.description}</p>
                <div className="flex items-center gap-2">
                  <Badge className={`${categoryColors[template.category as keyof typeof categoryColors]} border`}>
                    {template.category}
                  </Badge>
                  {template.customization && (
                    <span className="text-xs text-gray-500 flex items-center gap-1">
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
        <Card className="bg-white border border-gray-100 p-8 text-center">
          <p className="text-gray-500 text-sm">No templates found</p>
        </Card>
      )}
    </div>
  )
}
