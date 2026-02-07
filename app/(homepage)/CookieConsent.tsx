"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"

const COOKIE_CONSENT_STATUS_KEY = "cookieConsent"
const COOKIE_CONSENT_VERSION_KEY = "cookieConsentVersion"
// Bump this when you make a material change to cookie policy/handling
const COOKIE_CONSENT_VERSION = "v1"

export default function CookieConsent() {
  const [showConsent, setShowConsent] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    // Check if we're in the browser
    if (typeof window === 'undefined') return

    try {
      // Check if user has made a choice (accepted or never show again) and version matches
      const consentStatus = localStorage.getItem(COOKIE_CONSENT_STATUS_KEY)
      const consentVersion = localStorage.getItem(COOKIE_CONSENT_VERSION_KEY)

      const hasValidConsent =
        consentStatus &&
        (consentStatus === "accepted" || consentStatus === "never_show") &&
        consentVersion === COOKIE_CONSENT_VERSION

      if (!hasValidConsent) {
        setShowConsent(true)
      }
    } catch (error) {
    }
  }, [])

  const handleAccept = () => {
    try {
      // Save acceptance to localStorage (persists across redeploys until version bump)
      localStorage.setItem(COOKIE_CONSENT_STATUS_KEY, "accepted")
      localStorage.setItem(COOKIE_CONSENT_VERSION_KEY, COOKIE_CONSENT_VERSION)
      // Set cookie with 1 year expiration
      document.cookie = "cookieConsent=accepted; max-age=31536000; path=/; SameSite=Lax"
      closePopup()
    } catch (error) {
      closePopup()
    }
  }

  const handleNeverShowAgain = () => {
    try {
      // Save "never show" status to localStorage
      localStorage.setItem(COOKIE_CONSENT_STATUS_KEY, "never_show")
      localStorage.setItem(COOKIE_CONSENT_VERSION_KEY, COOKIE_CONSENT_VERSION)
      closePopup()
    } catch (error) {
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
        className={`fixed inset-0 bg-[#2F3B34]/20 backdrop-blur-md z-[9998] transition-opacity duration-300 ${
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
        <div className="backdrop-blur-xl bg-[#F5F3EE]/95 border border-[#D5E8DA] rounded-t-3xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 m-0">
          {/* Close button */}
          <button
            onClick={closePopup}
            className="absolute top-4 right-4 text-[#6B7F6E] hover:text-[#2F3B34] transition-colors"
            aria-label="Close cookie consent"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Cookie icon */}
          <div className="mb-5">
            <div className="w-14 h-14 bg-[#E8F0E3] border border-[#D5E8DA] rounded-2xl flex items-center justify-center">
              <span className="text-3xl">🍪</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="text-2xl font-semibold text-[#2F3B34] mb-3">
            We value your privacy
          </h3>

          {/* Description */}
          <p className="text-sm text-[#4A5A49] mb-6 leading-relaxed">
            We use cookies to enhance your experience, personalize content, and analyze our traffic. 
            By accepting, you help us provide you with the best possible service for your mental wellbeing journey.
          </p>

          {/* Buttons */}
          <div className="flex flex-col gap-3">
            {/* Accept button - Primary */}
            <button
              onClick={handleAccept}
              className="w-full bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-2xl hover:from-[#5E9876] hover:to-[#4F7C5F] touch-manipulation"
            >
              Accept Cookies
            </button>

            {/* Secondary actions */}
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={closePopup}
                className="flex-1 text-sm text-[#5A6A5E] hover:text-[#2F3B34] py-3 px-4 rounded-xl hover:bg-[#E8F0E3] border border-[#D5E8DA] transition-all touch-manipulation"
              >
                Remind me later
              </button>
              
              <button
                onClick={handleNeverShowAgain}
                className="flex-1 text-sm text-[#5A6A5E] hover:text-[#2F3B34] py-3 px-4 rounded-xl hover:bg-[#E8F0E3] border border-[#D5E8DA] transition-all touch-manipulation"
              >
                Never show again
              </button>
            </div>
          </div>

          {/* Learn more link */}
          <div className="mt-5 pt-5 border-t border-[#D5E8DA]">
            <a
              href="/cookie-policy"
              className="text-xs text-[#6B7F6E] hover:text-[#2F3B34] font-medium hover:underline transition-colors"
            >
              Learn more about our Cookie Policy →
            </a>
          </div>
        </div>
      </div>
    </>
  )
}

