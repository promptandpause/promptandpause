"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { FileText, AlertTriangle, Scale, UserCheck } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"
import { useRef } from "react"
import Link from "next/link"

export default function TermsOfServicePage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  const sections = [
    { id: "acceptance", title: "Acceptance of Terms" },
    { id: "service-description", title: "Service Description" },
    { id: "user-accounts", title: "User Accounts" },
    { id: "subscription", title: "Subscription & Payment" },
    { id: "user-conduct", title: "User Conduct" },
    { id: "intellectual-property", title: "Intellectual Property" },
    { id: "disclaimer", title: "Medical Disclaimer" },
    { id: "limitation", title: "Limitation of Liability" },
    { id: "termination", title: "Termination" },
    { id: "governing-law", title: "Governing Law" },
    { id: "changes", title: "Changes to Terms" },
    { id: "contact", title: "Contact Information" },
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
            <FileText className="w-16 h-16 mx-auto mb-6 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold mb-6 uppercase tracking-tight text-balance"
          >
            Terms of Service
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-neutral-400 mb-8 text-balance"
          >
            The legal agreement between you and Prompt & Pause.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm text-neutral-500"
          >
            Effective Date: January 2026
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
          {/* Acceptance */}
          <div id="acceptance" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Acceptance of Terms</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                By accessing or using Prompt & Pause ("Service"), you agree to be bound by these Terms of Service
                ("Terms"). If you do not agree to these Terms, do not use the Service.
              </p>
              <p>
                These Terms constitute a legally binding agreement between you ("User," "you," or "your") and Prompt &
                Pause ("we," "us," or "our"), a service operated in the United Kingdom.
              </p>
              <p className="p-4 bg-neutral-800 rounded-lg">
                <strong>Important:</strong> By creating an account or using our Service, you acknowledge that you have
                read, understood, and agree to be bound by these Terms and our{" "}
                <Link href="/privacy-policy" className="text-white underline">
                  Privacy Policy
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Service Description */}
          <div id="service-description" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Service Description</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>Prompt & Pause provides:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Daily mental health reflection prompts delivered via email or Slack</li>
                <li>AI-powered personalized prompts using multiple AI providers (OpenAI, Anthropic, Groq, etc.)</li>
                <li>Reflection tracking and mood analytics</li>
                <li>Premium features including advanced analytics, custom focus areas, and unlimited prompts</li>
                <li>Self-journaling features for private reflection</li>
              </ul>
              <p className="mt-6">
                We reserve the right to modify, suspend, or discontinue any aspect of the Service at any time, with or
                without notice.
              </p>
            </div>
          </div>

          {/* User Accounts */}
          <div id="user-accounts" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase flex items-center gap-3">
              <UserCheck className="w-8 h-8" />
              User Accounts
            </h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <h3 className="text-2xl font-bold mt-6">Account Creation</h3>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>You must be at least 16 years old to create an account (UK/EU) or 13 years old (US)</li>
                <li>You must provide accurate, complete, and current information</li>
                <li>You are responsible for maintaining the confidentiality of your account credentials</li>
                <li>You are responsible for all activities under your account</li>
                <li>You agree to update your information if it changes</li>
              </ul>

              <h3 className="text-2xl font-bold mt-6">Account Security</h3>
              <p>You agree to:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Use a strong, unique password</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>Not share your account with others</li>
                <li>Not use another user's account without permission</li>
              </ul>

              <h3 className="text-2xl font-bold mt-6">AI Transparency</h3>
              <p className="p-4 bg-blue-900/20 border border-blue-900/50 rounded-lg">
                <strong>AI Disclosure:</strong> Our service uses artificial intelligence to generate personalized prompts. 
                AI-generated content is for reflection purposes only and should not be considered medical or therapeutic advice.
              </p>
              
              <h3 className="text-2xl font-bold mt-6">Mental Health Disclaimer</h3>
              <p className="p-4 bg-yellow-900/20 border border-yellow-900/50 rounded-lg">
                <strong>Important:</strong> Prompt & Pause is not a substitute for professional mental health services. 
                If you are experiencing a mental health crisis, please contact emergency services or a qualified healthcare provider.
              </p>
            </div>
          </div>

          {/* Subscription & Payment */}
          <div id="subscription" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Subscription & Payment</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <h3 className="text-2xl font-bold">Pricing</h3>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>
                  <strong>Free Tier:</strong> £0/month - 3 prompts per week, basic features
                </li>
                <li>
                  <strong>Premium Tier:</strong> £12/month or £99/year - Unlimited prompts, advanced analytics, custom focus areas
                </li>
                <li>
                  <strong>7-Day Trial:</strong> Full Premium access for new users
                </li>
              </ul>

              <h3 className="text-2xl font-bold mt-6">Payment Terms</h3>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>All payments are processed securely through Stripe</li>
                <li>Subscriptions automatically renew unless cancelled</li>
                <li>You authorize us to charge your payment method on each renewal date</li>
                <li>Prices are subject to change with 30 days' notice</li>
                <li>All fees are non-refundable except as required by law or our refund policy</li>
              </ul>

              <h3 className="text-2xl font-bold mt-6">Refund Policy</h3>
              <p>
                We offer a 14-day money-back guarantee for Premium subscriptions. To request a refund, contact{" "}
                <a href="mailto:support@promptandpause.com" className="text-white underline">
                  support@promptandpause.com
                </a>{" "}
                within 14 days of purchase.
              </p>

              <h3 className="text-2xl font-bold mt-6">Data Processing Addendum</h3>
              <p>
                Our data processing complies with UK Data Protection Act 2018, EU GDPR, and US state privacy laws. 
                Detailed data processing information is available in our Privacy Policy.
              </p>
            </div>
          </div>

          {/* User Conduct */}
          <div id="user-conduct" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">User Conduct</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>You agree NOT to:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Use the Service for any illegal purpose</li>
                <li>Violate any laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Transmit harmful code, viruses, or malware</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Interfere with or disrupt the Service</li>
                <li>Use automated systems (bots, scrapers) without permission</li>
                <li>Impersonate others or provide false information</li>
                <li>Harass, abuse, or harm others</li>
                <li>Use the Service to provide therapy or medical advice to others</li>
              </ul>
              <p className="mt-6 p-4 bg-neutral-800 rounded-lg">
                Violation of these terms may result in immediate account termination and legal action.
              </p>
            </div>
          </div>

          {/* Intellectual Property */}
          <div id="intellectual-property" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Intellectual Property</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <h3 className="text-2xl font-bold">Our Content</h3>
              <p>
                All content, features, and functionality of the Service (including but not limited to text, graphics,
                logos, prompts, and software) are owned by Prompt & Pause and protected by copyright, trademark, and
                other intellectual property laws.
              </p>

              <h3 className="text-2xl font-bold mt-6">Your Content</h3>
              <p>
                You retain ownership of your reflection responses and personal data. By using the Service, you grant us
                a limited license to:
              </p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Store and process your reflections to provide the Service</li>
                <li>Use anonymized, aggregated data for service improvement and research</li>
              </ul>
              <p className="mt-4">
                We will never sell your personal reflections or use them for AI training without explicit consent.
              </p>
            </div>
          </div>

          {/* Medical Disclaimer */}
          <div id="disclaimer" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
              Medical Disclaimer
            </h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <div className="p-6 bg-red-900/20 border-2 border-red-900/50 rounded-lg">
                <p className="font-bold text-xl mb-4">IMPORTANT: READ CAREFULLY</p>
                <ul className="space-y-3 list-disc list-inside">
                  <li>
                    <strong>
                      Prompt & Pause is NOT a substitute for professional mental health care, therapy, or medical
                      advice.
                    </strong>
                  </li>
                  <li>Our Service is a self-reflection tool designed to complement, not replace, professional care.</li>
                  <li>We do not provide medical advice, diagnosis, or treatment.</li>
                  <li>
                    Our AI-generated prompts are for reflection purposes only and should not be considered therapeutic
                    interventions.
                  </li>
                  <li>
                    If you are experiencing a mental health crisis, contact emergency services or a crisis helpline
                    immediately.
                  </li>
                </ul>
              </div>

              <h3 className="text-2xl font-bold mt-6">Crisis Resources</h3>
              <div className="p-4 bg-neutral-800 rounded-lg">
                <p>
                  <strong>UK:</strong> Samaritans - 116 123 (24/7)
                </p>
                <p className="mt-2">
                  <strong>US:</strong> 988 Suicide & Crisis Lifeline - 988 (24/7)
                </p>
                <p className="mt-2">
                  <strong>Emergency:</strong> 999 (UK) or 911 (US)
                </p>
              </div>

              <p className="mt-6">
                By using Prompt & Pause, you acknowledge that you understand this is a wellness tool and not a
                replacement for professional mental health services.
              </p>
            </div>
          </div>

          {/* Limitation of Liability */}
          <div id="limitation" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase flex items-center gap-3">
              <Scale className="w-8 h-8" />
              Limitation of Liability
            </h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>The Service is provided "AS IS" and "AS AVAILABLE" without warranties of any kind</li>
                <li>We do not guarantee the Service will be uninterrupted, secure, or error-free</li>
                <li>We are not liable for any indirect, incidental, special, or consequential damages</li>
                <li>
                  Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim
                </li>
                <li>We are not responsible for third-party services (Stripe, Supabase, Groq, OpenAI, etc.)</li>
              </ul>

              <p className="mt-6 p-4 bg-neutral-800 rounded-lg">
                <strong>UK/EU Users:</strong> Nothing in these Terms excludes or limits our liability for death or
                personal injury caused by negligence, fraud, or any liability that cannot be excluded by law.
              </p>
            </div>
          </div>

          {/* Termination */}
          <div id="termination" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Termination</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <h3 className="text-2xl font-bold">By You</h3>
              <p>
                You may terminate your account at any time by contacting{" "}
                <a href="mailto:support@promptandpause.com" className="text-white underline">
                  support@promptandpause.com
                </a>{" "}
                or through your account settings.
              </p>

              <h3 className="text-2xl font-bold mt-6">By Us</h3>
              <p>We may suspend or terminate your account immediately if you:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Violate these Terms</li>
                <li>Engage in fraudulent activity</li>
                <li>Fail to pay subscription fees</li>
                <li>Pose a security risk</li>
              </ul>

              <h3 className="text-2xl font-bold mt-6">Effect of Termination</h3>
              <p>Upon termination:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Your access to the Service will cease immediately</li>
                <li>
                  Your data will be deleted according to our{" "}
                  <Link href="/privacy-policy" className="text-white underline">
                    Privacy Policy
                  </Link>
                </li>
                <li>No refunds will be provided (except as required by law)</li>
                <li>Provisions that should survive termination will remain in effect</li>
              </ul>
            </div>
          </div>

          {/* Governing Law */}
          <div id="governing-law" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Governing Law</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                These Terms are governed by the laws of England and Wales. Any disputes will be subject to the exclusive
                jurisdiction of the courts of England and Wales.
              </p>
              <p className="mt-4">
                <strong>US Users:</strong> For users in the United States, these Terms are also governed by applicable
                federal and state laws.
              </p>

              <h3 className="text-2xl font-bold mt-6">Dispute Resolution</h3>
              <p>
                We encourage you to contact us first to resolve any disputes informally. If we cannot resolve a dispute,
                you agree to attempt mediation before pursuing litigation.
              </p>
            </div>
          </div>

          {/* Changes to Terms */}
          <div id="changes" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Changes to Terms</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>We may update these Terms from time to time. We will notify you of material changes by:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Email notification to your registered email address</li>
                <li>Prominent notice on our website</li>
                <li>In-app notification</li>
              </ul>
              <p className="mt-4">
                Continued use of the Service after changes constitutes acceptance of the new Terms. If you do not agree
                to the changes, you must stop using the Service and terminate your account.
              </p>
              <p className="text-sm text-neutral-500 mt-6">Last updated: January 2026</p>
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Contact Information</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>For questions about these Terms:</p>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg mt-6">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:legal@promptandpause.com" className="text-white underline hover:text-neutral-300">
                    legal@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Support:</strong>{" "}
                  <a href="mailto:support@promptandpause.com" className="text-white underline hover:text-neutral-300">
                    support@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Website:</strong>{" "}
                  <a
                    href="https://promptandpause.com"
                    className="text-white underline hover:text-neutral-300"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    promptandpause.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-black">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase">Ready to Start Your Reflection Journey?</h2>
          <p className="text-xl text-neutral-400 mb-8">Join thousands finding clarity through daily prompts.</p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-4 bg-white text-black font-bold uppercase hover:bg-neutral-200 transition-colors duration-300"
          >
            View Pricing
          </Link>
        </div>
      </section>
    </main>
      <Footer />
    </>
  )
}



