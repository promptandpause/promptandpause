"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Navigation from "../../Navigation"
import Footer from "../../footer"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { GraduationCap, Stethoscope, Check, AlertCircle, Loader2 } from "lucide-react"
import { useTheme } from "@/contexts/ThemeContext"
import { useLenis } from "@/hooks/useLenis"

function DiscountClaimContent() {
  useLenis()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const { theme } = useTheme()
  
  const [isLoading, setIsLoading] = useState(false)
  const [isVerifying, setIsVerifying] = useState(true)
  const [code, setCode] = useState("")
  const [discountType, setDiscountType] = useState<"student" | "nhs" | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [userEmail, setUserEmail] = useState("")
  const [checkoutUrl, setCheckoutUrl] = useState("")
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly")

  // Get code and type from URL params
  useEffect(() => {
    const urlCode = searchParams.get("code")
    const urlType = searchParams.get("type") as "student" | "nhs" | null
    
    if (urlCode) setCode(urlCode.toUpperCase())
    if (urlType) setDiscountType(urlType)
    
    setIsVerifying(false)
  }, [searchParams])

  // Check authentication status
  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await fetch("/api/auth/status")
        if (response.ok) {
          const data = await response.json()
          setIsAuthenticated(data.authenticated)
          if (data.user?.email) {
            setUserEmail(data.user.email)
          }
        }
      } catch (error) {
        console.error("Auth check failed:", error)
      }
    }
    
    checkAuth()
  }, [])

  const handleClaimDiscount = async () => {
    if (!code.trim() || !discountType || !isAuthenticated) {
      toast({
        title: "Missing information",
        description: "Please ensure you're signed in and have entered a valid code.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // Get user ID from auth
      const authResponse = await fetch("/api/auth/status")
      if (!authResponse.ok) {
        throw new Error("Authentication required")
      }
      
      const authData = await authResponse.json()
      const userId = authData.user?.id

      if (!userId) {
        throw new Error("User not found")
      }

      const response = await fetch("/api/discounts/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          discount_type: discountType,
          billing_cycle: billingCycle,
          verification_code: code.trim(),
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create discount checkout")
      }

      if (data.checkoutUrl) {
        setCheckoutUrl(data.checkoutUrl)
        window.location.href = data.checkoutUrl
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const discountInfo = {
    student: {
      name: "Student",
      icon: GraduationCap,
      bgClass: "bg-[#B3D9F2]",
      textClass: "text-[#1D9BF0]",
      description: "40% off for verified students",
      requirements: "Valid student email or student ID verification",
    },
    nhs: {
      name: "NHS Staff",
      icon: Stethoscope,
      bgClass: "bg-[#B3D9F2]",
      textClass: "text-[#1D9BF0]",
      description: "40% off for NHS employees",
      requirements: "NHS email address or staff ID verification",
    },
  }

  if (isVerifying) {
    return (
      <>
        <Navigation />
        <main className="min-h-screen bg-[#EFF3F4] text-[#0F1419] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Verifying discount...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const info = discountType ? discountInfo[discountType] : null
  const Icon = info?.icon || AlertCircle

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#EFF3F4] text-[#0F1419]">
        <div className="pt-24 pb-12 px-4 sm:px-6 bg-gradient-to-b from-[#F7F9FA] to-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#1D9BF0] mb-6">
              <Icon className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 leading-tight">
              {info ? `${info.name} Discount` : "Claim Your Discount"}
            </h1>
            <p className="text-lg sm:text-xl text-[#536471] max-w-2xl mx-auto">
              {info ? info.description : "Enter your discount code to claim your special offer"}
            </p>
          </div>
        </div>

        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            {/* Authentication Status */}
            <Card className={`p-6 mb-8 ${
              isAuthenticated 
                ? "bg-[#1D9BF0]/10 border-[#1D9BF0]" 
                : "bg-[#E8F5FE] border-[#B3D9F2]"
            }`}>
              <div className="flex items-center gap-3">
                {isAuthenticated ? (
                  <>
                    <Check className="w-5 h-5 text-[#1D9BF0]" />
                    <div>
                      <p className="font-medium text-[#0F1419]">Signed in as {userEmail}</p>
                      <p className="text-sm text-[#536471]">Ready to claim your discount</p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-5 h-5 text-[#8B98A5]" />
                    <div>
                      <p className="font-medium text-[#0F1419]">Sign in required</p>
                      <p className="text-sm text-[#536471]">You must be signed in to claim this discount</p>
                    </div>
                  </>
                )}
              </div>
              {!isAuthenticated && (
                <div className="mt-4">
                  <Button
                    onClick={() => router.push("/")}
                    className="bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white"
                  >
                    Sign In
                  </Button>
                </div>
              )}
            </Card>

            {/* Discount Info */}
            {info && (
              <Card className="p-6 mb-8">
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full ${info.bgClass} flex items-center justify-center flex-shrink-0`}>
                    <Icon className={`w-6 h-6 ${info.textClass}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold mb-2">{info.name} Discount Details</h3>
                    <p className="text-[#536471] mb-3">{info.description}</p>
                    <div className="bg-[#F7F9FA] p-3 rounded-lg">
                      <p className="text-sm font-medium text-[#536471] mb-1">Requirements:</p>
                      <p className="text-sm text-[#8B98A5]">{info.requirements}</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Claim Form */}
            <Card className="p-6 sm:p-8">
              <h2 className="text-2xl font-bold mb-6">Claim Your Discount</h2>
              
              <div className="space-y-6">
                {/* Discount Code */}
                <div>
                  <label className="block text-sm font-medium text-[#536471] mb-2">
                    Discount Code
                  </label>
                  <Input
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                    placeholder="Enter your discount code"
                    className="text-lg font-mono tracking-wider"
                    maxLength={10}
                  />
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-sm font-medium text-[#536471] mb-3">
                    Choose Billing Cycle
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setBillingCycle("monthly")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        billingCycle === "monthly"
                          ? "border-[#1D9BF0] bg-[#1D9BF0] text-white"
                          : "border-[#B3D9F2] hover:border-[#8B98A5]"
                      }`}
                    >
                      <div className="font-bold">Monthly</div>
                      <div className={`text-sm ${billingCycle === "monthly" ? "text-white/70" : "text-[#8B98A5]"}`}>
                        Pay monthly • 40% off
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setBillingCycle("annual")}
                      className={`p-4 rounded-xl border-2 text-left transition-all ${
                        billingCycle === "annual"
                          ? "border-[#1D9BF0] bg-[#1D9BF0] text-white"
                          : "border-[#B3D9F2] hover:border-[#8B98A5]"
                      }`}
                    >
                      <div className="font-bold">Annual</div>
                      <div className={`text-sm ${billingCycle === "annual" ? "text-white/70" : "text-[#8B98A5]"}`}>
                        Pay yearly • 40% off • Best value
                      </div>
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  onClick={handleClaimDiscount}
                  disabled={!code.trim() || !isAuthenticated || isLoading}
                  className="w-full py-4 text-lg font-semibold min-h-[56px] bg-[#1D9BF0] hover:bg-[#1A8CD8] text-white"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      Claim Discount - {billingCycle === "monthly" ? "Monthly" : "Annual"}
                    </>
                  )}
                </Button>

                <p className="text-center text-sm text-[#8B98A5]">
                  Discount will be applied at checkout. Limited time offer.
                </p>
              </div>
            </Card>

            {/* How It Works */}
            <div className="mt-12">
              <h3 className="text-xl font-bold mb-6 text-center">How It Works</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                  <h4 className="font-bold mb-2">Enter Code</h4>
                  <p className="text-[#8B98A5] text-sm">Input your unique discount code above</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                  <h4 className="font-bold mb-2">Choose Plan</h4>
                  <p className="text-[#8B98A5] text-sm">Select monthly or annual billing</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 rounded-full bg-[#1D9BF0] text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                  <h4 className="font-bold mb-2">Complete Payment</h4>
                  <p className="text-[#8B98A5] text-sm">40% discount applied automatically</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function DiscountClaimPage() {
  return (
    <Suspense fallback={
      <>
        <Navigation />
        <main className="min-h-screen bg-[#EFF3F4] text-[#0F1419] flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p>Loading discount page...</p>
          </div>
        </main>
        <Footer />
      </>
    }>
      <DiscountClaimContent />
    </Suspense>
  )
}
