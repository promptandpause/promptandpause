'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Send, AlertCircle, CheckCircle2, Loader2, Eye, Users, EyeOff } from 'lucide-react'

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
    <div className="mx-auto max-w-4xl space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Broadcasts</h1>
        <p className="text-muted-foreground">Send announcements to your users</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Composer */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle>Compose Message</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Template Theme</Label>
                <select
                  value={templateKey}
                  onChange={(e) => setTemplateKey(e.target.value)}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  {TEMPLATE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Controls the branded wrapper (colors, logo, footer) around your content.</p>
              </div>

              <div className="space-y-2">
                <Label>Subject Line</Label>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. New reflection features are here!"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Email Content (HTML)</Label>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setPreview(!preview)}
                    className="h-8 px-2"
                  >
                    {preview ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    {preview ? 'Edit' : 'Preview'}
                  </Button>
                </div>
                {preview ? (
                  <div
                    className="w-full min-h-[300px] rounded-md bg-card border p-4 overflow-auto"
                    dangerouslySetInnerHTML={{ __html: previewHtml }}
                  />
                ) : (
                  <textarea
                    value={contentHtml}
                    onChange={(e) => setContentHtml(e.target.value)}
                    placeholder='<p>Write your announcement here...</p><p>Use basic HTML tags: &lt;h2&gt;, &lt;p&gt;, &lt;a&gt;, &lt;strong&gt;, &lt;ul&gt;, &lt;li&gt;</p>'
                    className="w-full min-h-[300px] p-4 rounded-md bg-card border border-input text-foreground placeholder:text-muted-foreground text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-y"
                  />
                )}
                <p className="text-xs text-muted-foreground">Write basic HTML. It will be wrapped with the selected template branding.</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Audience */}
          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle className="mb-1">Audience</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {AUDIENCE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    audience === opt.value
                      ? 'bg-primary/10 border-primary/30'
                      : 'bg-card border hover:bg-muted'
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
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium text-foreground">{opt.label}</p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{opt.desc}</p>
                  </div>
                </label>
              ))}
            </CardContent>
          </Card>

          {/* Actions */}
          <Card className="shadow-none border">
            <CardHeader>
              <CardTitle className="mb-1">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleSend}
                disabled={sending || !subject.trim() || !contentHtml.trim()}
                className="w-full"
              >
                {sending ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</>
                ) : (
                  <><Send className="h-4 w-4 mr-2" />Send Broadcast</>
                )}
              </Button>
              <p className="text-xs text-muted-foreground mt-2 text-center">This cannot be undone. Double-check your content.</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4">
          <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
          <p className="text-sm text-destructive">{error}</p>
        </div>
      )}

      {/* Result */}
      {result && (
        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            <div>
              <h3 className="text-base font-semibold text-emerald-600">Broadcast Complete</h3>
              <p className="text-sm text-emerald-600/90">Sent to {result.sent} of {result.sent + result.failed} users ({result.failed} failed)</p>
            </div>
          </div>
          {result.errors?.length > 0 && (
            <div className="mt-3 space-y-1">
              <p className="text-xs font-medium text-destructive">Failed deliveries:</p>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {result.errors.map((e: any, i: number) => (
                  <p key={i} className="text-xs text-destructive">• {e.email}: {e.error}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}