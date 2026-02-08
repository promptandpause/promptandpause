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
    <div className="relative min-h-screen bg-[#F0EDE6] overflow-hidden">
      {/* Animated Mesh Gradient Background */}
      {!mounted ? (
        <div className="absolute inset-0 bg-gradient-to-br from-[#F0EDE6] via-[#E8EAE6] to-[#E1EAE0]" />
      ) : (
        <>
          <MeshGradient
            className="absolute inset-0 w-full h-full"
            colors={["#F0EDE6", "#E8EAE6", "#E1EAE0", "#DCE6D9"]}
            speed={1.0}
          />

          {/* Lighting overlay effects */}
          <div className="absolute inset-0 pointer-events-none">
            <div
              className="absolute top-1/4 left-1/3 w-32 h-32 bg-[#6FA984]/5 rounded-full blur-3xl animate-pulse"
              style={{ animationDuration: "3s" }}
            />
            <div
              className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-white/2 rounded-full blur-2xl animate-pulse"
              style={{ animationDuration: "2s", animationDelay: "1s" }}
            />
            <div
              className="absolute top-1/2 right-1/3 w-20 h-20 bg-[#4A5A49]/3 rounded-full blur-xl animate-pulse"
              style={{ animationDuration: "4s", animationDelay: "0.5s" }}
            />
          </div>
        </>
      )}

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-[#2F3B34]/10 z-[1]" />
      
      {/* Navigation - Using shared component */}
      <Navigation />

      {/* Hero Content */}
      <div className="relative z-10 flex items-center min-h-screen pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl fade-in">
            {/* Hero Heading */}
            <h1 className="font-serif text-[#2F3B34] text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight mb-6 sm:mb-8 leading-[1.15]">
              Five quiet minutes a day to make sense of your life.
            </h1>

            {/* Hero Subheading */}
            <p className="font-sans text-[#4A5A49] text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-10 sm:mb-14 max-w-2xl">
              Prompt &amp; Pause gives you one thoughtful question at a time - so you can stop, reflect, and move forward with clarity. No pressure. No performance. Just you.
            </p>

            {/* Call to Action Button */}
            <Link href="/login?mode=signup" className="inline-block w-full sm:w-auto text-center bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] text-white font-sans font-semibold px-10 py-5 rounded-2xl text-lg hover:from-[#5E9876] hover:to-[#4F7C5F] hover:scale-105 hover:shadow-2xl hover:shadow-[#6FA984]/30 transition-all duration-300 touch-manipulation shadow-xl shadow-[#6FA984]/20">
              Start today's reflection
            </Link>
            
            {/* Trial Information */}
            <p className="font-sans text-[#6B7F6E] text-sm md:text-base font-light mt-4 sm:mt-6">
              Try it free for <span className="font-semibold text-[#2F3B34]">7 days</span> no credit card required
            </p>
          </div>
        </div>
      </div>

      {/* Footer Copyright */}
      <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex justify-center sm:justify-start items-center">
            <p className="font-sans text-[#7A8778] text-xs sm:text-sm font-light text-center sm:text-left">
              © 2026 Prompt & Pause. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

