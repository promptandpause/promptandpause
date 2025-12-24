"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return

    try {
      // Check if user has made a choice (accepted or never show again)
      const consentStatus = localStorage.getItem("cookieConsent")
      
      // If no consent status exists, show the popup
      if (!consentStatus) {
        // Small delay for better UX
        const timer = setTimeout(() => {
          setShowConsent(true)
        }, 1000)

        // Cleanup timeout on unmount
        return () => clearTimeout(timer)
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
    }
  }, [])

  const handleAccept = () => {
    try {
      // Save acceptance to localStorage (persists forever)
      localStorage.setItem("cookieConsent", "accepted")
      closePopup()
    } catch (error) {
      console.error('Error saving cookie consent:', error)
      closePopup()
    }
  }

  const handleNeverShowAgain = () => {
    try {
      // Save "never show" status to localStorage
      localStorage.setItem("cookieConsent", "never_show")
      closePopup()
    } catch (error) {
      console.error('Error saving cookie preference:', error)
      closePopup()
    }
  }

  const closePopup = () => {
    setIsClosing(true)
    setTimeout(() => {
      setShowConsent(false)
      setIsClosing(false)
    }, 300)
  }

  if (!showConsent) return null

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-md z-[9998] transition-opacity duration-300 ${
          isClosing ? "opacity-0" : "opacity-100"
        }`}
        onClick={closePopup}
      />

      {/* Cookie consent popup */}
      <div
        className={`fixed bottom-0 left-0 right-0 sm:bottom-8 sm:left-8 sm:right-auto sm:max-w-lg z-[9999] transition-all duration-300 ${
          isClosing ? "translate-y-full sm:translate-y-0 sm:translate-x-[-120%] opacity-0" : "translate-y-0 sm:translate-x-0 opacity-100"
        }`}
      >
        <div className="backdrop-blur-xl bg-black/80 border border-white/20 rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 m-0">
          {/* Close button */}
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
            aria-label="Close cookie consent"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cookie icon */}
          <div className="mb-5">
            <div className="w-14 h-14 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🍪</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-semibold text-white mb-3">
            We value your privacy
          </h3>

          {/* Description */}
          <p className="text-sm text-white/80 mb-6 leading-relaxed">
            We use cookies to enhance your experience, personalize content, and analyze our traffic. 
            By accepting, you help us provide you with the best possible service for your mental wellbeing journey.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {/* Accept button - Primary */}
            <button
              onClick={handleAccept}
              className="w-full bg-white text-black font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:bg-gray-100 touch-manipulation"
            >
              Accept Cookies
            </button>

            {/* Secondary actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={closePopup}
                className="flex-1 text-sm text-white/70 hover:text-white py-3 px-4 rounded-xl hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all touch-manipulation"
              >
                Remind me later
              </button>
              
              <button
                onClick={handleNeverShowAgain}
                className="flex-1 text-sm text-white/70 hover:text-white py-3 px-4 rounded-xl hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all touch-manipulation"
              >
                Never show again
              </button>
            </div>
          </div>

          {/* Learn more link */}
          <div className="mt-5 pt-5 border-t border-white/10">
            <a
              href="/homepage/cookie-policy"
              className="text-xs text-white/60 hover:text-white font-medium hover:underline transition-colors"
            >
              Learn more about our Cookie Policy →
            </a>
          </div>
        </div>
      </div>
    </>
  )
}
