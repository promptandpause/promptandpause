"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Lenis from "lenis"
import { useScroll, useTransform, motion } from "framer-motion"
import { Sparkles, Clock, Brain, Lock, Archive, Flame, Mail, MessageSquare, Check, X, Heart, Wind, Target, BarChart3, Users, ThumbsUp, PenSquare } from "lucide-react"
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
      <main className="bg-[#EFF3F4] text-[#0F1419]">
      <HeroSection />
      <CoreFeaturesSection />
      <CommunityFeaturesSection />
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
          className="brightness-90"
        />
        <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center z-10 px-6">
          <div className="absolute inset-0 bg-gradient-to-b from-[#EFF3F4]/5 via-[#E8F5FE]/10 to-[#B3D9F2]/15 z-[-1]" />
          <div className="text-center text-white max-w-5xl relative z-10">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight text-balance">
              Everything you need for a quiet reflection practice
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed text-balance max-w-3xl mx-auto">
              Simple tools for busy days. No overwhelm, no performance—just a place to write.
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
      title: "Personalized prompts",
      description:
        "One thoughtful question at a time, tailored to your chosen focus areas—work stress, relationships, change, grounding.",
    },
    {
      icon: Clock,
      title: "Flexible Delivery",
      description: "Choose your time (7am-9pm) and method (email or Slack). Prompts arrive when you choose.",
    },
    {
      icon: Brain,
      title: "Optional check-in",
      description: "A simple moment-to-moment check-in you can use or skip. No charts, no scoring.",
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
        "Every prompt and reflection saved. Browse by date or search by keyword when you want to revisit something.",
    },
    {
      icon: Flame,
      title: "A steady rhythm",
      description: "A quiet sense of continuity without streak pressure or performance language.",
    },
    {
      icon: Heart,
      title: "Daily Gratitude",
      description: "Record up to 3 things you're grateful for each day. Build a gratitude practice with gentle consistency tracking.",
    },
    {
      icon: Wind,
      title: "Breathing Exercises",
      description: "Guided breathing techniques including Box Breathing, 4-7-8, and more to help calm your mind.",
    },
    {
      icon: BarChart3,
      title: "Weekly Mood Insights",
      description: "See your mood patterns over the past week with simple visualizations and basic insights.",
    },
  ]

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-[#F7F9FA]">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Core Features</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group backdrop-blur-md bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:shadow-2xl hover:scale-[1.02] transition-all duration-500"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1D9BF0] mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">{feature.title}</h3>
              <p className="text-[#536471] leading-relaxed text-lg">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CommunityFeaturesSection() {
  const features = [
    {
      icon: Users,
      title: "Optional community feed",
      description:
        "See reflections other people have chosen to share publicly, or just from the people you follow. Entirely opt-in — nothing is shared unless you choose to share it.",
    },
    {
      icon: ThumbsUp,
      title: "Likes & comments",
      description:
        "Respond to reflections that resonate with you. You control who can comment on your own reflections, and can remove any comment from your own posts at any time.",
    },
    {
      icon: PenSquare,
      title: "Personal profile & whiteboard",
      description:
        "A customizable profile page with its own theme, colors, and font — plus a whiteboard where friends can leave you a note.",
    },
    {
      icon: Lock,
      title: "Private by default",
      description:
        "Every reflection starts private. You choose, per entry, whether to keep it to yourself, share with friends only, or make it public — and you can change your mind anytime.",
    },
  ]

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-[#EFF3F4]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="inline-block px-6 py-2 bg-[#1D9BF0]/10 backdrop-blur-md border border-[#1D9BF0]/20 rounded-full mb-8 text-sm font-medium tracking-wide">
          OPTIONAL & OPT-IN
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">Connect, if you want to</h2>
        <p className="text-lg md:text-xl leading-relaxed text-[#536471] mb-16 max-w-3xl">
          Reflection can be solitary or shared — that's up to you. Every social feature is off by default and stays
          that way unless you turn it on.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group backdrop-blur-md bg-[#F7F9FA]/80 border border-[#B3D9F2] p-10 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500"
            >
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#1D9BF0] mb-6 group-hover:scale-110 transition-transform duration-300">
                <feature.icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-4 leading-tight">{feature.title}</h3>
              <p className="text-[#536471] leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PremiumFeaturesSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-[#E8F5FE] text-[#0F1419]">
      <div className="max-w-7xl mx-auto w-full">
        <div className="inline-block px-6 py-2 bg-[#1D9BF0]/10 backdrop-blur-md border border-[#1D9BF0]/20 rounded-full mb-12 text-sm font-medium tracking-wide">
          PREMIUM ONLY
        </div>
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Premium Features</h2>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          <div className="backdrop-blur-xl bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Weekly Insight Digest</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              A calm weekly reflection you can open when you want perspective. No scores, no comparison.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Monthly Reflection</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              A short monthly summary for gentle perspective over time.
            </p>
          </div>

          <div className="backdrop-blur-xl bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">From Your Past</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              A rare, optional resurfacing of a past reflection—dismissible, with a long cooldown.
            </p>
          </div>

          <div className="backdrop-blur-md bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1D9BF0] mb-6">
              <Target className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Goals & Intentions</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              Set personal goals and weekly intentions. Track your progress toward what matters most to you.
            </p>
          </div>

          <div className="backdrop-blur-md bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1D9BF0] mb-6">
              <Check className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Habit Tracking</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              Track daily habits and see how they correlate with your mood over time. Discover what helps you thrive.
            </p>
          </div>

          <div className="backdrop-blur-md bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1D9BF0] mb-6">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Advanced Mood Insights</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              Monthly trends, AI-powered analysis, best/worst day patterns, and deeper insights into your emotional wellbeing.
            </p>
          </div>

          <div className="backdrop-blur-md bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1D9BF0] mb-6">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Unlimited Gratitude</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              Record up to 10 gratitude entries per day instead of 3. Build a richer gratitude practice.
            </p>
          </div>

          <div className="backdrop-blur-md bg-[#EFF3F4]/80 border border-[#B3D9F2] p-10 lg:p-12 rounded-3xl hover:bg-[#F7F9FA] hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[#1D9BF0] mb-6">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Unlimited Prompts</h3>
            <p className="text-[#536471] leading-relaxed text-lg">
              Daily prompts instead of 3x per week. Reflect as often as you like with no limits.
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
            className="brightness-90"
          />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight text-white text-center">
          Delivery Options
        </h2>
        <div className="grid md:grid-cols-2 gap-10 lg:gap-16">
          <div className="backdrop-blur-xl bg-[#EFF3F4]/80 border border-[#B3D9F2] rounded-3xl p-10 md:p-12 lg:p-16 hover:bg-[#F7F9FA] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1D9BF0] mb-8">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-8 text-[#0F1419]">Email Delivery</h3>
            <ul className="space-y-4 text-[#536471] text-lg">
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

          <div className="backdrop-blur-xl bg-[#EFF3F4]/80 border border-[#B3D9F2] rounded-3xl p-10 md:p-12 lg:p-16 hover:bg-[#F7F9FA] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[#1D9BF0] mb-8">
              <MessageSquare className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-8 text-[#0F1419]">Slack Delivery</h3>
            <ul className="space-y-4 text-[#536471] text-lg">
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
                <span>Private delivery, where you already work</span>
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
    <div className="min-h-screen flex items-center px-6 py-32 bg-[#F7F9FA]">
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
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight">Globally Aware</h2>
          <div className="space-y-6 text-lg md:text-xl leading-relaxed text-[#536471]">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1D9BF0] mt-3 flex-shrink-0" />
              <p>UK & US crisis resources at its core (Samaritans, NHS 111, 988 Lifeline)</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1D9BF0] mt-3 flex-shrink-0" />
              <p>Multi-language support (English, Spanish, French, Dutch)</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1D9BF0] mt-3 flex-shrink-0" />
              <p>Timezone-adaptive delivery—prompts arrive at your chosen time, wherever you are</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1D9BF0] mt-3 flex-shrink-0" />
              <p>Data stored within EU (Supabase)</p>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-[#1D9BF0] mt-3 flex-shrink-0" />
              <p>Prompts reference real-world context (redundancy, NHS waiting lists, insurance, career change)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function WhatWeDontDoSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-[#E8F5FE]">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight">What We Don't Do</h2>
        <p className="text-lg md:text-xl leading-relaxed text-[#536471] mb-12">
          To keep Prompt & Pause simple and focused, we intentionally don't include:
        </p>
        <div className="space-y-6 text-lg md:text-xl leading-relaxed text-[#536471]">
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-[#1D9BF0] mt-1 flex-shrink-0" />
            <p>Therapy or clinical diagnosis</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-[#1D9BF0] mt-1 flex-shrink-0" />
            <p>Long guided meditation sessions</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-[#1D9BF0] mt-1 flex-shrink-0" />
            <p>Forced social pressure, public leaderboards, or streak shaming</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-[#1D9BF0] mt-1 flex-shrink-0" />
            <p>Gamification points system</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-[#1D9BF0] mt-1 flex-shrink-0" />
            <p>Multiple daily notifications</p>
          </div>
          <div className="flex items-start gap-4">
            <X className="w-6 h-6 text-[#1D9BF0] mt-1 flex-shrink-0" />
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
    <div className="min-h-screen flex items-center px-6 py-32 bg-[#F7F9FA]">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">How We Compare</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-[#0F1419]">
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Feature</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Prompt & Pause</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Therapy Apps</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Meditation Apps</th>
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Journaling Apps</th>
              </tr>
            </thead>
            <tbody className="text-[#536471]">
              <tr className="border-b border-[#B3D9F2]">
                <td className="py-6 px-4 font-medium">Cost</td>
                <td className="py-6 px-4 font-bold text-[#0F1419]">£0-12/month</td>
                <td className="py-6 px-4">£150+/month</td>
                <td className="py-6 px-4">£10-15/month</td>
                <td className="py-6 px-4">£5-10/month</td>
              </tr>
              <tr className="border-b border-[#B3D9F2]">
                <td className="py-6 px-4 font-medium">Time needed</td>
                <td className="py-6 px-4 font-bold text-[#0F1419]">5 mins/day</td>
                <td className="py-6 px-4">50 mins/session</td>
                <td className="py-6 px-4">10-20 mins</td>
                <td className="py-6 px-4">15-30 mins</td>
              </tr>
              <tr className="border-b border-[#B3D9F2]">
                <td className="py-6 px-4 font-medium">Personalization</td>
                <td className="py-6 px-4 font-bold text-[#0F1419]">AI-tailored</td>
                <td className="py-6 px-4">Human therapist</td>
                <td className="py-6 px-4">Generic</td>
                <td className="py-6 px-4">Blank page</td>
              </tr>
              <tr className="border-b border-[#B3D9F2]">
                <td className="py-6 px-4 font-medium">Global + UK/US resources</td>
                <td className="py-6 px-4">
                  <Check className="w-6 h-6 text-[#1D9BF0]" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-[#B3D9F2]" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-[#B3D9F2]" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-[#B3D9F2]" />
                </td>
              </tr>
              <tr>
                <td className="py-6 px-4 font-medium">No app needed</td>
                <td className="py-6 px-4">
                  <Check className="w-6 h-6 text-[#1D9BF0]" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-[#B3D9F2]" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-[#B3D9F2]" />
                </td>
                <td className="py-6 px-4">
                  <X className="w-6 h-6 text-[#B3D9F2]" />
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
    <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-[#E8F5FE] text-[#0F1419]">
      <div className="max-w-4xl text-center">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-16 leading-tight text-balance">
          Start Reflecting Today
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href="/auth"
            className="px-10 py-5 bg-[#1D9BF0] text-white border-2 border-[#1D9BF0] text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-[#0F1419] cursor-pointer text-center"
          >
            START FREE
          </a>
          <a
            href="/pricing"
            className="px-10 py-5 border-2 border-[#1D9BF0] bg-transparent text-[#0F1419] text-base font-medium tracking-wide transition-all duration-300 hover:bg-[#1D9BF0] hover:text-white cursor-pointer text-center"
          >
            VIEW PRICING
          </a>
        </div>
      </div>
    </div>
  )
}



