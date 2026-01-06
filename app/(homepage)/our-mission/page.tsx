"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Lenis from "lenis"
import { useScroll, useTransform, motion } from "framer-motion"
import { CheckCircle2, Frown, Lightbulb } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"

export default function MissionPage() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
      infinite: false,
    })

    function raf(time: number) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }

    requestAnimationFrame(raf)

    return () => {
      lenis.destroy()
    }
  }, [mounted])

  return (
    <>
      <Navigation />
      <main className="bg-white text-black">
      <HeroSection />

      <ProblemSection />

      <SolutionSection />

      <WhoItsForSection />

      <ValuesSection />

      <FounderSection />

      <CTASection />
    </main>
      <Footer />
    </>
  )
}

function HeroSection() {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start start", "end start"],
  })

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "100vh"])
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={container} className="h-screen overflow-hidden relative">
      <motion.div style={{ y }} className="relative h-full">
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
          fill
          alt="Mountain landscape"
          style={{ objectFit: "cover" }}
          className="brightness-50"
        />
        <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center z-10 px-6">
          <div className="text-center text-white max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight text-balance">
              Why We Built Prompt & Pause
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed text-balance max-w-3xl mx-auto">
              Mental health support shouldn't be overwhelming, expensive, or one-size-fits-all.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function ProblemSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="order-2 lg:order-1">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-black mb-8">
            <Frown className="w-8 h-8 md:w-10 md:h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight">The Wellness App Fatigue</h2>
          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-neutral-600">
            <p>
              Traditional mental health apps ask too much: download an app, create a profile, navigate complex features,
              commit to 20-minute meditations, track 15 different habits. For someone already overwhelmed, it's just
              more noise.
            </p>
            <p>
              Therapy is transformative but costs £150+/month and has 3-month waiting lists. Journaling helps, but the
              blank page is paralyzing. We needed something in between—simple, affordable, and actually doable on your
              worst days.
            </p>
          </div>
        </div>
        <div className="order-1 lg:order-2 h-[400px] lg:h-[600px] relative">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766466481/IMG2301-portrait_prp0df.jpg"
            fill
            alt="Contemplative portrait"
            style={{ objectFit: "cover" }}
            className="rounded-2xl grayscale"
          />
        </div>
      </div>
    </div>
  )
}

function SolutionSection() {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["-10vh", "10vh"])

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469289/spiral-circles_wvgym8.jpg"
            fill
            alt="Abstract background"
            style={{ objectFit: "cover" }}
            className="brightness-75"
          />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-32">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 md:p-16 lg:p-20">
          <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-white mb-8">
            <Lightbulb className="w-8 h-8 md:w-10 md:h-10 text-black" />
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight text-white">
            One Question. Five Minutes. Real Progress.
          </h2>
          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-white/90">
            <p>
              Prompt & Pause delivers one thoughtful reflection question each morning—personalized to what you're
              navigating right now. No app overwhelm. No blank page. Just a question in your inbox and 5 minutes to
              think.
            </p>
            <p>
              It's not therapy. It's not meditation. It's guided self-reflection for busy adults who need mental health
              support that fits into real life.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function WhoItsForSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Who It's For</h2>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">The Job Seeker</h3>
            <p className="text-neutral-600 leading-relaxed text-lg">
              Navigating redundancy or career uncertainty. Need space to process rejection and rebuild confidence.
            </p>
          </div>

          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">The Burnt-Out Professional</h3>
            <p className="text-neutral-600 leading-relaxed text-lg">
              Giving 110% at work but running on empty. Need permission to acknowledge struggle without quitting.
            </p>
          </div>

          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">The Quietly Struggling</h3>
            <p className="text-neutral-600 leading-relaxed text-lg">
              Functional but not thriving. Need tools for self-awareness before things get worse.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function ValuesSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-50">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Our Values</h2>
        <div className="grid md:grid-cols-2 gap-x-16 gap-y-12 lg:gap-y-16">
          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">UK & US-First</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">
                Built for British and US context, NHS resources integrated
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Privacy-First</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">
                Your reflections are encrypted, never sold, never shared
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Simple-First</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">One prompt. One inbox. No feature bloat.</p>
            </div>
          </div>

          <div className="flex gap-6 items-start group">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Honest-First</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">
                No toxic positivity. Some days are hard, and that's okay.
              </p>
            </div>
          </div>

          <div className="flex gap-6 items-start group md:col-span-2 max-w-xl">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-black flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <CheckCircle2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Accessible-First</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">
                Free tier forever. Premium is less than 5 coffees/month.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function FounderSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="h-[500px] lg:h-[700px] relative">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766465771/W3xY6uJ1eF0aB9cD8iH4gK_hxlkfo.jpg"
            fill
            alt="Founder"
            style={{ objectFit: "cover" }}
            className="rounded-2xl"
          />
        </div>
        <div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight">Founder's Note</h2>
          <div className="space-y-8 text-lg md:text-xl leading-relaxed text-neutral-600">
            <p>
              I built Prompt & Pause during my own career transition and through unexpected life changes, I was too
              overwhelmed for therapy, and very much stuck on what to do next, I found myself way too restless for
              meditation, and too stuck in the cycle of endless thoughts on my iPhone notes. I needed something that met
              me where I was—exhausted, uncertain, but still trying.
            </p>
            <p>If you're in that space too, this is for you.</p>
            <p className="text-neutral-400 italic text-lg md:text-xl">— Dishaun Codjoe, Founder</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function CTASection() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-neutral-900 text-white">
      <div className="max-w-4xl text-center">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-16 leading-tight text-balance">
          Start Your Reflection Practice Today
        </h2>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <a
              href="/auth"
              className="px-10 py-5 bg-white text-black border-2 border-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-white cursor-pointer text-center"
            >
              START FREE
            </a>
          <a
            href="/pricing"
            className="px-10 py-5 border-2 border-white bg-transparent text-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-white hover:text-black cursor-pointer text-center"
          >
            VIEW PRICING
          </a>
        </div>
      </div>
    </div>
  )
}



