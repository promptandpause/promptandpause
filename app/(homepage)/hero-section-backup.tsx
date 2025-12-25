"use client"

import { useState } from "react"
import Navigation from "./Navigation"
import Link from "next/link"
import Image from "next/image"

export default function HeroSection() {
  const [videoError, setVideoError] = useState(false)

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    setVideoError(true)
  }

  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* Fallback Image Background (shows if video fails) */}
      {videoError ? (
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
          alt="Peaceful landscape background"
          fill
          className="absolute inset-0 w-full h-full object-cover z-0"
          priority
        />
      ) : (
        /* Background Video */
        <video 
          className="absolute inset-0 w-full h-full object-cover z-0" 
          autoPlay 
          muted 
          loop 
          playsInline
          preload="metadata"
          onError={handleVideoError}
        >
          <source
            src="https://cdn.pixabay.com/video/2024/08/27/228447_large.mp4"
            type="video/mp4"
          />
          {/* Fallback for browsers without video support */}
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
            alt="Peaceful landscape background"
            fill
            className="object-cover"
            priority
          />
        </video>
      )}

      {/* Video Overlay - Dimmed for better text readability */}
      <div className="absolute inset-0 bg-black/50 z-0" />

      {/* Navigation - Using shared component */}
      <Navigation />

      {/* Hero Content */}
      <div className="relative z-10 flex items-center min-h-screen pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-3xl fade-in">
            {/* Hero Heading */}
            <h1 className="font-serif text-white text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-normal tracking-tight mb-6 sm:mb-8 leading-[1.15] drop-shadow-2xl">
              Find Clarity in the Space Between <em className="italic">Thoughts</em>
            </h1>

            {/* Hero Subheading */}
            <p className="font-sans text-white/95 text-lg sm:text-xl md:text-2xl font-light leading-relaxed mb-10 sm:mb-14 max-w-2xl drop-shadow-lg">
              Personalized daily reflection prompts for when life feels too loud. Five minutes of guided introspection—delivered to your inbox each morning to help you process stress, track your mood, and rediscover calm.
            </p>

            {/* Call to Action Button */}
            <Link href="/auth/signup" className="inline-block w-full sm:w-auto text-center bg-white text-gray-900 font-sans font-semibold px-10 py-5 rounded-xl text-lg hover:bg-gray-100 hover:scale-105 hover:shadow-2xl transition-all duration-300 touch-manipulation shadow-xl">
              Begin Your Journey
            </Link>
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
