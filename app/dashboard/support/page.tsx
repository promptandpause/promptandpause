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
import { DashboardSidebar } from "../components/DashboardSidebar"
import { IconOrb } from "@/components/ui/accent-card"
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
  const [ticketId, setTicketId] = useState<string | null>(null)
  
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
          router.push('/login')
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
    
    if (!userProfile?.email || !userProfile?.full_name) {
      toast({
        title: "Missing Information",
        description: "Please wait for your profile to load before submitting.",
        variant: "destructive"
      })
      return
    }

    if (!selectedCategory || !subject.trim() || !message.trim()) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive"
      })
      return
    }

    if (subject.trim().length < 3) {
      toast({
        title: "Invalid Subject",
        description: "Subject must be at least 3 characters.",
        variant: "destructive"
      })
      return
    }

    if (message.trim().length < 10) {
      toast({
        title: "Invalid Message",
        description: "Message must be at least 10 characters.",
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
          userEmail: userProfile.email,
          userName: userProfile.full_name,
          tier
        })
      })

      const result = await response.json()

      if (response.ok && result.success) {
        setSubmitted(true)
        setTicketId(typeof result.ticketId === 'string' ? result.ticketId : null)
        toast({
          title: "Support Ticket Created!",
          description: `Ticket created. We'll respond via email within 24-48 hours.`,
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
      data-dashboard
      className={`min-h-screen ${theme === 'dark' ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}
    >
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1280px] mx-auto px-4 md:px-8 lg:px-10 pt-16 md:pt-10">
          <div className="space-y-5 md:space-y-6">
          {/* Mobile Back Button */}
          <div className="md:hidden">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className={theme === 'dark'
                ? 'text-white/90 hover:text-white bg-white/5 hover:bg-white/8 border border-white/10'
                : 'text-[#5A5A4E] hover:text-[#3D3D3D] hover:bg-[#F0EDE6] border border-[#E8E5DE]'
              }
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back
            </Button>
          </div>

          {/* Header */}
          <Card className={`rounded-2xl p-5 md:p-8 border shadow-none ${
            theme === 'dark'
              ? 'bg-white/[0.04] border-white/[0.06]'
              : 'bg-white/70 border-[#E8E5DE]'
          }`}>
            <div className="flex items-start gap-4">
              <IconOrb accent="blue" size="lg">
                <LifeBuoy className="w-7 h-7 text-white" strokeWidth={1.75} />
              </IconOrb>
              <div className="flex-1">
                <h1 className={`text-2xl md:text-3xl font-semibold tracking-tight mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                }`}>Contact Support</h1>
                <p className={`text-sm md:text-base ${
                  theme === 'dark' ? 'text-white/50' : 'text-[#8A8A7A]'
                }`}>
                  Need help? We're here for you. Fill out the form below and we'll get back to you within 24-48 hours.
                </p>
              </div>
            </div>
          </Card>

          {/* Support Form */}
          <Card className={`rounded-2xl p-5 md:p-8 border shadow-none ${
            theme === 'dark'
              ? 'bg-white/[0.04] border-white/[0.06]'
              : 'bg-white/70 border-[#E8E5DE]'
          }`}>
            {submitted ? (
              <div className="text-center py-12">
                <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                  theme === 'dark'
                    ? 'bg-green-500/10 border border-green-400/20'
                    : 'bg-[#D4E8D4] border border-[#B8D4B8]'
                }`}>
                  <CheckCircle2 className={`h-8 w-8 ${
                    theme === 'dark' ? 'text-green-400' : 'text-[#5A8A5A]'
                  }`} />
                </div>
                <h3 className={`text-xl font-semibold mb-2 ${
                  theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                }`}>Support Ticket Created!</h3>
                {ticketId && (
                  <p className={`text-lg font-semibold mb-2 ${
                    theme === 'dark' ? 'text-blue-400' : 'text-[#1D9BF0]'
                  }`}>
                    Ticket ID: {ticketId}
                  </p>
                )}
                <p className={`mb-2 ${
                  theme === 'dark' ? 'text-white/50' : 'text-[#5A5A4E]'
                }`}>
                  We've received your request and will respond via email within 24-48 hours.
                </p>
                <p className={`text-sm ${
                  theme === 'dark' ? 'text-white/30' : 'text-[#8A8A7A]'
                }`}>
                  Check your email inbox for updates and to continue the conversation.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Category Selection */}
                <div className="space-y-3">
                  <Label className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
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
                                ? 'bg-blue-500/15 border-2 border-blue-400/50 shadow-sm'
                                : 'bg-[#E8F5FE] border-2 border-[#1D9BF0] shadow-sm'
                              : theme === 'dark'
                                ? 'border border-white/10 bg-white/5 hover:bg-white/8'
                                : 'border border-[#E8E5DE] bg-white hover:bg-[#FAFAF7]'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <Icon className={`h-5 w-5 mt-0.5 ${
                              isSelected
                                ? theme === 'dark' ? 'text-blue-400' : 'text-[#5B7FA5]'
                                : theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm ${
                                isSelected
                                  ? theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                                  : theme === 'dark' ? 'text-white/80' : 'text-[#3D3D3D]'
                              }`}>
                                {category.label}
                              </p>
                              <p className={`text-xs mt-1 ${
                                isSelected
                                  ? theme === 'dark' ? 'text-white/60' : 'text-[#5A5A4E]'
                                  : theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
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
                    theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                  }`}>Priority</Label>
                  <Select value={priority} onValueChange={(value: "low" | "medium" | "high") => setPriority(value)}>
                    <SelectTrigger 
                      id="priority"
                      className={`h-12 rounded-xl ${
                        theme === 'dark'
                          ? 'bg-white/8 border border-white/10 text-white focus:border-white/20'
                          : 'bg-white border border-[#E8E5DE] text-[#3D3D3D] focus:border-[#B8C9E0]'
                      }`}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className={theme === 'dark'
                      ? 'bg-[#1A1F2E] border border-white/10'
                      : 'bg-[#FAFAF7] border border-[#E8E5DE]'
                    }>
                      <SelectItem value="low" className={theme === 'dark'
                        ? 'text-white hover:bg-white/8'
                        : 'text-[#3D3D3D] hover:bg-[#F0EDE6]'
                      }>
                        Low - General inquiry
                      </SelectItem>
                      <SelectItem value="medium" className={theme === 'dark'
                        ? 'text-white hover:bg-white/8'
                        : 'text-[#3D3D3D] hover:bg-[#F0EDE6]'
                      }>
                        Medium - Need assistance
                      </SelectItem>
                      <SelectItem value="high" className={theme === 'dark'
                        ? 'text-white hover:bg-white/8'
                        : 'text-[#3D3D3D] hover:bg-[#F0EDE6]'
                      }>
                        High - Urgent issue
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Subject */}
                <div className="space-y-2">
                  <Label htmlFor="subject" className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                  }`}>Subject *</Label>
                  <Input
                    id="subject"
                    type="text"
                    placeholder="Brief description of your issue"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    className={`h-12 rounded-xl ${
                      theme === 'dark'
                        ? 'bg-white/8 border border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border border-[#E8E5DE] text-[#3D3D3D] placeholder:text-[#A0A090] focus:border-[#B8C9E0]'
                    }`}
                    required
                  />
                </div>

                {/* Message */}
                <div className="space-y-2">
                  <Label htmlFor="message" className={`font-semibold ${
                    theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                  }`}>Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Please provide as much detail as possible..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    rows={8}
                    className={`rounded-xl resize-none ${
                      theme === 'dark'
                        ? 'bg-white/8 border border-white/10 text-white placeholder:text-white/40 focus:border-white/20'
                        : 'bg-white border border-[#E8E5DE] text-[#3D3D3D] placeholder:text-[#A0A090] focus:border-[#B8C9E0]'
                    }`}
                    required
                  />
                  <p className={`text-xs mt-1 ${
                    theme === 'dark' ? 'text-white/30' : 'text-[#A0A090]'
                  }`}>
                    {message.length} / 2000 characters
                  </p>
                </div>

                {/* User Info Display */}
                <Card className={`p-4 rounded-xl border shadow-none ${
                  theme === 'dark'
                    ? 'bg-white/[0.04] border-white/[0.06]'
                    : 'bg-[#F0EDE6] border-[#E8E5DE]'
                }`}>
                  <p className={`text-xs mb-2 ${
                    theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
                  }`}>Your message will be sent from:</p>
                  <div className="flex items-center gap-3">
                    <User className={`h-5 w-5 ${
                      theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
                    }`} />
                    <div>
                      <p className={`font-medium text-sm ${
                        theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
                      }`}>{userProfile?.full_name}</p>
                      <p className={`text-xs ${
                        theme === 'dark' ? 'text-white/40' : 'text-[#8A8A7A]'
                      }`}>{userProfile?.email}</p>
                    </div>
                  </div>
                </Card>

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={submitting || !userProfile?.email || !userProfile?.full_name || !selectedCategory || !subject.trim() || !message.trim()}
                  className={`w-full h-12 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${theme === 'dark' ? 'bg-[#C4B5E0] text-[#1A1A2E] hover:bg-[#B0A0D0]' : 'bg-[#7E6BA5] text-white hover:bg-[#6B5A90]'}`}
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
                  theme === 'dark' ? 'text-white/30' : 'text-[#A0A090]'
                }`}>
                  Response time: 24-48 hours during business hours
                </p>
              </form>
            )}
          </Card>

          {/* FAQ Quick Links */}
          <Card className={`rounded-2xl p-5 md:p-6 border shadow-none ${
            theme === 'dark'
              ? 'bg-white/[0.04] border-white/[0.06]'
              : 'bg-white/70 border-[#E8E5DE]'
          }`}>
            <h3 className={`font-semibold mb-4 flex items-center gap-2 ${
              theme === 'dark' ? 'text-white' : 'text-[#3D3D3D]'
            }`}>
              <AlertCircle className={`h-5 w-5 ${
                theme === 'dark' ? 'text-blue-400' : 'text-[#5B7FA5]'
              }`} />
              Before you reach out...
            </h3>
            <div className="space-y-2">
              <Link href="/research" target="_blank" rel="noopener noreferrer" className={`block transition-colors text-sm hover:underline ${
                theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-[#8A8A7A] hover:text-[#3D3D3D]'
              }`}>
                • Check our Help Center for common questions
              </Link>
              <Link href="/dashboard/settings" className={`block transition-colors text-sm hover:underline ${
                theme === 'dark' ? 'text-white/50 hover:text-white' : 'text-[#8A8A7A] hover:text-[#3D3D3D]'
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
        </main>
      </div>
    </div>
  )
}
