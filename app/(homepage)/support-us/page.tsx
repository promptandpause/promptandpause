"use client"

import { useEffect, useState, useRef } from "react"
import Image from "next/image"
import Lenis from "lenis"
import { useScroll, useTransform, motion } from "framer-motion"
import { Star, Gift, Megaphone, Handshake } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"

export default function SupportUsPage() {
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
      <WhySupportSection />
      <WaysToSupportSection />
      <ImpactStatsSection />
      <TransparencySection />
      <OtherWaysSection />
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

  const y = useTransform(scrollYProgress, [0, 1], ["0vh", "80vh"])
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0])

  return (
    <div ref={container} className="h-screen overflow-hidden relative">
      <motion.div style={{ y }} className="relative h-full">
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469289/spiral-circles_wvgym8.jpg"
          fill
          alt="Support background"
          style={{ objectFit: "cover" }}
          className="brightness-[0.35]"
        />
        <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center z-10 px-6">
          <div className="text-center text-white max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight text-balance">
              Help Us Keep Mental Health Support Accessible
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed text-balance max-w-4xl mx-auto">
              Prompt & Pause operates on a freemium model—our free tier stays free forever. Here's how you can support
              our mission.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function WhySupportSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="h-[400px] lg:h-[600px] relative">
          <Image
            src="/images/hands-together.jpg"
            fill
            alt="Hands together in support"
            style={{ objectFit: "cover" }}
            className="rounded-2xl grayscale"
          />
        </div>
        <div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-16 leading-tight">Why Support Matters</h2>
          <div className="space-y-8 text-lg md:text-2xl leading-relaxed text-neutral-700">
            <p className="text-xl md:text-3xl font-bold text-black mb-12">
              We're a bootstrapped mental health service built by someone who needed it. Every contribution helps us:
            </p>
            <ul className="space-y-6 text-lg md:text-xl">
              <li className="flex items-start gap-4">
                <span className="text-2xl">•</span>
                <span>Keep the free tier free (no ads, ever)</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl">•</span>
                <span>Improve AI prompt quality</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl">•</span>
                <span>Add NHS crisis resources</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl">•</span>
                <span>Expand to support more UK regions</span>
              </li>
              <li className="flex items-start gap-4">
                <span className="text-2xl">•</span>
                <span>Build features requested by our community</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

function WaysToSupportSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Ways to Support</h2>
        <div className="grid md:grid-cols-2 gap-8 lg:gap-10">
          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6 group-hover:scale-110 transition-transform duration-300">
              <Star className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Upgrade to Premium</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-4">£12/month or £99/year</p>
            <p className="text-neutral-600 leading-relaxed text-lg mb-8">
              Get daily personalized prompts, advanced analytics, and priority support—while funding free access for
              others.
            </p>
            <a
              href="/homepage/pricing"
              className="block px-8 py-4 bg-black text-white text-sm font-medium tracking-wide transition-all duration-300 hover:bg-neutral-800 cursor-pointer w-full text-center"
            >
              VIEW PREMIUM FEATURES
            </a>
          </div>

          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6 group-hover:scale-110 transition-transform duration-300">
              <Gift className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Gift Premium to Someone</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-4">From £12</p>
            <p className="text-neutral-600 leading-relaxed text-lg mb-8">
              Know someone navigating a tough time? Gift them 1, 3, or 6 months of Premium.
            </p>
            <a
              href="/homepage/pricing"
              className="block px-8 py-4 bg-black text-white text-sm font-medium tracking-wide transition-all duration-300 hover:bg-neutral-800 cursor-pointer w-full text-center"
            >
              GIFT PREMIUM
            </a>
          </div>

          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6 group-hover:scale-110 transition-transform duration-300">
              <Megaphone className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Spread the Word</h3>
            <p className="text-2xl font-bold text-neutral-900 mb-4">Free</p>
            <p className="text-neutral-600 leading-relaxed text-lg mb-8">
              Share Prompt & Pause with friends, on LinkedIn, or in your workplace Slack. Word-of-mouth is our best
              marketing.
            </p>
            <div className="flex gap-4">
              <a
                href="https://twitter.com/intent/tweet?text=Check%20out%20@promptandpause%20for%20daily%20mental%20health%20reflection"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-4 border-2 border-black text-black text-sm font-medium tracking-wide transition-all duration-300 hover:bg-black hover:text-white cursor-pointer text-center"
              >
                TWITTER
              </a>
              <a
                href="https://www.linkedin.com/sharing/share-offsite/?url=https://promptandpause.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-6 py-4 border-2 border-black text-black text-sm font-medium tracking-wide transition-all duration-300 hover:bg-black hover:text-white cursor-pointer text-center"
              >
                LINKEDIN
              </a>
            </div>
          </div>

          <div className="group backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl hover:scale-[1.02] transition-all duration-500">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-black mb-6 group-hover:scale-110 transition-transform duration-300">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Partner with Us</h3>
            <p className="text-neutral-600 leading-relaxed text-lg mb-8 mt-12">
              Are you a therapist, HR leader, or wellness advocate? Let's collaborate to reach more people.
            </p>
            <a
              href="/homepage/contact"
              className="block px-8 py-4 bg-black text-white text-sm font-medium tracking-wide transition-all duration-300 hover:bg-neutral-800 cursor-pointer w-full text-center"
            >
              CONTACT US
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

function ImpactStatsSection() {
  const container = useRef(null)
  const { scrollYProgress } = useScroll({
    target: container,
    offset: ["start end", "end start"],
  })
  const y = useTransform(scrollYProgress, [0, 1], ["-5vh", "5vh"])

  return (
    <div
      ref={container}
      className="relative flex items-center justify-center min-h-screen overflow-hidden"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="fixed top-[-10vh] left-0 h-[120vh] w-full">
        <motion.div style={{ y }} className="relative w-full h-full">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
            fill
            alt="Impact background"
            style={{ objectFit: "cover" }}
            className="brightness-[0.3]"
          />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-32 w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight text-white text-center">
          Our Impact
        </h2>
        <div className="grid md:grid-cols-3 gap-12 lg:gap-16">
          <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12">
            <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4">2,847</div>
            <p className="text-xl md:text-2xl text-white/90">Free users supported</p>
          </div>
          <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12">
            <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4">68%</div>
            <p className="text-xl md:text-2xl text-white/90">Engagement rate</p>
          </div>
          <div className="text-center backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12">
            <div className="text-6xl md:text-7xl lg:text-8xl font-bold text-white mb-4">£0</div>
            <p className="text-xl md:text-2xl text-white/90">VC funding taken (bootstrapped)</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function TransparencySection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-16 leading-tight">Where Your Money Goes</h2>
        <div className="space-y-8 mb-16">
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-24 text-3xl font-bold text-neutral-900">40%</div>
            <div className="flex-1 h-4 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: "40%" }} />
            </div>
            <div className="flex-shrink-0 w-64 text-lg text-neutral-600">AI infrastructure (Groq/OpenAI APIs)</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-24 text-3xl font-bold text-neutral-900">25%</div>
            <div className="flex-1 h-4 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: "25%" }} />
            </div>
            <div className="flex-shrink-0 w-64 text-lg text-neutral-600">Email delivery (Resend)</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-24 text-3xl font-bold text-neutral-900">20%</div>
            <div className="flex-1 h-4 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: "20%" }} />
            </div>
            <div className="flex-shrink-0 w-64 text-lg text-neutral-600">Development & maintenance</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-24 text-3xl font-bold text-neutral-900">10%</div>
            <div className="flex-1 h-4 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: "10%" }} />
            </div>
            <div className="flex-shrink-0 w-64 text-lg text-neutral-600">Payment processing (Stripe)</div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex-shrink-0 w-24 text-3xl font-bold text-neutral-900">5%</div>
            <div className="flex-1 h-4 bg-neutral-200 rounded-full overflow-hidden">
              <div className="h-full bg-black rounded-full" style={{ width: "5%" }} />
            </div>
            <div className="flex-shrink-0 w-64 text-lg text-neutral-600">Domain & hosting</div>
          </div>
        </div>
        <p className="text-xl md:text-2xl leading-relaxed text-neutral-600 italic">
          We're not profitable yet, but we're committed to sustainable growth without compromise on quality or privacy.
        </p>
      </div>
    </div>
  )
}

function OtherWaysSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-50">
      <div className="max-w-5xl mx-auto">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-16 leading-tight">Other Ways to Help</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="group p-8 border-2 border-neutral-200 hover:border-black transition-all duration-300 cursor-pointer">
            <h3 className="text-2xl font-bold mb-3">Leave a Review</h3>
            <p className="text-neutral-600 text-lg">Help others discover us on Trustpilot or ProductHunt</p>
          </div>
          <div className="group p-8 border-2 border-neutral-200 hover:border-black transition-all duration-300 cursor-pointer">
            <h3 className="text-2xl font-bold mb-3">Suggest Features</h3>
            <p className="text-neutral-600 text-lg">Tell us what would make Prompt & Pause better for you</p>
          </div>
          <div className="group p-8 border-2 border-neutral-200 hover:border-black transition-all duration-300 cursor-pointer">
            <h3 className="text-2xl font-bold mb-3">Report Bugs</h3>
            <p className="text-neutral-600 text-lg">Help us improve by reporting technical issues</p>
          </div>
          <div className="group p-8 border-2 border-neutral-200 hover:border-black transition-all duration-300 cursor-pointer">
            <h3 className="text-2xl font-bold mb-3">Share Your Story</h3>
            <p className="text-neutral-600 text-lg">Your reflection journey could inspire others</p>
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
          Ready to Support?
        </h2>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href="/homepage/pricing"
            className="px-10 py-5 bg-white text-black border-2 border-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-white cursor-pointer text-center"
          >
            UPGRADE TO PREMIUM
          </a>
          <a
            href="/homepage/pricing"
            className="px-10 py-5 border-2 border-white bg-transparent text-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-white hover:text-black cursor-pointer text-center"
          >
            GIFT PREMIUM
          </a>
          <a
            href="/homepage/contact"
            className="px-10 py-5 border-2 border-white bg-transparent text-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-white hover:text-black cursor-pointer text-center"
          >
            JUST SAY HI
          </a>
        </div>
      </div>
    </div>
  )
}


