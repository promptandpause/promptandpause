'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { EmailTemplateWithCustomization } from '@/lib/types/emailTemplate'
import { Send, Loader2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SendTestEmailProps {
  template: EmailTemplateWithCustomization
}

export default function SendTestEmail({ template }: SendTestEmailProps) {
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [sampleData, setSampleData] = useState<Record<string, string>>(() => {
    const initialData: Record<string, string> = {}
    template.variables.forEach((variable) => {
      initialData[variable] = `Sample ${variable}`
    })
    initialData.userName = 'John Doe'
    initialData.email = 'john@example.com'
    return initialData
  })

  async function handleSendTest() {
    if (!email || !email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address',
        variant: 'destructive',
      })
      return
    }

    try {
      setSending(true)
      const response = await fetch(`/api/admin/email-templates/${template.id}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: email,
          sampleData,
          customization: template.customization,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to send test email')
      }

      toast({
        title: 'Test Email Sent',
        description: `Email sent successfully to ${email}`,
      })
      
      setEmail('')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to send test email',
        variant: 'destructive',
      })
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="bg-white border border-gray-100 p-6 space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Send Test Email</h3>
        <p className="text-sm text-gray-500">Send a test email to preview how it looks</p>
      </div>

      {/* Recipient Email */}
      <div>
        <Label className="text-gray-700">Recipient Email</Label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="bg-white border-gray-200 text-gray-900"
        />
      </div>

      {/* Sample Data Fields */}
      <div className="space-y-4">
        <Label className="text-gray-700">Sample Data</Label>
        {template.variables.map((variable) => (
          <div key={variable}>
            <Label className="text-xs text-gray-500 capitalize">
              {variable.replace(/_/g, ' ')}
            </Label>
            <Input
              value={sampleData[variable] || ''}
              onChange={(e) =>
                setSampleData({ ...sampleData, [variable]: e.target.value })
              }
              className="bg-white border-gray-200 text-gray-900 text-sm"
              placeholder={`Sample ${variable}`}
            />
          </div>
        ))}
      </div>

      {/* Send Button */}
      <Button
        onClick={handleSendTest}
        disabled={sending || !email}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {sending ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Sending...
          </>
        ) : (
          <>
            <Send className="h-4 w-4 mr-2" />
            Send Test Email
          </>
        )}
      </Button>

      {/* Info */}
      <div className="text-xs text-gray-500 space-y-1 border-t border-gray-100 pt-4">
        <p>Rate limit: 5 test emails per hour</p>
        <p>Uses current template customization</p>
        <p>Check spam folder if not received</p>
      </div>
    </Card>
  )
}
