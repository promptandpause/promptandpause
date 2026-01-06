"use client"

import { useEffect, useState } from "react"
import Lenis from "lenis"
import HeroSection from "./hero-section"
import Featured from "./featured"
import Promo from "./promo"
import Footer from "./footer"
import CookieConsent from "./CookieConsent"

export default function Home() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    let animationFrameId: number | null = null
    let lenis: Lenis | null = null
	  let startTimeoutId: number | null = null

    try {
      // Defer Lenis init until after hydration/first paint to avoid hydration mismatches.
      startTimeoutId = window.setTimeout(() => {
        lenis = new Lenis({
          duration: 1.2,
          easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
          orientation: "vertical",
          gestureOrientation: "vertical",
          smoothWheel: true,
          wheelMultiplier: 1,
          // Lenis typings vary by version; keep desired behavior without breaking typechecks.
          touchMultiplier: 2,
          infinite: false,
        } as any)

        function raf(time: number) {
          if (lenis) {
            lenis.raf(time)
            animationFrameId = requestAnimationFrame(raf)
          }
        }

        animationFrameId = requestAnimationFrame(raf)
      }, 0)
    } catch (error) {

    }

    return () => {
		  if (startTimeoutId) {
			  window.clearTimeout(startTimeoutId)
		  }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      if (lenis) {
        lenis.destroy()
      }
    }
  }, [mounted])

  return (
    <main>
      <HeroSection />
      <Featured />
      <Promo />
      <Footer />
      <CookieConsent />
    </main>
  )
}

