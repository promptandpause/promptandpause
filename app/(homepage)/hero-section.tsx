"use client"

import Navigation from "./Navigation"
import Link from "next/link"
import { MeshGradient } from "@paper-design/shaders-react"
import { useEffect, useState } from "react"

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      {!mounted ? (
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900" />
      ) : (
        <>
          <MeshGradient
            className="absolute inset-0 w-full h-full"
            colors={["#000000", "#1a1a1a", "#333333", "#ffffff"]}
            speed={1.0}
          />

          {/* Lighting overlay effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/4 left-1/3 w-32 h-32 bg-gray-800/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/2 rounded-full blur-2xl animate-pulse"
              style={{ animationDuration: "2s", animationDelay: "1s" }}
            />
            <div
              className="absolute top-1/2 right-1/3 w-20 h-20 bg-gray-900/3 rounded-full blur-xl animate-pulse"
              style={{ animationDuration: "4s", animationDelay: "0.5s" }}
            />
          </div>
        </>
      )}

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40 z-[1]" />

      {/* Navigation - Using shared component */}
      <Navigation />

      {/* Hero Content */}
      <div className="relative z-10 flex items-center min-h-screen pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl fade-in">
            {/* Hero Heading */}
            <h1 className="font-serif text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight mb-6 sm:mb-8 leading-[1.15] drop-shadow-2xl">
              Five quiet minutes a day to make sense of your life.
            </h1>

            {/* Hero Subheading */}
            <p className="font-sans text-white/95 text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-10 sm:mb-14 max-w-2xl drop-shadow-lg">
              Prompt &amp; Pause gives you one thoughtful question at a time - so you can stop, reflect, and move forward with clarity. No pressure. No performance. Just you.
            </p>

            {/* Call to Action Button */}
            <Link href="/login?mode=signup" className="inline-block w-full sm:w-auto text-center bg-white text-gray-900 font-sans font-semibold px-10 py-5 rounded-xl text-lg hover:bg-gray-100 hover:scale-105 hover:shadow-2xl transition-all duration-300 touch-manipulation shadow-xl">
              Start today's reflection
            </Link>
            
            {/* Trial Information */}
            <p className="font-sans text-white/80 text-sm md:text-base font-light mt-4 sm:mt-6">
              Try it free for <span className="font-semibold text-white">7 days</span> no credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center sm:justify-start items-center">
            <p className="font-sans text-white/70 text-xs sm:text-sm font-light text-center sm:text-left">
              © 2026 Prompt & Pause. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

