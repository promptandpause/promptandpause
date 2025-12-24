"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Lenis from "lenis"
import { useScroll, useTransform, motion } from "framer-motion"
import { Sparkles, Clock, Brain, Lock, Archive, Flame, Mail, MessageSquare, Check, X } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"

// Metadata must be exported from a Server Component or layout
// See app/homepage/features/layout.tsx for metadata

export default function FeaturesPage() {
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
      <CoreFeaturesSection />
      <PremiumFeaturesSection />
      <DeliveryOptionsSection />
      <UKFeaturesSection />
      <WhatWeDontDoSection />
      <ComparisonTableSection />
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
              Everything You Need for Daily Reflection
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed text-balance max-w-3xl mx-auto">
              Simple tools designed for busy minds. No overwhelm, no bloat—just what works.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function CoreFeaturesSection() {
  const features = [
    {
      icon: Sparkles,
      title: "AI-Personalized Prompts",
      description:
        "Every prompt is tailored to your focus areas—work stress, relationships, career transitions, grief, gratitude.",
    },
    {
      icon: Clock,
      title: "Flexible Delivery",
      description: "Choose your time (7am-9pm) and method (email or Slack). Prompts arrive when you need them.",
    },
    {
      icon: Brain,
      title: "Mood Tracking",
      description: "Rate your day 1-10. Track patterns over time. See what's improving (or what needs support).",
    },
    {
      icon: Lock,
      title: "Private & Secure",
      description: "Your reflections are encrypted and stored in UK/EU servers. We never sell your data.",
    },
    {
      icon: Archive,
      title: "Searchable Archive",
      description:
        "Every prompt and reflection saved. Search by date, mood, or keyword. Your mental health history, always accessible.",
    },
    {
      icon: Flame,
      title: "Streak Tracking",
      description: "Build consistency with daily streak counters. No judgment—just gentle accountability.",
    },
  ]

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-black mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{feature.title}</h3>
              <p className="text-neutral-600 leading-relaxed text-lg">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PremiumFeaturesSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto w-full">
        <div className="inline-block px-6 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-12 text-sm font-medium tracking-wide">
          PREMIUM ONLY
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Premium Features</h2>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-10 lg:p-12 rounded-3xl hover:bg-white/10 hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Weekly Insight Digest</h3>
            <p className="text-white/80 leading-relaxed text-lg">
              AI-generated summary of your week every Sunday. See themes, mood trends, and encouraging observations.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-10 lg:p-12 rounded-3xl hover:bg-white/10 hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Voice Note Prompts</h3>
            <p className="text-white/80 leading-relaxed text-lg">
              Listen to your daily prompt in natural UK voice. Perfect for commutes or dog walks.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-white/5 border border-white/10 p-10 lg:p-12 rounded-3xl hover:bg-white/10 hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Advanced Analytics</h3>
            <p className="text-white/80 leading-relaxed text-lg">
              Visual mood charts, category breakdowns, and reflection frequency reports.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DeliveryOptionsSection() {
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

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight text-white text-center">
          Delivery Options
        </h2>
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 md:p-12 lg:p-16 hover:bg-white/15 transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-8">
              <Mail className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-8 text-white">Email Delivery</h3>
            <ul className="space-y-4 text-white/90 text-lg">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Clean, distraction-free emails</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Works on all devices</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>No app download needed</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Archive in your inbox</span>
              </li>
            </ul>
          </div>

          <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-10 md:p-12 lg:p-16 hover:bg-white/15 transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white mb-8">
              <MessageSquare className="w-8 h-8 text-black" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-8 text-white">Slack Delivery</h3>
            <ul className="space-y-4 text-white/90 text-lg">
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Prompts in your workspace</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Reflect without context-switching</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Optional team channel sharing (coming soon)</span>
              </li>
              <li className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1" />
                <span>Integrates with your workflow</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function UKFeaturesSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="h-[400px] lg:h-[600px] relative">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766471635/david-underland-3353237_cfqdhh.jpg"
            fill
            alt="Forest path"
            style={{ objectFit: "cover" }}
            className="rounded-2xl grayscale"
          />
        </div>
        <div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight">Built for UK & US Users</h2>
          <div className="space-y-6 text-lg md:text-xl leading-relaxed text-neutral-600">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-black mt-3 flex-shrink-0" />
              <p>NHS and US crisis resources in every message</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-black mt-3 flex-shrink-0" />
              <p>British and American English throughout</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-black mt-3 flex-shrink-0" />
              <p>UK and US time zones and holidays respected</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-black mt-3 flex-shrink-0" />
              <p>Data stored within EU (Supabase)</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-black mt-3 flex-shrink-0" />
              <p>Prompts reference UK and US context (redundancy, NHS waiting lists, insurance, etc.)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatWeDontDoSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight">What We Don't Do</h2>
        <p className="text-lg md:text-xl leading-relaxed text-neutral-600 mb-12">
          To keep Prompt & Pause simple and focused, we intentionally don't include:
        </p>
        <div className="space-y-6 text-lg md:text-xl leading-relaxed text-neutral-600">
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-neutral-400 mt-1 flex-shrink-0" />
            <p>Meditation timers</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-neutral-400 mt-1 flex-shrink-0" />
            <p>Habit tracking</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-neutral-400 mt-1 flex-shrink-0" />
            <p>Social feeds or communities</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-neutral-400 mt-1 flex-shrink-0" />
            <p>Gamification points system</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-neutral-400 mt-1 flex-shrink-0" />
            <p>Multiple daily notifications</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-neutral-400 mt-1 flex-shrink-0" />
            <p>Ads or sponsored content</p>
          </div>
        </div>
        <p className="text-2xl md:text-3xl font-bold mt-16 leading-tight">Just one question. Every day. That's it.</p>
      </div>
    </div>
  )
}

function ComparisonTableSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">How We Compare</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Feature</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Prompt & Pause</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Therapy Apps</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Meditation Apps</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Journaling Apps</th>
              </tr>
            </thead>
            <tbody className="text-neutral-600">
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Cost</td>
                <td className="py-6 px-4 font-bold text-black">£0-12/month</td>
                <td className="py-6 px-4">£150+/month</td>
                <td className="py-6 px-4">£10-15/month</td>
                <td className="py-6 px-4">£5-10/month</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Time needed</td>
                <td className="py-6 px-4 font-bold text-black">5 mins/day</td>
                <td className="py-6 px-4">50 mins/session</td>
                <td className="py-6 px-4">10-20 mins</td>
                <td className="py-6 px-4">15-30 mins</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Personalization</td>
                <td className="py-6 px-4 font-bold text-black">AI-tailored</td>
                <td className="py-6 px-4">Human therapist</td>
                <td className="py-6 px-4">Generic</td>
                <td className="py-6 px-4">Blank page</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">UK/US-focused</td>
                <td className="py-6 px-4">
                  <Check className="w-6 h-6 text-black" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-neutral-300" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-neutral-300" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-neutral-300" />
                </td>
              </tr>
              <tr>
                <td className="py-6 px-4 font-medium">No app needed</td>
                <td className="py-6 px-4">
                  <Check className="w-6 h-6 text-black" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-neutral-300" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-neutral-300" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-neutral-300" />
                </td>
              </tr>
            </tbody>
          </table>
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
          Start Reflecting Today
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href="/auth/signup"
            className="px-10 py-5 bg-white text-black border-2 border-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-white cursor-pointer text-center"
          >
            START FREE
          </a>
          <a
            href="/homepage/pricing"
            className="px-10 py-5 border-2 border-white bg-transparent text-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-white hover:text-black cursor-pointer text-center"
          >
            VIEW PRICING
          </a>
        </div>
      </div>
    </div>
  )
}
