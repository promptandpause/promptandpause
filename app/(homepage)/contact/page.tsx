"use client"

import type React from "react"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Lenis from "lenis"
import { useScroll, useTransform, motion } from "framer-motion"
import { Mail, Clock, AlertCircle, FileText } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"

export default function ContactPage() {
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
        <ContactFormSection />
        <AlternativeContactSection />
        <FAQSection />
        <PressSection />
        <CrisisSection />
        <ResponseTimeSection />
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

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "80vh"])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div ref={container} className="h-screen overflow-hidden relative">
      <motion.div style={{ y }} className="relative h-full">
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469858/ivan-sitting-glear_t7agby.jpg"
          fill
          alt="Contact background"
          style={{ objectFit: "cover" }}
          className="brightness-[0.4]"
        />
        <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center z-10 px-6">
          <div className="text-center text-white max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight text-balance">Get in Touch</h1>
            <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed text-balance max-w-3xl mx-auto">
              Questions, feedback, or just want to say hello? We read every message.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function ContactFormSection() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    isPremium: false
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/contact/homepage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const text = await response.text()
      let result = null
      if (text && text.trim()) {
        result = JSON.parse(text)
      }

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Failed to send message')
      }

      setSubmitted(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-3xl mx-auto w-full">
        {!submitted ? (
          <form onSubmit={handleSubmit} className="space-y-8" suppressHydrationWarning>
            {error && (
              <div className="p-4 bg-red-50 border-2 border-red-200 text-red-800 rounded-lg">
                {error}
              </div>
            )}
            
            <div className="grid md:grid-cols-2 gap-8">
              <div>
                <label className="block text-sm font-bold mb-3 tracking-wide">NAME *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-6 py-4 border-2 border-neutral-300 focus:border-black outline-none transition-colors text-lg"
                  suppressHydrationWarning
                />
              </div>
              <div>
                <label className="block text-sm font-bold mb-3 tracking-wide">EMAIL *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-6 py-4 border-2 border-neutral-300 focus:border-black outline-none transition-colors text-lg"
                  suppressHydrationWarning
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 tracking-wide">SUBJECT *</label>
              <select
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                className="w-full px-6 py-4 border-2 border-neutral-300 focus:border-black outline-none transition-colors text-lg bg-white"
                suppressHydrationWarning
              >
                <option value="">Select a subject</option>
                <option value="general">General Inquiry</option>
                <option value="support">Technical Support</option>
                <option value="billing">Billing Question</option>
                <option value="feature">Feature Request</option>
                <option value="press">Press/Media</option>
                <option value="partnership">Partnership Opportunity</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-bold mb-3 tracking-wide">MESSAGE *</label>
              <textarea
                required
                rows={8}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                className="w-full px-6 py-4 border-2 border-neutral-300 focus:border-black outline-none transition-colors text-lg resize-none"
                suppressHydrationWarning
              />
            </div>

            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="premium" 
                className="w-5 h-5"
                checked={formData.isPremium}
                onChange={(e) => setFormData({ ...formData, isPremium: e.target.checked })}
              />
              <label htmlFor="premium" className="text-lg text-neutral-600">
                I'm a Premium user
              </label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full px-10 py-5 bg-black text-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-neutral-800 cursor-pointer disabled:bg-neutral-400 disabled:cursor-not-allowed"
            >
              {loading ? 'SENDING...' : 'SEND MESSAGE'}
            </button>
          </form>
        ) : (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black mb-8">
              <Mail className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-6">Thanks for reaching out!</h3>
            <p className="text-xl text-neutral-600 leading-relaxed max-w-2xl mx-auto">
              We'll respond within 24-48 hours (Premium users within 24 hours).
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function AlternativeContactSection() {
  return (
    <div className="px-6 py-32 bg-neutral-50">
      <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 lg:gap-16">
        <div className="backdrop-blur-md bg-white/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
            <Mail className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Email Us Directly</h3>
          <p className="text-2xl font-bold text-black mb-4">contact@promptandpause.com</p>
          <p className="text-neutral-600 leading-relaxed text-lg">For urgent account issues, email us directly.</p>
        </div>

        <div className="backdrop-blur-md bg-white/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6">
            <Clock className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-3xl md:text-4xl font-bold mb-6 leading-tight">Premium Support</h3>
          <p className="text-neutral-600 leading-relaxed text-lg">
            Premium users get priority responses within 24 hours. Include your account email in your message.
          </p>
        </div>
      </div>
    </div>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "How do I cancel my subscription?",
      answer:
        "You can cancel anytime from your account settings. Go to Settings > Subscription > Cancel. You'll keep access until the end of your billing period, and we won't charge you again. No cancellation fees, no questions asked.",
    },
    {
      question: "How do I change my delivery time?",
      answer:
        "Go to Settings > Preferences and adjust your delivery time. Changes take effect the next day. You can choose any time between 6am-10pm in your timezone. Premium users can set different times for weekdays vs weekends.",
    },
    {
      question: "Can I switch from email to Slack?",
      answer:
        "Yes! Go to Settings > Delivery Method and connect your Slack workspace. You can switch between email and Slack anytime. Premium users can receive prompts in both channels simultaneously.",
    },
    {
      question: "How do I export my reflections?",
      answer:
        "Premium users can export all reflections as JSON or CSV from Settings > Data Export. Free users can copy/paste individual reflections. We're working on adding PDF export with formatting options.",
    },
    {
      question: "Is my data secure?",
      answer:
        "Yes. All data is encrypted at rest and in transit using industry-standard AES-256 encryption. We use Supabase for secure database hosting with row-level security. Your reflections are private by default and never used for AI training. We're GDPR compliant and undergo regular security audits.",
    },
  ]

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-5xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight">
          Before You Email, Check If Your Question Is Answered
        </h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="border-2 border-neutral-200 overflow-hidden">
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full p-8 text-left hover:bg-neutral-50 transition-colors duration-200 flex items-center justify-between gap-4"
              >
                <h3 className="text-xl md:text-2xl font-bold">{faq.question}</h3>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </motion.div>
              </button>
              <motion.div
                initial={false}
                animate={{
                  height: openIndex === index ? "auto" : 0,
                  opacity: openIndex === index ? 1 : 0,
                }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="overflow-hidden"
              >
                <div className="px-8 pb-8 text-lg md:text-xl text-neutral-600 leading-relaxed border-t-2 border-neutral-200 pt-6">
                  {faq.answer}
                </div>
              </motion.div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <a
            href="/research"
            className="inline-block px-10 py-5 border-2 border-black text-black text-base font-medium tracking-wide transition-all duration-300 hover:bg-black hover:text-white"
          >
            VIEW ALL FAQS
          </a>
        </div>
      </div>
    </div>
  )
}

function PressSection() {
  return (
    <div id="press" className="px-6 py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="text-center lg:text-left">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-black mb-8">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight">For Press/Media</h2>
          <p className="text-xl md:text-2xl text-neutral-600 leading-relaxed mb-12 max-w-3xl">
            Journalists, bloggers, or researchers? Download our press kit (logo, screenshots, founder bio) or email
            press@promptandpause.com
          </p>
          <button className="px-10 py-5 bg-black text-white border-2 border-black text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-black cursor-pointer">
            DOWNLOAD PRESS KIT
          </button>
        </div>
        <div className="h-[400px] lg:h-[600px] relative">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766471149/Wellbeing-Washing-Exposed_-The-Sneaky-Side-of-Employee-Wellbeing-Tips-to-Fix-it-1024x697_ecgehe.png"
            fill
            alt="Calm water reflection"
            style={{ objectFit: "cover" }}
            className="rounded-2xl grayscale"
          />
        </div>
      </div>
    </div>
  )
}

function CrisisSection() {
  return (
    <div className="px-6 py-32 bg-white">
      <div className="max-w-5xl mx-auto">
        <div className="backdrop-blur-md bg-red-50 border-2 border-red-200 p-10 lg:p-16 rounded-3xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-600 mb-8">
            <AlertCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl md:text-5xl font-bold mb-8 leading-tight text-red-900">
            If you're in crisis or need immediate help, please contact:
          </h2>
          <div className="space-y-6 text-lg md:text-xl text-red-900 mb-8">
            <div className="flex items-start gap-4">
              <span className="font-bold min-w-[200px]">Samaritans:</span>
              <span>116 123 (UK, free, 24/7)</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-bold min-w-[200px]">NHS 111 Mental Health Crisis:</span>
              <span>111</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-bold min-w-[200px]">Mind UK:</span>
              <span>Text SHOUT to 85258</span>
            </div>
            <div className="flex items-start gap-4">
              <span className="font-bold min-w-[200px]">Crisis Text Line:</span>
              <span>Text HOME to 741741 (US)</span>
            </div>
          </div>
          <p className="text-xl text-red-800 font-bold">
            Prompt & Pause is not a crisis service. Please reach out to professionals if you're in urgent distress.
          </p>
        </div>
      </div>
    </div>
  )
}

function ResponseTimeSection() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-neutral-900 text-white">
      <div className="max-w-4xl text-center">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-12 leading-tight text-balance">
          Response Time Notice
        </h2>
        <p className="text-xl md:text-2xl leading-relaxed text-neutral-300">
          We're a small team (currently just me!), so please allow 24-48 hours for responses. Premium users get priority
          support within 24 hours.
        </p>
      </div>
    </div>
  )
}



