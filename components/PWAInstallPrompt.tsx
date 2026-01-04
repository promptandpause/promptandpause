'use client'

import { useEffect, useState } from 'react'
import { X, Download, Share, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Detect iOS Safari
function isIOSSafari(): boolean {
  if (typeof window === 'undefined') return false
  const ua = window.navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  const isSafari = /Safari/.test(ua) && !/Chrome|CriOS|FxiOS/.test(ua)
  return isIOS && isSafari
}

// Detect if running as standalone PWA
function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches || 
         (window.navigator as any).standalone === true
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    // Check if already installed as PWA
    if (isStandalone()) {
      return
    }

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed')
    if (dismissed) {
      return
    }

    // Check if iOS Safari
    if (isIOSSafari()) {
      setIsIOS(true)
      // Show iOS prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000)
      return
    }

    // For Chrome/Edge/etc - use beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      // Show prompt after a delay
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      setShowPrompt(false)
    }

    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // Don't show if not ready
  if (!showPrompt) {
    return null
  }

  // iOS Safari - show manual instructions
  if (isIOS) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-4 text-white relative">
          <button
            onClick={handleDismiss}
            className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="pr-6">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <Download className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-lg">Install Prompt & Pause</h3>
            </div>
            
            <p className="text-sm text-white/90 mb-4">
              Add to your home screen for the full app experience with notifications
            </p>
            
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Share className="w-4 h-4" />
                </div>
                <span>1. Tap the <strong>Share</strong> button below</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
                <span>2. Select <strong>Add to Home Screen</strong></span>
              </div>
            </div>

            <Button
              onClick={handleDismiss}
              variant="ghost"
              className="w-full mt-4 text-white hover:bg-white/20"
              size="sm"
            >
              Got it
            </Button>
          </div>
        </div>
        
        {/* Arrow pointing to Safari share button */}
        <div className="flex justify-center mt-2">
          <div className="w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-purple-600" />
        </div>
      </div>
    )
  }

  // Chrome/Edge/etc - use native install prompt
  if (!deferredPrompt) {
    return null
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl shadow-2xl p-4 text-white relative">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start space-x-3 pr-6">
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Download className="w-6 h-6" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-1">Install Prompt & Pause</h3>
            <p className="text-sm text-white/90 mb-3">
              Get the full app experience with offline access and notifications
            </p>
            
            <div className="flex space-x-2">
              <Button
                onClick={handleInstall}
                className="bg-white text-purple-600 hover:bg-white/90 font-semibold"
                size="sm"
              >
                Install
              </Button>
              <Button
                onClick={handleDismiss}
                variant="ghost"
                className="text-white hover:bg-white/20"
                size="sm"
              >
                Not now
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
