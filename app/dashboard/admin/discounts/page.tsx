"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Stethoscope, Search, Mail, Check, X, Loader2 } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"

interface User {
  id: string
  email: string
  full_name: string | null
  created_at: string
  subscription_status?: string
}

interface DiscountCode {
  id: string
  code: string
  discount_type: 'student' | 'nhs'
  user_id: string
  used: boolean
  used_by?: string
  created_at: string
  expires_at: string
  admin_notes?: string
}

export default function DiscountsAdminPage() {
  const { toast } = useToast()
  const { theme } = useTheme()
  
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [discountType, setDiscountType] = useState<'student' | 'nhs'>('student')
  const [adminNotes, setAdminNotes] = useState("")
  const [isSearching, setIsSearching] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [recentCodes, setRecentCodes] = useState<DiscountCode[]>([])

  // Search for users
  const searchUsers = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      const response = await fetch(`/api/admin/users/search?q=${encodeURIComponent(searchQuery.trim())}`)
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data.users || [])
      } else {
        setSearchResults([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers()
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Send discount link
  const sendDiscountLink = async () => {
    if (!selectedUser) {
      toast({
        title: "No user selected",
        description: "Please search and select a user first.",
        variant: "destructive",
      })
      return
    }

    setIsSending(true)
    try {
      const response = await fetch("/api/discounts/send-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: selectedUser.id,
          discount_type: discountType,
          admin_email: "admin@promptandpause.com", // This should come from current admin user
          admin_notes: adminNotes.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to send discount link")
      }

      toast({
        title: "Discount sent!",
        description: `Discount code ${data.code} sent to ${data.userEmail}`,
      })

      // Reset form
      setSelectedUser(null)
      setSearchQuery("")
      setSearchResults([])
      setAdminNotes("")
      
      // Refresh recent codes
      fetchRecentCodes()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to send discount link",
        variant: "destructive",
      })
    } finally {
      setIsSending(false)
    }
  }

  // Fetch recent discount codes
  const fetchRecentCodes = async () => {
    try {
      const response = await fetch("/api/admin/discounts/recent")
      if (response.ok) {
        const data = await response.json()
        setRecentCodes(data.codes || [])
      }
    } catch (error) {
      console.error('Failed to fetch recent codes:', error)
    }
  }

  useEffect(() => {
    fetchRecentCodes()
  }, [])

  const discountInfo = {
    student: {
      name: "Student",
      icon: GraduationCap,
      color: "blue",
      description: "40% off for students",
    },
    nhs: {
      name: "NHS Staff", 
      icon: Stethoscope,
      color: "green",
      description: "40% off for NHS employees",
    },
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discount Management</h1>
          <p className="text-neutral-600">Send discount codes to verified students and NHS staff</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Send Discount Form */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Send Discount Code</h2>
            
            {/* User Search */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Search for User
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="pl-10"
                />
                {isSearching && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-neutral-400" />
                )}
              </div>
              
              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mt-2 border border-neutral-200 rounded-lg max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => {
                        setSelectedUser(user)
                        setSearchResults([])
                        setSearchQuery(user.email)
                      }}
                      className="w-full text-left p-3 hover:bg-neutral-50 border-b border-neutral-100 last:border-b-0"
                    >
                      <div className="font-medium">{user.full_name || 'No name'}</div>
                      <div className="text-sm text-neutral-500">{user.email}</div>
                      {user.subscription_status && (
                        <Badge variant="outline" className="mt-1 text-xs">
                          {user.subscription_status}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected User */}
            {selectedUser && (
              <div className="mb-6 p-4 bg-neutral-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{selectedUser.full_name || 'No name'}</div>
                    <div className="text-sm text-neutral-500">{selectedUser.email}</div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null)
                      setSearchQuery("")
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Discount Type */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-3">
                Discount Type
              </label>
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(discountInfo).map(([type, info]) => {
                  const Icon = info.icon
                  return (
                    <button
                      key={type}
                      onClick={() => setDiscountType(type as 'student' | 'nhs')}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        discountType === type
                          ? "border-black bg-black text-white"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Icon className="w-5 h-5" />
                        <span className="font-bold">{info.name}</span>
                      </div>
                      <div className={`text-sm ${discountType === type ? "text-white/70" : "text-neutral-500"}`}>
                        {info.description}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Admin Notes */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Admin Notes (Optional)
              </label>
              <Input
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                placeholder="Verification method, student ID, etc."
                maxLength={500}
              />
            </div>

            {/* Send Button */}
            <Button
              onClick={sendDiscountLink}
              disabled={!selectedUser || isSending}
              className="w-full"
            >
              {isSending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Send Discount Code
                </>
              )}
            </Button>
          </Card>

          {/* Recent Codes */}
          <Card className="p-6">
            <h2 className="text-xl font-bold mb-6">Recent Discount Codes</h2>
            
            {recentCodes.length === 0 ? (
              <p className="text-neutral-500 text-center py-8">No discount codes sent yet</p>
            ) : (
              <div className="space-y-3">
                {recentCodes.map((code) => (
                  <div key={code.id} className="p-4 border border-neutral-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{code.code}</span>
                        <Badge variant={code.discount_type === 'student' ? 'default' : 'secondary'}>
                          {code.discount_type === 'student' ? 'Student' : 'NHS'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        {code.used ? (
                          <>
                            <Check className="w-4 h-4 text-green-600" />
                            <span className="text-sm text-green-600">Used</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 bg-amber-500 rounded-full" />
                            <span className="text-sm text-amber-600">Pending</span>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-sm text-neutral-500">
                      Created: {new Date(code.created_at).toLocaleDateString()}
                      {code.expires_at && ` • Expires: ${new Date(code.expires_at).toLocaleDateString()}`}
                    </div>
                    
                    {code.admin_notes && (
                      <div className="text-sm text-neutral-600 mt-1 italic">
                        Notes: {code.admin_notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Instructions */}
        <Card className="p-6 mt-8">
          <h3 className="text-lg font-bold mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
            <div>
              <h4 className="font-medium mb-2">1. Verify User</h4>
              <p className="text-neutral-600">
                Search for the user by email or name. Ensure they have an existing account and no active subscription.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">2. Send Code</h4>
              <p className="text-neutral-600">
                Select discount type, add verification notes, and send. User receives email with unique discount code.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-2">3. User Claims</h4>
              <p className="text-neutral-600">
                User signs in, enters code, and completes payment with 40% discount applied automatically.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
