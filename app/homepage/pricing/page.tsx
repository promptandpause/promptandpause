"use client"

import { useEffect, useRef, useState } from "react"
import Image from "next/image"
import Lenis from "lenis"
import { useScroll, useTransform, motion, AnimatePresence } from "framer-motion"
import { Check, X, Shield, Lock, Server, MapPin, ChevronDown, Sparkles, TrendingUp, Users } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"

// Metadata must be exported from a Server Component or layout
// See app/homepage/pricing/layout.tsx for metadata

export default function PricingPage() {
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
      <PricingCardsSection />
      <ComparisonTableSection />
      <FAQSection />
      <GuaranteeSection />
      <TestimonialsSection />
      <EnterpriseSection />
      <FinalCTASection />
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
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0])

  return (
    <div ref={container} className="h-screen overflow-hidden relative">
      <motion.div style={{ y }} className="relative h-full">
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469166/mountain-landscape_agzol8.jpg"
          fill
          alt="Mountain landscape"
          style={{ objectFit: "cover" }}
          className="brightness-[0.35]"
        />
        <motion.div style={{ opacity }} className="absolute inset-0 flex items-center justify-center z-10 px-6">
          <div className="text-center text-white max-w-5xl">
            <h1 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-8 leading-tight text-balance">
              Simple Pricing. No Hidden Fees.
            </h1>
            <p className="text-lg md:text-2xl lg:text-3xl leading-relaxed text-balance max-w-3xl mx-auto">
              Start free forever, or upgrade to Premium for deeper reflection and insights.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

function PricingCardsSection() {
  const [isAnnual, setIsAnnual] = useState(false)

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <div className="flex items-center justify-center gap-4 mb-20">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-8 py-3 text-lg font-medium transition-all duration-300 ${
              !isAnnual ? "text-black" : "text-neutral-400"
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(!isAnnual)}
            className="relative w-16 h-8 bg-neutral-200 rounded-full transition-all duration-300 hover:bg-neutral-300"
          >
            <motion.div
              className="absolute top-1 left-1 w-6 h-6 bg-black rounded-full"
              animate={{ x: isAnnual ? 32 : 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-8 py-3 text-lg font-medium transition-all duration-300 ${
              isAnnual ? "text-black" : "text-neutral-400"
            }`}
          >
            Annual
          </button>
          <AnimatePresence>
            {isAnnual && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="px-4 py-2 bg-black text-white text-sm font-medium rounded-full"
              >
                Save £45
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-md bg-neutral-50/80 border-2 border-neutral-200 p-10 lg:p-12 rounded-3xl hover:shadow-xl transition-all duration-500"
          >
            <div className="inline-block px-4 py-1 bg-neutral-200 text-neutral-700 text-sm font-medium rounded-full mb-6">
              Free Forever
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">Start Your Practice</h3>
            <div className="mb-8">
              <div className="text-6xl md:text-7xl font-bold mb-2">£0</div>
              <div className="text-xl text-neutral-600">per month</div>
            </div>

            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">3 personalized prompts per week</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Basic mood tracking (1-10 scale)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Save up to 50 reflections</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">UK/US crisis resources</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Email delivery</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Choose your delivery time</span>
              </div>
            </div>

            <div className="border-t border-neutral-300 pt-8 mb-10">
              <p className="text-sm font-medium text-neutral-500 mb-4">What's NOT included:</p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <span className="text-neutral-500">Daily prompts (3x/week only)</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <span className="text-neutral-500">Weekly insight digest</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <span className="text-neutral-500">Advanced analytics</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <span className="text-neutral-500">Slack delivery</span>
                </div>
                <div className="flex items-start gap-3">
                  <X className="w-5 h-5 flex-shrink-0 mt-0.5 text-neutral-400" />
                  <span className="text-neutral-500">Voice note prompts</span>
                </div>
              </div>
            </div>

            <a
              href="/auth/signup"
              className="block w-full px-10 py-5 border-2 border-black bg-transparent text-black text-base font-medium tracking-wide transition-all duration-300 hover:bg-black hover:text-white cursor-pointer text-center"
            >
              START FREE
            </a>
            <p className="text-center text-sm text-neutral-500 mt-4">No credit card required</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-md bg-white border-2 border-black p-10 lg:p-12 rounded-3xl shadow-2xl hover:shadow-3xl hover:scale-[1.02] transition-all duration-500 relative"
          >
            <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-black text-white text-sm font-medium rounded-full">
              Most Popular
            </div>
            <h3 className="text-3xl md:text-4xl font-bold mb-4 leading-tight mt-4">Deepen Your Reflection</h3>
            <AnimatePresence mode="wait">
              {!isAnnual ? (
                <motion.div
                  key="monthly"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-8"
                >
                  <div className="text-6xl md:text-7xl font-bold mb-2">£12</div>
                  <div className="text-xl text-neutral-600">per month</div>
                </motion.div>
              ) : (
                <motion.div
                  key="annual"
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="mb-8"
                >
                  <div className="text-6xl md:text-7xl font-bold mb-2">£99</div>
                  <div className="text-xl text-neutral-600 mb-2">per year</div>
                  <div className="text-sm text-neutral-500">£8.25/month - Save £45 vs monthly</div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4 mb-10">
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg font-medium">Everything in Free, plus:</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Daily personalized prompts (7 days/week)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Unlimited reflection archive</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Weekly insight digest (AI-generated)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Advanced mood analytics & charts</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Delivery via Email OR Slack</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Voice note prompts (listen on-the-go)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Custom focus areas</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Export reflections (PDF/TXT)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Priority email support (24hr response)</span>
              </div>
              <div className="flex items-start gap-3">
                <Check className="w-6 h-6 flex-shrink-0 mt-1 text-black" />
                <span className="text-lg">Cancel anytime, no questions asked</span>
              </div>
            </div>

            <a
              href="/homepage/pricing"
              className="block w-full px-10 py-5 bg-black text-white border-2 border-black text-base font-medium tracking-wide transition-all duration-300 hover:bg-neutral-800 cursor-pointer text-center"
            >
              START 7-DAY FREE TRIAL
            </a>
            <p className="text-center text-sm text-neutral-500 mt-4">
              No credit card required for trial. £{isAnnual ? "99/year" : "12/month"} after.
            </p>
            <p className="text-center text-xs text-neutral-400 mt-2">Less than 2 coffees in London • £0.40 per day</p>
          </motion.div>
        </div>

        <div className="mt-16 flex items-center justify-center gap-8 flex-wrap">
          <div className="flex items-center gap-2 text-neutral-600">
            <Shield className="w-5 h-5" />
            <span className="text-sm">Stripe Verified</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <Lock className="w-5 h-5" />
            <span className="text-sm">GDPR Compliant</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <Server className="w-5 h-5" />
            <span className="text-sm">Encrypted</span>
          </div>
          <div className="flex items-center gap-2 text-neutral-600">
            <MapPin className="w-5 h-5" />
            <span className="text-sm">UK-Based</span>
          </div>
        </div>
        <p className="text-center text-sm text-neutral-500 mt-4 max-w-2xl mx-auto">
          Your data is encrypted, never sold, and stored securely in UK/EU servers.
        </p>
      </div>
    </div>
  )
}

function ComparisonTableSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-50">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight text-center">
          Compare Plans in Detail
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="text-left py-6 px-4 text-lg md:text-xl font-bold">Feature</th>
                <th className="text-center py-6 px-4 text-lg md:text-xl font-bold">Free</th>
                <th className="text-center py-6 px-4 text-lg md:text-xl font-bold bg-black text-white">Premium</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Personalized prompts</td>
                <td className="py-6 px-4 text-center">3/week</td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">Daily (7/week)</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Reflection archive</td>
                <td className="py-6 px-4 text-center">50 reflections</td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">Unlimited</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Mood tracking</td>
                <td className="py-6 px-4 text-center">Basic (1-10 scale)</td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">Advanced with charts</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Weekly digest</td>
                <td className="py-6 px-4 text-center">
                  <X className="w-6 h-6 text-neutral-300 mx-auto" />
                </td>
                <td className="py-6 px-4 text-center bg-neutral-100">
                  <Check className="w-6 h-6 text-black mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Delivery methods</td>
                <td className="py-6 px-4 text-center">Email only</td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">Email + Slack</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Voice note prompts</td>
                <td className="py-6 px-4 text-center">
                  <X className="w-6 h-6 text-neutral-300 mx-auto" />
                </td>
                <td className="py-6 px-4 text-center bg-neutral-100">
                  <Check className="w-6 h-6 text-black mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Delivery time choice</td>
                <td className="py-6 px-4 text-center">
                  <Check className="w-6 h-6 text-black mx-auto" />
                </td>
                <td className="py-6 px-4 text-center bg-neutral-100">
                  <Check className="w-6 h-6 text-black mx-auto" />
                </td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Focus area customization</td>
                <td className="py-6 px-4 text-center">Limited</td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">Fully customizable</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Export reflections</td>
                <td className="py-6 px-4 text-center">
                  <X className="w-6 h-6 text-neutral-300 mx-auto" />
                </td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">PDF/TXT</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="py-6 px-4 font-medium">Support response time</td>
                <td className="py-6 px-4 text-center">48-72 hours</td>
                <td className="py-6 px-4 text-center bg-neutral-100 font-bold">24 hours (priority)</td>
              </tr>
              <tr>
                <td className="py-6 px-4 font-medium">Cancel anytime</td>
                <td className="py-6 px-4 text-center">
                  <Check className="w-6 h-6 text-black mx-auto" />
                </td>
                <td className="py-6 px-4 text-center bg-neutral-100">
                  <Check className="w-6 h-6 text-black mx-auto" />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const faqs = [
    {
      question: "Can I try Premium before paying?",
      answer:
        "Yes! Start a 7-day free trial with no credit card required. You'll get full Premium access, and if you love it, upgrade seamlessly.",
    },
    {
      question: "What happens if I cancel Premium?",
      answer:
        "You'll revert to the Free tier (3 prompts/week). All your past reflections stay accessible. No hard feelings—re-upgrade anytime.",
    },
    {
      question: "Is there a student/NHS worker discount?",
      answer:
        "Yes! Email us at support@promptandpause.com with proof of student status or NHS ID for 40% off Premium (£7.20/month or £59/year).",
    },
    {
      question: "Do you offer refunds?",
      answer:
        "Yes. If you're unhappy within the first 30 days of Premium, email us for a full refund—no questions asked.",
    },
    {
      question: "Can I switch from monthly to annual?",
      answer: "Absolutely. Go to Account Settings → Billing and switch plans. We'll prorate your existing payment.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "All major credit/debit cards via Stripe. Payments are secure and encrypted. We never see your card details.",
    },
    {
      question: "Will the price increase?",
      answer: "Not for existing users. If we raise prices, you'll be grandfathered in at your original rate forever.",
    },
    {
      question: "Can I gift Premium to someone?",
      answer: "Yes! Visit our Support Us page to purchase 1, 3, or 6-month gift subscriptions.",
    },
  ]

  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-4xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">Pricing Questions</h2>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={false}
              className="border-2 border-neutral-200 rounded-2xl overflow-hidden hover:border-black transition-colors duration-300"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full px-8 py-6 flex items-center justify-between text-left hover:bg-neutral-50 transition-colors duration-300"
              >
                <span className="text-xl md:text-2xl font-bold pr-8">{faq.question}</span>
                <motion.div
                  animate={{ rotate: openIndex === index ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  className="flex-shrink-0"
                >
                  <ChevronDown className="w-6 h-6" />
                </motion.div>
              </button>
              <AnimatePresence>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-8 pb-6 text-lg md:text-xl leading-relaxed text-neutral-600">{faq.answer}</div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GuaranteeSection() {
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
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469289/spiral-circles_wvgym8.jpg"
            fill
            alt="Guarantee background"
            style={{ objectFit: "cover" }}
            className="brightness-[0.3]"
          />
        </motion.div>
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-32 text-center">
        <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 md:p-16 lg:p-20">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-white mb-8">
            <Shield className="w-10 h-10 text-black" />
          </div>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 leading-tight text-white">
            30-Day Money-Back Guarantee
          </h2>
          <p className="text-xl md:text-2xl leading-relaxed text-white/90">
            Try Premium risk-free. If it's not working for you, email us within 30 days for a full refund. We'll even
            let you keep your reflections.
          </p>
        </div>
      </div>
    </div>
  )
}

function TestimonialsSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-white">
      <div className="max-w-7xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-20 leading-tight">What Premium Users Say</h2>
        <div className="grid md:grid-cols-3 gap-8 lg:gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="w-5 h-5 fill-black" />
              ))}
            </div>
            <p className="text-lg md:text-xl leading-relaxed text-neutral-700 mb-8 italic">
              "I was skeptical about paying for prompts, but the weekly digest alone is worth it. Seeing my patterns
              over time has been genuinely eye-opening."
            </p>
            <div>
              <p className="font-bold text-lg">Sarah M., London</p>
              <p className="text-sm text-neutral-500">Premium user - 4 months</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="w-5 h-5 fill-black" />
              ))}
            </div>
            <p className="text-lg md:text-xl leading-relaxed text-neutral-700 mb-8 italic">
              "The voice note feature is brilliant for my commute. I listen, reflect while walking, then type my
              thoughts in the evening. Perfect for ADHD brains like mine."
            </p>
            <div>
              <p className="font-bold text-lg">James T., Manchester</p>
              <p className="text-sm text-neutral-500">Premium user - 7 months</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="backdrop-blur-md bg-neutral-50/80 border border-neutral-200 p-10 lg:p-12 rounded-3xl hover:bg-white hover:shadow-2xl transition-all duration-500"
          >
            <div className="flex gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Sparkles key={i} className="w-5 h-5 fill-black" />
              ))}
            </div>
            <p className="text-lg md:text-xl leading-relaxed text-neutral-700 mb-8 italic">
              "I upgraded after 2 weeks on Free. The daily prompts keep me consistent in a way nothing else has. It's
              like having a thoughtful friend check in every morning."
            </p>
            <div>
              <p className="font-bold text-lg">Priya K., Birmingham</p>
              <p className="text-sm text-neutral-500">Premium user - 11 months</p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

function EnterpriseSection() {
  return (
    <div className="min-h-screen flex items-center px-6 py-32 bg-neutral-900 text-white">
      <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
        <div className="h-[400px] lg:h-[600px] relative">
          <Image
            src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766471149/Wellbeing-Washing-Exposed_-The-Sneaky-Side-of-Employee-Wellbeing-Tips-to-Fix-it-1024x697_ecgehe.png"
            fill
            alt="Team collaboration"
            style={{ objectFit: "cover" }}
            className="rounded-2xl grayscale"
          />
        </div>
        <div>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full mb-8">
            <Users className="w-4 h-4" />
            <span className="text-sm font-medium">For Organizations</span>
          </div>
          <h2 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-10 leading-tight">Team & Workplace Plans</h2>
          <p className="text-xl md:text-2xl leading-relaxed text-white/80 mb-12">
            Support mental health across your organization with Prompt & Pause for Teams. Custom pricing for 10+ users.
          </p>
          <div className="space-y-4 mb-12">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-lg">Centralized billing</span>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-lg">Anonymous usage analytics</span>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-lg">Custom focus areas for your industry</span>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="w-6 h-6 flex-shrink-0 mt-1" />
              <span className="text-lg">Dedicated account manager</span>
            </div>
          </div>

          <a
            href="/homepage/contact"
            className="inline-block px-10 py-5 bg-white text-black border-2 border-white text-base font-medium tracking-wide transition-all duration-300 hover:bg-transparent hover:text-white cursor-pointer"
          >
            CONTACT SALES
          </a>
          <p className="text-sm text-white/60 mt-4">Starting at £75/month for 10 users</p>
        </div>
      </div>
    </div>
  )
}

function FinalCTASection() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6 py-32 bg-white">
      <div className="max-w-4xl text-center">
        <h2 className="text-4xl md:text-6xl lg:text-8xl font-bold mb-12 leading-tight text-balance">
          Not Sure Yet? Start Free
        </h2>
        <p className="text-xl md:text-2xl leading-relaxed text-neutral-600 mb-16 max-w-3xl mx-auto">
          No pressure. Start with the free tier and see how daily reflection fits into your life. Upgrade when you're
          ready—no commitment needed.
        </p>
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <a
            href="/auth/signup"
            className="px-10 py-5 bg-black text-white border-2 border-black text-base font-medium tracking-wide transition-all duration-300 hover:bg-neutral-800 cursor-pointer text-center"
          >
            START FREE
          </a>
          <a
            href="/homepage/pricing"
            className="px-10 py-5 border-2 border-black bg-transparent text-black text-base font-medium tracking-wide transition-all duration-300 hover:bg-black hover:text-white cursor-pointer text-center"
          >
            TRY PREMIUM FREE FOR 7 DAYS
          </a>
        </div>
        <p className="text-sm text-neutral-500 mt-8">Cancel anytime • No contracts • Keep your reflections</p>
      </div>
    </div>
  )
}
