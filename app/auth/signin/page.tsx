"use client"

import { useState } from "react"
import Image from "next/image"
import { LoginForm } from "../login-form"

export default function SignInPage() {
  const [videoError, setVideoError] = useState(false)
  const [showLoginForm, setShowLoginForm] = useState(false)

  // Show the login form view
  if (showLoginForm) {
    return (
      <main className="relative w-screen h-screen overflow-hidden">
        {/* Video Background */}
        {videoError ? (
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
            alt="Peaceful landscape background"
            fill
            className="object-cover"
            priority
          />
        ) : (
          <video 
            className="absolute inset-0 w-full h-full object-cover z-0" 
            autoPlay 
            muted 
            loop 
            playsInline
            preload="metadata"
            onError={() => setVideoError(true)}
          >
            <source
              src="https://cdn.pixabay.com/video/2024/08/27/228447_large.mp4"
              type="video/mp4"
            />
          </video>
        )}

        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black/60 z-[1]" />

        {/* Login Form Content */}
        <div className="relative z-10 flex flex-col h-full px-6 py-8 safe-area-top safe-area-bottom">
          {/* Logo - Center Top */}
          <div className="flex justify-center pt-4 mb-6">
            <Image
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              alt="Prompt & Pause"
              width={160}
              height={40}
              className="h-10 w-auto"
              priority
            />
          </div>

          {/* Login Form */}
          <div className="flex-1 flex items-center justify-center">
            <div className="w-full max-w-md">
              <LoginForm />
            </div>
          </div>

          {/* Back Button */}
          <div className="w-full max-w-md mx-auto pb-4">
            <button
              onClick={() => setShowLoginForm(false)}
              className="w-full text-center text-white/70 font-sans text-sm hover:text-white transition-colors"
            >
              ← Back
            </button>
          </div>
        </div>
      </main>
    )
  }

  // Show the splash/welcome screen
  return (
    <main className="relative w-screen h-screen overflow-hidden">
      {/* Video Background */}
      {videoError ? (
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
          alt="Peaceful landscape background"
          fill
          className="object-cover"
          priority
        />
      ) : (
        <video 
          className="absolute inset-0 w-full h-full object-cover z-0" 
          autoPlay 
          muted 
          loop 
          playsInline
          preload="metadata"
          onError={() => setVideoError(true)}
        >
          <source
            src="https://cdn.pixabay.com/video/2024/08/27/228447_large.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 bg-black/50 z-[1]" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6 py-12 safe-area-top safe-area-bottom">
        {/* Logo - Center Top */}
        <div className="flex justify-center pt-4 mb-8">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
            alt="Prompt & Pause"
            width={180}
            height={48}
            className="h-12 w-auto"
            priority
          />
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full">
          {/* Heading */}
          <h1 className="font-serif text-white text-3xl sm:text-4xl md:text-5xl font-normal tracking-tight mb-6 leading-[1.15] drop-shadow-2xl">
            Find Balance in your life with clarity.
          </h1>

          {/* Subheading */}
          <p className="font-sans text-white/85 text-base sm:text-lg font-light leading-relaxed mb-8 drop-shadow-lg">
            Take a moment for yourself. Daily reflection prompts to help you process stress, track your mood, and rediscover calm.
          </p>
        </div>

        {/* Login Button - Bottom */}
        <div className="w-full max-w-lg mx-auto pb-8">
          <button 
            onClick={() => setShowLoginForm(true)}
            className="block w-full text-center bg-white/95 backdrop-blur-sm text-gray-900 font-sans font-semibold px-8 py-4 rounded-2xl text-lg hover:bg-white hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 touch-manipulation shadow-xl"
          >
            Login
          </button>
        </div>
      </div>
    </main>
  );
}
