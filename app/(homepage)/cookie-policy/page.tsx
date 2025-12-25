"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Cookie, Settings, Eye, BarChart, Check } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"
import { useRef, useState, useEffect } from "react"
import Link from "next/link"

export default function CookiePolicyPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  const [cookiePreferences, setCookiePreferences] = useState({
    essential: true,
    functional: true,
    analytics: true,
    marketing: false,
  })

  const [saveSuccess, setSaveSuccess] = useState(false)

  const getCookie = (name: string): string | null => {
    if (typeof document === "undefined") return null
    const value = `; ${document.cookie}`
    const parts = value.split(`; ${name}=`)
    if (parts.length === 2) {
      const cookieValue = parts.pop()?.split(";").shift() || null
      return cookieValue && cookieValue.trim() !== "" ? cookieValue : null
    }
    return null
  }

  const setCookie = (name: string, value: string, days = 365) => {
    if (typeof document === "undefined") return
    const date = new Date()
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000)
    const expires = `expires=${date.toUTCString()}`
    document.cookie = `${name}=${value};${expires};path=/;SameSite=Lax`
  }

  useEffect(() => {
    try {
      const savedPreferences = getCookie("cookie_preferences")
      if (savedPreferences && savedPreferences.trim() !== '') {
        try {
          const parsed = JSON.parse(decodeURIComponent(savedPreferences))
          setCookiePreferences((prev) => ({
            ...prev,
            functional: parsed.functional ?? true,
            analytics: parsed.analytics ?? true,
            marketing: parsed.marketing ?? false,
          }))
        } catch (error) {

          // Clear the corrupted cookie
          document.cookie = "cookie_preferences=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;"
        }
      }
    } catch (error) {

    }
  }, [])

  const handleSavePreferences = () => {
    const preferences = {
      functional: cookiePreferences.functional,
      analytics: cookiePreferences.analytics,
      marketing: cookiePreferences.marketing,
    }

    // Save to cookie
    setCookie("cookie_preferences", encodeURIComponent(JSON.stringify(preferences)), 365)

    // Show success message
    setSaveSuccess(true)
    setTimeout(() => setSaveSuccess(false), 3000)

  }

  const sections = [
    { id: "what-are-cookies", title: "What Are Cookies?" },
    { id: "how-we-use", title: "How We Use Cookies" },
    { id: "types", title: "Types of Cookies" },
    { id: "third-party", title: "Third-Party Cookies" },
    { id: "manage", title: "Manage Your Preferences" },
    { id: "browser-settings", title: "Browser Settings" },
    { id: "contact", title: "Contact Us" },
  ]

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-neutral-900 via-black to-black" />

        <motion.div style={{ opacity, scale }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <Cookie className="w-16 h-16 mx-auto mb-6 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold mb-6 uppercase tracking-tight text-balance"
          >
            Cookie Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-neutral-400 mb-8 text-balance"
          >
            How we use cookies and similar technologies to improve your experience.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm text-neutral-500"
          >
            Last Updated: January 2025
          </motion.p>
        </motion.div>
      </section>

      {/* Table of Contents */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 uppercase">Contents</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {sections.map((section, index) => (
              <motion.a
                key={section.id}
                href={`#${section.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                viewport={{ once: true }}
                className="p-4 bg-white/5 backdrop-blur-md rounded-lg hover:bg-white/10 transition-all duration-300 hover:scale-105"
              >
                <span className="text-neutral-400 text-sm">0{index + 1}</span>
                <h3 className="text-lg font-bold">{section.title}</h3>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-20 px-4 bg-neutral-900/50">
        <div className="max-w-4xl mx-auto space-y-20">
          {/* What Are Cookies */}
          <div id="what-are-cookies" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">What Are Cookies?</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                Cookies are small text files that are placed on your device (computer, smartphone, or tablet) when you
                visit a website. They help websites remember your preferences, improve functionality, and provide
                analytics.
              </p>
              <p>
                Similar technologies include web beacons, pixels, and local storage. For simplicity, we refer to all
                these technologies as "cookies" in this policy.
              </p>
            </div>
          </div>

          {/* How We Use Cookies */}
          <div id="how-we-use" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">How We Use Cookies</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>Prompt & Pause uses cookies to:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Keep you signed in to your account</li>
                <li>Remember your preferences and settings</li>
                <li>Understand how you use our Service</li>
                <li>Improve performance and user experience</li>
                <li>Provide security and prevent fraud</li>
                <li>Analyze usage patterns and trends</li>
              </ul>
            </div>
          </div>

          {/* Types of Cookies */}
          <div id="types" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Types of Cookies</h2>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Settings className="w-6 h-6 text-green-500" />
                  Essential Cookies (Required)
                </h3>
                <p className="text-neutral-300 mb-4">
                  These cookies are necessary for the Service to function. They cannot be disabled.
                </p>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>
                    <strong>Authentication:</strong> Keep you logged in (Supabase session cookies)
                  </li>
                  <li>
                    <strong>Security:</strong> Protect against CSRF attacks and fraud
                  </li>
                  <li>
                    <strong>Load Balancing:</strong> Distribute traffic across servers (Vercel)
                  </li>
                </ul>
                <p className="text-sm text-neutral-500 mt-4">Duration: Session or up to 1 year</p>
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Eye className="w-6 h-6 text-blue-500" />
                  Functional Cookies
                </h3>
                <p className="text-neutral-300 mb-4">
                  These cookies enable enhanced functionality and personalization.
                </p>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>
                    <strong>Preferences:</strong> Remember your settings (theme, language, delivery method)
                  </li>
                  <li>
                    <strong>User Experience:</strong> Improve navigation and usability
                  </li>
                  <li>
                    <strong>Feature Access:</strong> Enable specific features you've requested
                  </li>
                </ul>
                <p className="text-sm text-neutral-500 mt-4">Duration: Up to 1 year</p>
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <BarChart className="w-6 h-6 text-purple-500" />
                  Analytics Cookies
                </h3>
                <p className="text-neutral-300 mb-4">These cookies help us understand how visitors use our Service.</p>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>
                    <strong>Vercel Analytics:</strong> Page views, performance metrics
                  </li>
                  <li>
                    <strong>Usage Patterns:</strong> Feature usage, user flows
                  </li>
                  <li>
                    <strong>Performance:</strong> Load times, errors, crashes
                  </li>
                </ul>
                <p className="text-sm text-neutral-500 mt-4">Duration: Up to 2 years</p>
                <p className="text-sm text-neutral-400 mt-2">Note: Analytics data is anonymized and aggregated.</p>
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Cookie className="w-6 h-6 text-orange-500" />
                  Marketing Cookies (Optional)
                </h3>
                <p className="text-neutral-300 mb-4">
                  These cookies track your activity for advertising purposes. We currently do not use marketing cookies.
                </p>
                <p className="text-sm text-neutral-500 mt-4">Duration: N/A</p>
              </div>
            </div>
          </div>

          {/* Third-Party Cookies */}
          <div id="third-party" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Third-Party Cookies</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>We use the following third-party services that may set cookies:</p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Supabase</h4>
                  <p className="text-sm text-neutral-400">Authentication and session management cookies.</p>
                  <a
                    href="https://supabase.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Privacy Policy
                  </a>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Stripe</h4>
                  <p className="text-sm text-neutral-400">Payment processing and fraud prevention cookies.</p>
                  <a
                    href="https://stripe.com/privacy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Privacy Policy
                  </a>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Vercel</h4>
                  <p className="text-sm text-neutral-400">Hosting, analytics, and performance cookies.</p>
                  <a
                    href="https://vercel.com/legal/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Privacy Policy
                  </a>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Slack</h4>
                  <p className="text-sm text-neutral-400">Integration cookies (only if you connect Slack).</p>
                  <a
                    href="https://slack.com/privacy-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Privacy Policy
                  </a>
                </div>
              </div>

              <p className="mt-6 p-4 bg-neutral-800 rounded-lg">
                <strong>Note:</strong> We do not control third-party cookies. Please review their privacy policies for
                more information.
              </p>
            </div>
          </div>

          {/* Manage Preferences */}
          <div id="manage" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Manage Your Preferences</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                You can manage your cookie preferences below. Note that disabling certain cookies may affect
                functionality.
              </p>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg mt-6 space-y-4">
                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <h4 className="font-bold">Essential Cookies</h4>
                    <p className="text-sm text-neutral-400">Required for the Service to function</p>
                  </div>
                  <div className="text-green-500 font-bold">Always On</div>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <h4 className="font-bold">Functional Cookies</h4>
                    <p className="text-sm text-neutral-400">Remember your preferences</p>
                  </div>
                  <button
                    onClick={() => setCookiePreferences((prev) => ({ ...prev, functional: !prev.functional }))}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                      cookiePreferences.functional
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-neutral-600 hover:bg-neutral-700"
                    }`}
                  >
                    {cookiePreferences.functional ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <h4 className="font-bold">Analytics Cookies</h4>
                    <p className="text-sm text-neutral-400">Help us improve the Service</p>
                  </div>
                  <button
                    onClick={() => setCookiePreferences((prev) => ({ ...prev, analytics: !prev.analytics }))}
                    className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                      cookiePreferences.analytics
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-neutral-600 hover:bg-neutral-700"
                    }`}
                  >
                    {cookiePreferences.analytics ? "Enabled" : "Disabled"}
                  </button>
                </div>

                <div className="flex items-center justify-between p-4 bg-neutral-800 rounded-lg">
                  <div>
                    <h4 className="font-bold">Marketing Cookies</h4>
                    <p className="text-sm text-neutral-400">Currently not used</p>
                  </div>
                  <div className="text-neutral-500 font-bold">N/A</div>
                </div>

                <button
                  onClick={handleSavePreferences}
                  className="w-full mt-4 px-6 py-3 bg-white text-black font-bold uppercase hover:bg-neutral-200 transition-colors relative"
                >
                  {saveSuccess ? (
                    <span className="flex items-center justify-center gap-2">
                      <Check className="w-5 h-5" />
                      Preferences Saved!
                    </span>
                  ) : (
                    "Save Preferences"
                  )}
                </button>

                {saveSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-green-600 text-white rounded-lg flex items-center gap-3"
                  >
                    <Check className="w-5 h-5" />
                    <span>Your cookie preferences have been saved to your browser.</span>
                  </motion.div>
                )}
              </div>
            </div>
          </div>

          {/* Browser Settings */}
          <div id="browser-settings" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Browser Settings</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>You can also control cookies through your browser settings:</p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Chrome</h4>
                  <p className="text-sm text-neutral-400">Settings → Privacy and security → Cookies</p>
                  <a
                    href="https://support.google.com/chrome/answer/95647"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Learn More
                  </a>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Firefox</h4>
                  <p className="text-sm text-neutral-400">Settings → Privacy & Security → Cookies</p>
                  <a
                    href="https://support.mozilla.org/en-US/kb/cookies-information-websites-store-on-your-computer"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Learn More
                  </a>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Safari</h4>
                  <p className="text-sm text-neutral-400">Preferences → Privacy → Cookies</p>
                  <a
                    href="https://support.apple.com/guide/safari/manage-cookies-sfri11471/mac"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Learn More
                  </a>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Edge</h4>
                  <p className="text-sm text-neutral-400">Settings → Cookies and site permissions</p>
                  <a
                    href="https://support.microsoft.com/en-us/microsoft-edge/delete-cookies-in-microsoft-edge-63947406-40ac-c3b8-57b9-2a946a29ae09"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-white underline mt-2 inline-block"
                  >
                    Learn More
                  </a>
                </div>
              </div>

              <p className="mt-6 p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
                <strong>Warning:</strong> Blocking all cookies may prevent you from using essential features of Prompt &
                Pause, including logging in and saving preferences.
              </p>
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Contact Us</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>For questions about our use of cookies:</p>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg mt-6">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@promptandpause.com" className="text-white underline hover:text-neutral-300">
                    privacy@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Privacy Policy:</strong>{" "}
                  <Link href="/homepage/privacy-policy" className="text-white underline hover:text-neutral-300">
                    View Full Policy
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase">Questions About Cookies?</h2>
          <p className="text-xl text-neutral-400 mb-8">We're transparent about how we use your data.</p>
          <Link
            href="/homepage/contact"
            className="inline-block px-8 py-4 bg-white text-black font-bold uppercase hover:bg-neutral-200 transition-colors duration-300"
          >
            Contact Us
          </Link>
        </div>
      </section>
    </main>
      <Footer />
    </>
  )
}


