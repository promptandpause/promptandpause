"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Navigation from "../Navigation"
import Footer from "../footer"
import { Gift, Check, Loader2, Heart, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useLenis } from "@/hooks/useLenis"

const GIFT_OPTIONS = [
  {
    months: 1,
    price: "£15",
    priceValue: 15,
    label: "1 Month",
    description: "A thoughtful start",
    popular: false,
  },
  {
    months: 3,
    price: "£36",
    priceValue: 36,
    label: "3 Months",
    description: "Most popular gift",
    popular: true,
    savings: "Save £9",
  },
  {
    months: 6,
    price: "£69",
    priceValue: 69,
    label: "6 Months",
    description: "Best value",
    popular: false,
    savings: "Save £21",
  },
]

export default function GiftPurchasePage() {
  useLenis()
  const router = useRouter()
  const { toast } = useToast()
  
  const [selectedMonths, setSelectedMonths] = useState<number>(3)
  const [purchaserName, setPurchaserName] = useState("")
  const [purchaserEmail, setPurchaserEmail] = useState("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [giftMessage, setGiftMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!purchaserName.trim() || !purchaserEmail.trim()) {
      toast({
        title: "Missing information",
        description: "Please enter your name and email address.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    
    try {
      const response = await fetch("/api/gifts/create-checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration_months: selectedMonths.toString(),
          purchaser_name: purchaserName.trim(),
          purchaser_email: purchaserEmail.trim(),
          recipient_email: recipientEmail.trim() || undefined,
          gift_message: giftMessage.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to create checkout")
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      })
      setIsLoading(false)
    }
  }

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-slate-100 text-slate-900">
        {/* Hero Section */}
        <div className="pt-24 pb-12 px-4 sm:px-6 bg-gradient-to-b from-slate-50 to-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-indigo-600 mb-6">
              <Gift className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              Gift Premium to Someone Special
            </h1>
            <p className="text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto">
              Know someone navigating a challenging time? Gift them daily reflection prompts and the space to process their thoughts.
            </p>
          </div>
        </div>

        {/* Gift Selection & Form */}
        <div className="px-4 sm:px-6 py-12 sm:py-16">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handlePurchase} className="space-y-8 sm:space-y-12">
              {/* Duration Selection */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-6">Choose Duration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {GIFT_OPTIONS.map((option) => (
                    <button
                      key={option.months}
                      type="button"
                      onClick={() => setSelectedMonths(option.months)}
                      className={`relative p-5 sm:p-6 rounded-2xl border-2 text-left transition-all duration-300 touch-manipulation ${
                        selectedMonths === option.months
                          ? "border-indigo-600 bg-indigo-600 text-white shadow-xl scale-[1.02]"
                          : "border-slate-200 bg-white hover:border-slate-400 hover:shadow-lg"
                      }`}
                    >
                      {option.popular && (
                        <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 text-white text-xs font-medium rounded-full whitespace-nowrap">
                          Most Popular
                        </span>
                      )}
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-lg sm:text-xl font-bold">{option.label}</p>
                          <p className={`text-sm ${selectedMonths === option.months ? "text-white/70" : "text-slate-500"}`}>
                            {option.description}
                          </p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          selectedMonths === option.months
                            ? "border-white bg-white"
                            : "border-slate-200"
                        }`}>
                          {selectedMonths === option.months && (
                            <Check className="w-4 h-4 text-slate-900" />
                          )}
                        </div>
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl sm:text-3xl font-bold">{option.price}</span>
                        {option.savings && (
                          <span className={`text-sm font-medium ${
                            selectedMonths === option.months ? "text-green-300" : "text-indigo-600"
                          }`}>
                            {option.savings}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Your Details */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-6">Your Details</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Your Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={purchaserName}
                      onChange={(e) => setPurchaserName(e.target.value)}
                      placeholder="Your name"
                      required
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all touch-manipulation bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Your Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={purchaserEmail}
                      onChange={(e) => setPurchaserEmail(e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all touch-manipulation bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Recipient Details (Optional) */}
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Recipient Details</h2>
                <p className="text-slate-500 mb-6 text-sm sm:text-base">
                  Optional: We'll send the gift code directly to them, or leave blank to send it to yourself.
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Recipient Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="recipient@example.com"
                      className="w-full h-12 px-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all touch-manipulation bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">
                      Personal Message (Optional)
                    </label>
                    <textarea
                      value={giftMessage}
                      onChange={(e) => setGiftMessage(e.target.value)}
                      placeholder="Add a personal note for the recipient..."
                      rows={3}
                      maxLength={500}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all resize-none touch-manipulation bg-white"
                    />
                    <p className="text-xs text-slate-500 mt-1 text-right">
                      {giftMessage.length}/500 characters
                    </p>
                  </div>
                </div>
              </div>

              {/* What They'll Get */}
              <div className="bg-slate-50 rounded-2xl p-6 sm:p-8">
                <div className="flex items-center gap-3 mb-4">
                  <Sparkles className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-lg font-bold">What They'll Get</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm sm:text-base">
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Daily personalized reflection prompts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Unlimited reflection archive</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Weekly AI-generated insights</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Voice note prompts</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Email + Slack delivery</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-5 h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                    <span>Export reflections</span>
                  </div>
                </div>
              </div>

              {/* Purchase Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-14 sm:h-16 bg-indigo-600 text-white text-lg font-semibold rounded-xl hover:bg-indigo-500 transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 touch-manipulation"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Heart className="w-5 h-5" />
                      Purchase Gift - {GIFT_OPTIONS.find(o => o.months === selectedMonths)?.price}
                    </>
                  )}
                </button>
                <p className="text-center text-sm text-slate-500 mt-4">
                  Secure payment via Stripe. Gift codes never expire.
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* How It Works */}
        <div className="px-4 sm:px-6 py-12 sm:py-16 bg-slate-50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 sm:mb-12 text-center">How Gift Subscriptions Work</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">1</div>
                <h3 className="font-bold mb-2">Purchase</h3>
                <p className="text-slate-500 text-sm sm:text-base">Complete checkout securely via Stripe</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">2</div>
                <h3 className="font-bold mb-2">Receive Code</h3>
                <p className="text-slate-500 text-sm sm:text-base">Gift code sent to you or directly to recipient</p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-600 text-white flex items-center justify-center mx-auto mb-4 text-xl font-bold">3</div>
                <h3 className="font-bold mb-2">Redeem</h3>
                <p className="text-slate-500 text-sm sm:text-base">Recipient creates account and redeems at /gifts/redeem</p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
