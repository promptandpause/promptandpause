'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'

const HERO_VIDEO_SRC = 'https://cdn.pixabay.com/video/2024/08/27/228447_large.mp4'

export default function PWAWelcomePage() {
  const router = useRouter()
  const [isChecking, setIsChecking] = useState(true)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const loadingVideoRef = useRef<HTMLVideoElement>(null)
  const supabase = createClient()

  const playVideo = async (video: HTMLVideoElement | null) => {
    if (!video) return
    try {
      video.muted = true
      video.playbackRate = 1.0
      await video.play().catch(() => {
        // try after a tiny delay
        setTimeout(() => video.play().catch(() => {}), 150)
      })
    } catch {
      // ignore autoplay block; poster will show
    }
  }

  // Force video playback for PWA - handles autoplay restrictions on iOS and Android
  useEffect(() => {
    // Small delay to ensure DOM is ready (helps Android WebView)
    const timer = setTimeout(() => {
      playVideo(videoRef.current)
      playVideo(loadingVideoRef.current)
    }, 100)

    // Handle visibility change (app returning from background)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        playVideo(videoRef.current)
        playVideo(loadingVideoRef.current)
      }
    }

    // Handle page focus (Android Chrome specific)
    const handleFocus = () => {
      playVideo(videoRef.current)
      playVideo(loadingVideoRef.current)
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      clearTimeout(timer)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleFocus)
    }
  }, [isChecking])

  useEffect(() => {
    // Check if user is already authenticated
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Check if onboarding is complete
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('id')
          .eq('user_id', session.user.id)
          .single()

        if (preferences) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
      } else {
        setIsChecking(false)
      }
    }

    checkAuth()
  }, [router, supabase])

  if (isChecking) {
    return (
      <main className="relative w-screen h-screen overflow-hidden bg-black">
        {/* Video Background */}
        <video 
          key={HERO_VIDEO_SRC}
          ref={loadingVideoRef}
          className="absolute inset-0 w-full h-full object-cover z-0" 
          autoPlay 
          muted 
          loop 
          playsInline
          webkit-playsinline="true"
          preload="auto"
          poster="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
          controls={false}
          aria-hidden="true"
          onCanPlay={() => playVideo(loadingVideoRef.current)}
        >
          <source
            src={HERO_VIDEO_SRC}
            type="video/mp4"
          />
          <source
            src="/228447_large.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/40 z-[1]" />
        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="animate-pulse text-white text-lg">Loading...</div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black">
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
          key={HERO_VIDEO_SRC}
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover z-0" 
          autoPlay 
          muted 
          loop 
          playsInline
          webkit-playsinline="true"
          preload="auto"
          poster="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
          controls={false}
          aria-hidden="true"
          onCanPlay={() => playVideo(videoRef.current)}
          onError={() => setVideoError(true)}
          onLoadedData={() => setVideoError(false)}
        >
          <source
            src={HERO_VIDEO_SRC}
            type="video/mp4"
          />
          <source
            src="/228447_large.mp4"
            type="video/mp4"
          />
        </video>
      )}

      {/* Dark Overlay for text readability */}
      <div className="absolute inset-0 z-[1] pointer-events-none">
        <div className="absolute inset-0 bg-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/35 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/65 via-transparent to-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full px-6 py-10 safe-area-top safe-area-bottom">
        {/* Logo - Center Top */}
        <div className="flex justify-center pt-10 mb-14">
          <Link href="/" className="inline-flex">
            <Image
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              alt="Prompt & Pause"
              width={180}
              height={48}
              className="h-12 w-auto invert brightness-0"
              priority
            />
          </Link>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col justify-center max-w-lg mx-auto w-full gap-3">
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
        <div className="w-full max-w-md mx-auto pb-2">
          <Link 
            href="/auth/signin"
            className="block w-full text-center bg-white/25 border border-white/30 backdrop-blur-xl text-white font-sans font-semibold px-8 py-4 rounded-2xl text-lg shadow-2xl hover:bg-white/35 hover:border-white/40 transition-all duration-300 touch-manipulation"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  )
}
