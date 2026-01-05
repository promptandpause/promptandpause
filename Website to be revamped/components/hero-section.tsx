"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"
import { AnimatedText } from "@/components/animated-text"

export function HeroSection() {
  const sectionRef = useRef<HTMLElement>(null)
  const imageContainerRef = useRef<HTMLDivElement>(null)
  const [scrollProgress, setScrollProgress] = useState(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-up")
          }
        })
      },
      { threshold: 0.1 },
    )

    const elements = sectionRef.current?.querySelectorAll(".reveal")
    elements?.forEach((el) => observer.observe(el))

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current) return

      const scrollY = window.scrollY
      const sectionHeight = sectionRef.current.offsetHeight

      // Calculate progress (0 to 1) based on scroll within the hero section
      const progress = Math.min(scrollY / (sectionHeight * 0.5), 1)
      setScrollProgress(progress)
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    handleScroll() // Initial check

    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const scale = 1 - scrollProgress * 0.05 // Reduces from 1 to 0.95
  const borderRadius = scrollProgress * 24 // Increases from 0 to 24px

  return (
    <section ref={sectionRef} className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Full-width background image with zoom effect */}
      <div
        ref={imageContainerRef}
        className="absolute inset-0 w-full h-full overflow-hidden transition-transform duration-100"
        style={{
          transform: `scale(${scale})`,
          borderRadius: `${borderRadius}px`,
        }}
      >
        <img
          src="/images/hero-biometic.png"
          alt="Biometic in a natural environment"
          className="w-full h-full object-cover animate-zoom-in"
        />
        {/* Subtle dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-foreground/60 via-foreground/40 to-transparent" />
      </div>

      {/* Content overlay - text on the left */}
      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32 w-full">
        <div className="max-w-2xl">
          {/* Text content */}
          <p className="reveal opacity-0 text-sm uppercase tracking-[0.2em] text-background font-medium mb-6">
            Microbiome Science
          </p>
          <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-medium leading-[1.1] text-background text-balance mb-8">
            <AnimatedText text="Reveal your" delay={0.2} />
            <br />
            <span className="text-accent">
              <AnimatedText text="natural balance" delay={0.6} />
            </span>
          </h1>
          <p className="reveal opacity-0 animation-delay-400 text-lg text-background/90 leading-relaxed mb-10 md:text-base mr-0 pr-0">
            A scientific and caring approach to restore your microbiome harmony. Discover research-based solutions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              size="lg"
              className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-8 py-6 text-base group"
            >
              Start your journey
              <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="rounded-full px-8 py-6 text-base border-background/30 hover:bg-background/10 text-background bg-transparent backdrop-blur-sm"
            >
              Learn more
            </Button>
          </div>
        </div>

        {/* Floating card - bottom left */}
      </div>
    </section>
  )
}
