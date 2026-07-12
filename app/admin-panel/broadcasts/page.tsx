'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Megaphone, Send, AlertCircle, CheckCircle2, Loader2, Eye, Users, EyeOff } from 'lucide-react'

const TEMPLATE_OPTIONS = [
  { value: 'feature_announcement', label: 'Feature Announcement' },
  { value: 'maintenance_start', label: 'Maintenance Notice' },
  { value: 'system_alert', label: 'System Alert' },
  { value: 'welcome', label: 'Welcome' },
  { value: 'daily_prompt', label: 'Daily Prompt' },
  { value: 'weekly_digest', label: 'Weekly Digest' },
]

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All Users', desc: 'Every registered user' },
  { value: 'premium', label: 'Premium Only', desc: 'Active premium subscribers' },
  { value: 'free', label: 'Free Only', desc: 'Free tier users' },
]

export default function BroadcastsPage() {
  const [templateKey, setTemplateKey] = useState('feature_announcement')
  const [subject, setSubject] = useState('')
  const [contentHtml, setContentHtml] = useState('')
  const [audience, setAudience] = useState('all')
  const [preview, setPreview] = useState(false)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ sent: number; failed: number; errors: any[] } | null>(null)
  const [error, setError] = useState('')

  const handleSend = async () => {
    if (!subject.trim() || !contentHtml.trim()) return
    setError('')
    setResult(null)
    setSending(true)

    try {
      const res = await fetch('/api/admin/emails/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateKey, subject, contentHtml, audience }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to send')
      setResult(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const previewHtml = preview ? `
    <div style="font-family: system-ui, sans-serif; padding: 24px; max-width: 600px; margin: 0 auto;">
      <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; border: 1px solid #e9ecef;">
        <h2 style="margin: 0 0 16px; font-size: 20px; color: #1a1a2e;">${subject || 'Subject'}</h2>
        <div style="color: #495057; line-height: 1.6;">${contentHtml || '<p>Your content will appear here...</p>'}</div>
      </div>
      <p style="margin-top: 16px; font-size: 12px; color: #868e96; text-align: center;">
        This is a preview. Actual email will use the ${templateKey} template branding.
      </p>
    </div>
  ` : ''

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/20">
          <Megaphone className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Broadcasts</h1>
          <p className="text-sm text-slate-500">Send announcements to your users</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900">Compose Message</h2>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Template Theme</Label>
              <select
                value={templateKey}
                onChange={(e) => setTemplateKey(e.target.value)}
                className="w-full h-11 px-3 rounded-xl bg-white border border-slate-300 text-slate-900 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              >
                {TEMPLATE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400">Controls the branded wrapper (colors, logo, footer) around your content.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium text-slate-700">Subject Line</Label>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. New reflection features are here!"
                className="h-11 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-slate-700">Email Content (HTML)</Label>
                <button
                  onClick={() => setPreview(!preview)}
                  className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1.5"
                >
                  {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  {preview ? 'Edit' : 'Preview'}
                </button>
              </div>
              {preview ? (
                <div
                  className="w-full min-h-[300px] rounded-xl bg-white border border-slate-200 p-4 overflow-auto"
                  dangerouslySetInnerHTML={{ __html: previewHtml }}
                />
              ) : (
                <textarea
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  placeholder='<p>Write your announcement here...</p><p>Use basic HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;a&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;</p>'
                  className="w-full min-h-[300px] p-4 rounded-xl bg-white border border-slate-300 text-slate-900 placeholder:text-slate-400 text-sm font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-y"
                />
              )}
              <p className="text-xs text-slate-400">Write basic HTML. It will be wrapped with the selected template branding.</p>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audience */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Audience</h2>
            <div className="space-y-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    audience === opt.value
                      ? 'bg-blue-50 border-blue-200'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="audience"
                    value={opt.value}
                    checked={audience === opt.value}
                    onChange={(e) => setAudience(e.target.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-slate-500" />
                      <p className="text-sm font-medium text-slate-900">{opt.label}</p>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 mb-4">Actions</h2>
            <Button
              onClick={handleSend}
              disabled={sending || !subject.trim() || !contentHtml.trim()}
              className="w-full h-11 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {sending ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
              ) : (
                <><Send className="h-4 w-4 mr-2" />Send Broadcast</>
              )}
            </Button>
            <p className="text-xs text-slate-400 mt-2 text-center">This cannot be undone. Double-check your content.</p>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="text-base font-semibold text-emerald-900">Broadcast Complete</h3>
              <p className="text-sm text-emerald-700">Sent to {result.sent} of {result.sent + result.failed} users ({result.failed} failed)</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-red-600">Failed deliveries:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {result.errors.map((e: any, i: number) => (
                  <p key={i} className="text-xs text-red-600">• {e.email}: {e.error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}