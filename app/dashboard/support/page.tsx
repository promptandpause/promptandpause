"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { 
  ChevronRight, 
  LogOut, 
  Crown, 
  Archive, 
  Settings, 
  LayoutDashboard, 
  User, 
  LifeBuoy, 
  HelpCircle,
  Bug,
  CreditCard,
  MessageCircle,
  Send,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowLeft
} from "lucide-react"
import Link from "next/link"
import { getSupabaseClient } from "@/lib/supabase/client"
import { useTier } from "@/hooks/useTier"
import { useToast } from "@/hooks/use-toast"
import { useTranslation } from "@/hooks/useTranslation"
import { useTheme } from "@/contexts/ThemeContext"
import { BubbleBackground } from "@/components/ui/bubble-background"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { invalidateCacheOnLogout } from "@/lib/services/cacheService"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Support categories with icons and descriptions
const supportCategories = [
  {
    value: "general",
    label: "General Inquiry",
    icon: MessageCircle,
    description: "General questions about the platform",
    color: "text-blue-400 bg-blue-500/10 border-blue-400/30"
  },
  {
    value: "bug",
    label: "Report a Bug",
    icon: Bug,
    description: "Something isn't working correctly",
    color: "text-red-400 bg-red-500/10 border-red-400/30"
  },
  {
    value: "billing",
    label: "Billing & Subscription",
    icon: CreditCard,
    description: "Payment or subscription issues",
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-400/30"
  },
  {
    value: "feature",
    label: "Feature Request",
    icon: HelpCircle,
    description: "Suggest a new feature",
    color: "text-green-400 bg-green-500/10 border-green-400/30"
  },
  {
    value: "account",
    label: "Account & Privacy",
    icon: User,
    description: "Account settings and privacy concerns",
    color: "text-purple-400 bg-purple-500/10 border-purple-400/30"
  },
  {
    value: "other",
    label: "Other",
    icon: MessageCircle,
    description: "Something else",
    color: "text-gray-400 bg-gray-500/10 border-gray-400/30"
  }
]

export default function ContactSupportPage() {
  return (
    <AuthGuard redirectPath="/dashboard/support">
      <ContactSupportPageContent />
    </AuthGuard>
  )
}

function ContactSupportPageContent() {
  const router = useRouter()
  const supabase = getSupabaseClient()
  const { tier, features = {} } = useTier()
  const { toast } = useToast()
  const { t } = useTranslation()
  const { theme } = useTheme()
  
  const [userProfile, setUserProfile] = useState<{ full_name: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [ticketId, setTicketId] = useState<number | null>(null)
  
  // Form states
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium")

  // Load user profile
  useEffect(() => {
    async function loadUserProfile() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          router.push('/auth/signin')
          return
        }

        const response = await fetch('/api/user/profile')
        if (response.ok) {
          const { data } = await response.json()
          setUserProfile({
            full_name: data?.full_name || user.email?.split('@')[0] || 'User',
            email: user.email || ''
          })
        } else {
          setUserProfile({
            full_name: user.email?.split('@')[0] || 'User',
            email: user.email || ''
          })
        }
      } catch (error) {
      } finally {
        setLoading(false)
      }
    }

    loadUserProfile()
  }, [router, supabase])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!selectedCategory || !subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/support/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          subject,
          message,
          priority,
          userEmail: userProfile?.email,
          userName: userProfile?.full_name,
          tier
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitted(true)
        setTicketId(result.ticketId || null)
        toast({
          title: "Support Ticket Created!",
          description: `Ticket #${result.ticketId || 'created'}. We'll respond via email within 24-48 hours.`,
        })
        
        // Reset form after 5 seconds
        setTimeout(() => {
          setSelectedCategory("")
          setSubject("")
          setMessage("")
          setPriority("medium")
          setSubmitted(false)
          setTicketId(null)
        }, 5000)
      } else {
        throw new Error(result.error || 'Failed to send message')
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to send message. Please try again.",
        variant: "destructive"
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div 
      className="min-h-screen relative" 
      style={theme === 'light' 
        ? { background: 'linear-gradient(135deg, #f4f0eb 0%, #a1a79e 45%, #384c37 100%)' } 
        : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
    >
      {/* Animated Bubble Background */}
      <BubbleBackground 
        interactive
        className="fixed inset-0 -z-10"
      />
      {/* Themed background overlay */}
      <div className={`fixed inset-0 -z-10 ${
        theme === 'light' ? 'bg-white/35' : 'bg-black/25'
      }`} />

      <div className="relative z-10 p-3 md:p-6 grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 pb-24 md:pb-6">
        {/* Universal Sidebar - Desktop & Mobile */}
        <DashboardSidebar />

        {/* Main Content Area */}
        <div className="col-span-1 md:col-span-10 space-y-4 md:space-y-6">
          {/* Mobile Back Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className={theme === 'dark'
                ? 'text-white/90 hover:text-white bg-white/5 hover:bg-white/10 border border-white/20'
                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100 border-2 border-gray-300'
              }
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </div>

          {/* Header */}
          <Card className={`backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-lg ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            <div className="flex items-start gap-4">
              <div className={`p-4 rounded-2xl ${
                theme === 'dark'
                  ? 'bg-blue-500/10 border border-blue-400/30'
                  : 'bg-blue-100 border-2 border-blue-300'
              }`}>
                <HelpCircle className={`h-8 w-8 ${
                  theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                }`} />
              </div>
              <div className="flex-1">
                <h1 className={`text-2xl md:text-3xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Contact Support</h1>
                <p className={`text-sm md:text-base ${
                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  Need help? We're here for you. Fill out the form below and we'll get back to you within 24-48 hours.
                </p>
              </div>
            </div>
          </Card>

          {/* Support Form */}
          <Card className={`backdrop-blur-xl rounded-3xl p-6 md:p-8 shadow-lg ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            {submitted ? (
              <div className="text-center py-12">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  theme === 'dark'
                    ? 'bg-green-500/10 border border-green-400/30'
                    : 'bg-green-100 border-2 border-green-300'
                }`}>
                  <CheckCircle2 className={`h-8 w-8 ${
                    theme === 'dark' ? 'text-green-400' : 'text-green-600'
                  }`} />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-gray-900'
                }`}>Support Ticket Created!</h3>
                {ticketId && (
                  <p className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>
                    Ticket #{ticketId}
                  </p>
                )}
                <p className={`mb-2 ${
                  theme === 'dark' ? 'text-white/70' : 'text-gray-600'
                }`}>
                  We've received your request and will respond via email within 24-48 hours.
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                }`}>
                  Check your email inbox for updates and to continue the conversation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>What can we help you with? *</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {supportCategories.map((category) => {
                      const Icon = category.icon
                      const isSelected = selectedCategory === category.value
                      
                      return (
                        <button
                          key={category.value}
                          type="button"
                          onClick={() => setSelectedCategory(category.value)}
                          className={`p-4 rounded-xl transition-all duration-300 text-left ${
                            isSelected
                              ? theme === 'dark'
                                ? 'bg-blue-500/20 border-2 border-blue-400 shadow-lg scale-[1.02]'
                                : 'bg-blue-100 border-2 border-blue-400 shadow-lg scale-[1.02]'
                              : theme === 'dark'
                                ? 'border border-white/20 bg-white/5 hover:bg-white/10'
                                : 'border-2 border-gray-300 bg-white hover:bg-gray-50 hover:border-gray-400 shadow-sm'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 mt-0.5 ${
                              isSelected
                                ? theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                                : theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${
                                isSelected
                                  ? theme === 'dark' ? 'text-white' : 'text-gray-900'
                                  : theme === 'dark' ? 'text-white/90' : 'text-gray-900'
                              }`}>
                                {category.label}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isSelected
                                  ? theme === 'dark' ? 'text-white/70' : 'text-gray-700'
                                  : theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                              }`}>
                                {category.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Priority Level */}
                <div className="space-y-2">
                  <Label htmlFor="priority" className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Priority</Label>
                  <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                    <SelectTrigger 
                      id="priority"
                      className={`h-12 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/10 border border-white/20 text-white focus:border-blue-400'
                          : 'bg-white border-2 border-gray-300 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark'
                      ? 'bg-black/90 border border-white/20'
                      : 'bg-white border-2 border-gray-300'
                    }>
                      <SelectItem value="low" className={theme === 'dark'
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100'
                      }>
                        Low - General inquiry
                      </SelectItem>
                      <SelectItem value="medium" className={theme === 'dark'
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100'
                      }>
                        Medium - Need assistance
                      </SelectItem>
                      <SelectItem value="high" className={theme === 'dark'
                        ? 'text-white hover:bg-white/10'
                        : 'text-gray-900 hover:bg-gray-100'
                      }>
                        High - Urgent issue
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`h-12 rounded-xl ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400'
                        : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-gray-900'
                  }`}>Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide as much detail as possible..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className={`rounded-xl resize-none ${
                      theme === 'dark'
                        ? 'bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:border-blue-400'
                        : 'bg-white border-2 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                  }`}>
                    {message.length} / 2000 characters
                  </p>
                </div>

                {/* User Info Display */}
                <Card className={`p-4 rounded-xl shadow-sm ${
                  theme === 'dark'
                    ? 'bg-white/5 border border-white/10'
                    : 'bg-gray-50 border-2 border-gray-300'
                }`}>
                  <p className={`text-xs mb-2 ${
                    theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                  }`}>Your message will be sent from:</p>
                  <div className="flex items-center gap-3">
                    <User className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                    }`} />
                    <div>
                      <p className={`font-medium text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}>{userProfile?.full_name}</p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-white/60' : 'text-gray-600'
                      }`}>{userProfile?.email}</p>
                    </div>
                  </div>
                </Card>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || !selectedCategory || !subject.trim() || !message.trim()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold transition-all duration-300 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-5 w-5 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>

                <p className={`text-xs text-center ${
                  theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                }`}>
                  Response time: 24-48 hours during business hours
                </p>
              </form>
            )}
          </Card>

          {/* FAQ Quick Links */}
          <Card className={`backdrop-blur-xl rounded-3xl p-6 shadow-lg ${
            theme === 'dark'
              ? 'bg-white/5 border border-white/10'
              : 'bg-white/80 border-2 border-gray-300'
          }`}>
            <h3 className={`font-bold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}>
              <AlertCircle className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`} />
              Before you reach out...
            </h3>
            <div className="space-y-2">
              <Link href="/research" target="_blank" rel="noopener noreferrer" className={`block transition-colors text-sm hover:underline ${
                theme === 'dark' ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                • Check our Help Center for common questions
              </Link>
              <Link href="/dashboard/settings" className={`block transition-colors text-sm hover:underline ${
                theme === 'dark' ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'
              }`}>
                • Review your account settings
              </Link>
              <Link href="/crisis-resources" className="block text-red-600 hover:text-red-800 transition-colors text-sm font-medium hover:underline">
                • Need immediate help? View Crisis Resources
              </Link>
            </div>
          </Card>
        </div>

      </div>
    </div>
  )
}
