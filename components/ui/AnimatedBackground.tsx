"use client"

import { useEffect, useState } from "react"

export default function AnimatedBackground() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Generate particle data once after mount to avoid hydration mismatch
  const particles = mounted ? [...Array(50)].map((_, i) => ({
    id: i,
    width: Math.random() * 3 + 1,
    height: Math.random() * 3 + 1,
    left: Math.random() * 100,
    top: Math.random() * 100,
    duration: 2 + Math.random() * 6,
    delay: Math.random() * 3,
    blur: Math.random() * 0.5,
  })) : []

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-black to-slate-900" />
      
      {/* Large animated orbs - simulating depth of field */}
      <div className="absolute inset-0">
        {/* Background layer - far depth */}
        <div className="absolute top-10 left-10 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: "8s", animationDelay: "0s" }} />
        <div className="absolute bottom-20 right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: "7s", animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/4 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" 
             style={{ animationDuration: "9s", animationDelay: "1s" }} />
        
        {/* Mid layer - medium depth */}
        <div className="absolute top-1/4 right-1/3 w-64 h-64 bg-pink-600/15 rounded-full blur-2xl animate-pulse" 
             style={{ animationDuration: "6s", animationDelay: "1.5s" }} />
        <div className="absolute bottom-1/3 left-1/2 w-56 h-56 bg-cyan-600/15 rounded-full blur-2xl animate-pulse" 
             style={{ animationDuration: "5s", animationDelay: "3s" }} />
        <div className="absolute top-3/4 right-1/4 w-48 h-48 bg-violet-600/15 rounded-full blur-2xl animate-pulse" 
             style={{ animationDuration: "7.5s", animationDelay: "0.5s" }} />
        
        {/* Foreground layer - close depth */}
        <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-white/20 rounded-full blur-xl animate-pulse" 
             style={{ animationDuration: "4s", animationDelay: "2.5s" }} />
        <div className="absolute bottom-1/4 right-1/2 w-32 h-32 bg-white/15 rounded-full blur-xl animate-pulse" 
             style={{ animationDuration: "3.5s", animationDelay: "1s" }} />
        <div className="absolute top-2/3 left-1/5 w-36 h-36 bg-white/18 rounded-full blur-xl animate-pulse" 
             style={{ animationDuration: "4.5s", animationDelay: "3.5s" }} />
      </div>
      
      {/* Particle system - simulating GL particles */}
      <div className="absolute inset-0">
        {mounted ? particles.map((p) => (
          <div
            key={p.id}
            className="absolute bg-white/20 rounded-full animate-pulse"
            style={{
              width: `${p.width}px`,
              height: `${p.height}px`,
              left: `${p.left}%`,
              top: `${p.top}%`,
              animationDuration: `${p.duration}s`,
              animationDelay: `${p.delay}s`,
              filter: `blur(${p.blur}px)`
            }}
          />
        )) : null}
      </div>
      
      {/* Vignette effect - simulating GL shader vignette */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-transparent to-black/60" 
           style={{
             background: 'radial-gradient(circle at center, transparent 30%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.6) 100%)'
           }} />
      
      {/* Color grading overlay - simulating GL post-processing */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute inset-0 bg-gradient-to-tr from-purple-900/20 via-transparent to-blue-900/20" />
        <div className="absolute inset-0 bg-gradient-to-bl from-pink-900/20 via-transparent to-indigo-900/20" />
      </div>
      
      {/* Noise texture - simulating GL noise */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0 bg-gradient-to-br from-white via-gray-500 to-black" 
             style={{
               backgroundSize: '4px 4px',
               backgroundPosition: '0 0, 2px 2px',
               filter: 'blur(0.5px)'
             }} />
      </div>
    </div>
  )
}
