"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Shield, Lock, Database, CreditCard, Server, MessageSquare } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"
import { useRef } from "react"
import Link from "next/link"

export default function PrivacyPolicyPage() {
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  })

  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.8])

  const sections = [
    { id: "introduction", title: "Introduction" },
    { id: "data-collection", title: "Data We Collect" },
    { id: "how-we-use", title: "How We Use Your Data" },
    { id: "third-party", title: "Third-Party Services" },
    { id: "data-security", title: "Data Security" },
    { id: "your-rights", title: "Your Rights (GDPR)" },
    { id: "cookies", title: "Cookies & Tracking" },
    { id: "data-retention", title: "Data Retention" },
    { id: "international", title: "International Transfers" },
    { id: "children", title: "Children's Privacy" },
    { id: "changes", title: "Changes to This Policy" },
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
            <Shield className="w-16 h-16 mx-auto mb-6 text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold mb-6 uppercase tracking-tight text-balance"
          >
            Privacy Policy
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-xl md:text-2xl text-neutral-400 mb-8 text-balance"
          >
            Your privacy matters. Here's how we protect and handle your data.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm text-neutral-500"
          >
            Last Updated: January 2026
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
          {/* Introduction */}
          <div id="introduction" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Introduction</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                Prompt & Pause ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use our mental health
                reflection service.
              </p>
              <p>
                We operate in compliance with the UK General Data Protection Regulation (UK GDPR), the EU GDPR, 
                the UK Data Protection Act 2018, and applicable US privacy laws including the California Consumer Privacy Act (CCPA), 
                Colorado Privacy Act (CPRA), Virginia Consumer Data Protection Act (VCDPA), and other state regulations.
              </p>
              <p>
                <strong>Data Controller:</strong> Prompt & Pause, registered in the United Kingdom.
              </p>
            </div>
          </div>

          {/* Data Collection */}
          <div id="data-collection" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Data We Collect</h2>
            <div className="space-y-6">
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Database className="w-6 h-6" />
                  Account Information
                </h3>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>Email address (required for account creation)</li>
                  <li>Name (optional)</li>
                  <li>Password (encrypted and stored securely via Supabase Auth)</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  Reflection Data
                </h3>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>Your responses to daily prompts</li>
                  <li>Self-journal entries (private, not shared with AI)</li>
                  <li>Optional check-in information (if you choose to use it)</li>
                  <li>Custom focus areas and preferences</li>
                  <li>Reflection history</li>
                  <li>Timestamps of interactions</li>
                  <li>Delivery preferences (email, Slack)</li>
                </ul>
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  Payment Information
                </h3>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>Payment details (processed and stored by Stripe, not by us)</li>
                  <li>Billing address</li>
                  <li>Transaction history</li>
                </ul>
              </div>

              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Server className="w-6 h-6" />
                  Technical Data
                </h3>
                <ul className="space-y-2 text-neutral-300 list-disc list-inside">
                  <li>IP address</li>
                  <li>Browser type and version</li>
                  <li>Device information</li>
                  <li>Usage data and analytics</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </div>
            </div>
          </div>

          {/* How We Use Data */}
          <div id="how-we-use" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">How We Use Your Data</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>We use your personal data for the following purposes:</p>
              <ul className="space-y-3 list-disc list-inside ml-4">
                <li>
                  <strong>Service Delivery:</strong> To provide daily mental health prompts and reflection tools
                </li>
                <li>
                  <strong>AI Processing:</strong> To generate personalized prompts using multiple AI providers (OpenAI, Anthropic, Groq, etc.). 
                  Your reflection data is processed for personalization only and is NOT used to train AI models.
                </li>
                <li>
                  <strong>Communication:</strong> To send prompts via email (Resend) or Slack
                </li>
                <li>
                  <strong>Account Management:</strong> To manage your account, authentication, and preferences
                </li>
                <li>
                  <strong>Payment Processing:</strong> To process subscriptions via Stripe
                </li>
                <li>
                  <strong>Service Improvement:</strong> To analyze usage patterns and improve our service
                </li>
                <li>
                  <strong>Legal Compliance:</strong> To comply with legal obligations and protect our rights
                </li>
                <li>
                  <strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents
                </li>
              </ul>
              <p className="mt-6 p-4 bg-neutral-800 rounded-lg">
                <strong>Legal Basis (GDPR):</strong> We process your data based on (1) your consent, (2) contractual
                necessity, (3) legitimate interests, and (4) legal obligations.
              </p>
            </div>
          </div>

          {/* Third-Party Services */}
          <div id="third-party" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Third-Party Services</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>We use the following third-party services to operate Prompt & Pause:</p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Supabase</h4>
                  <p className="text-sm text-neutral-400">
                    Database hosting and authentication. Data stored in EU/UK regions.
                  </p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Groq API</h4>
                  <p className="text-sm text-neutral-400">
                    Primary AI processing for prompt generation. Data not used for training.
                  </p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">OpenAI API</h4>
                  <p className="text-sm text-neutral-400">
                    Secondary AI processing. Data not used for training (zero retention policy).
                  </p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Resend</h4>
                  <p className="text-sm text-neutral-400">Email delivery service for prompts and notifications.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Stripe</h4>
                  <p className="text-sm text-neutral-400">Payment processing. We do not store your payment details.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Vercel</h4>
                  <p className="text-sm text-neutral-400">Hosting and infrastructure. Data stored in EU/US regions.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Slack</h4>
                  <p className="text-sm text-neutral-400">
                    Optional integration for prompt delivery to your workspace.
                  </p>
                </div>
              </div>

              <p className="mt-6 p-4 bg-neutral-800 rounded-lg">
                All third-party services are carefully selected and comply with GDPR requirements. We have Data
                Processing Agreements (DPAs) in place where required.
              </p>
            </div>
          </div>

          {/* Data Security */}
          <div id="data-security" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase flex items-center gap-3">
              <Lock className="w-8 h-8" />
              Data Security
            </h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>We implement industry-standard security measures to protect your data:</p>
              <ul className="space-y-3 list-disc list-inside ml-4">
                <li>
                  <strong>Encryption:</strong> All data is encrypted in transit (TLS/SSL) and at rest
                </li>
                <li>
                  <strong>Authentication:</strong> Secure authentication via Supabase with password hashing
                </li>
                <li>
                  <strong>Access Controls:</strong> Strict access controls and role-based permissions
                </li>
                <li>
                  <strong>Regular Audits:</strong> Security audits and vulnerability assessments
                </li>
                <li>
                  <strong>Monitoring:</strong> 24/7 monitoring for suspicious activity
                </li>
                <li>
                  <strong>Backups:</strong> Regular encrypted backups with disaster recovery plans
                </li>
              </ul>
              <p className="mt-6 p-4 bg-red-900/20 border border-red-900/50 rounded-lg">
                <strong>Important:</strong> While we implement robust security measures, no system is 100% secure. We
                cannot guarantee absolute security of your data.
              </p>
            </div>
          </div>

          {/* Your Rights (GDPR) */}
          <div id="your-rights" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Your Rights (GDPR)</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>Under GDPR, you have the following rights:</p>

              <div className="grid gap-4 mt-6">
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Access</h4>
                  <p className="text-sm text-neutral-400">Request a copy of all personal data we hold about you.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Rectification</h4>
                  <p className="text-sm text-neutral-400">Request correction of inaccurate or incomplete data.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Erasure ("Right to be Forgotten")</h4>
                  <p className="text-sm text-neutral-400">
                    Request deletion of your personal data (subject to legal obligations).
                  </p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Restrict Processing</h4>
                  <p className="text-sm text-neutral-400">Request limitation of how we process your data.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Data Portability</h4>
                  <p className="text-sm text-neutral-400">Receive your data in a machine-readable format.</p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Object</h4>
                  <p className="text-sm text-neutral-400">
                    Object to processing based on legitimate interests or direct marketing.
                  </p>
                </div>
                <div className="p-4 bg-white/5 backdrop-blur-md rounded-lg">
                  <h4 className="font-bold mb-2">Right to Withdraw Consent</h4>
                  <p className="text-sm text-neutral-400">
                    Withdraw consent at any time (where processing is based on consent).
                  </p>
                </div>
              </div>

              <p className="mt-6">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@promptandpause.com" className="text-white underline hover:text-neutral-300">
                  privacy@promptandpause.com
                </a>
                . We will respond within 30 days.
              </p>

              <p className="p-4 bg-neutral-800 rounded-lg">
                <strong>Right to Complain:</strong> You have the right to lodge a complaint with the UK Information
                Commissioner's Office (ICO) or your local data protection authority.
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div id="cookies" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Cookies & Tracking</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                We use cookies and similar tracking technologies to improve your experience. See our{" "}
                <Link href="/cookie-policy" className="text-white underline hover:text-neutral-300">
                  Cookie Policy
                </Link>{" "}
                for detailed information.
              </p>
              <p>
                You can control cookies through your browser settings. Note that disabling cookies may affect
                functionality.
              </p>
            </div>
          </div>

          {/* Data Retention */}
          <div id="data-retention" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Data Retention</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <ul className="space-y-3 list-disc list-inside ml-4">
                <li>
                  <strong>Account Data:</strong> Retained while your account is active, plus 30 days after deletion
                </li>
                <li>
                  <strong>Reflection Data:</strong> Retained while your account is active, deleted upon account deletion
                </li>
                <li>
                  <strong>Payment Data:</strong> Retained for 7 years for tax and legal compliance
                </li>
                <li>
                  <strong>Analytics Data:</strong> Anonymized and retained for up to 2 years
                </li>
                <li>
                  <strong>Backup Data:</strong> Retained for 90 days in encrypted backups
                </li>
              </ul>
            </div>
          </div>

          {/* International Transfers */}
          <div id="international" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">International Transfers</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                Your data may be transferred to and processed in countries outside the UK/EU, including the United
                States (Vercel, OpenAI, Groq).
              </p>
              <p>We ensure adequate protection through:</p>
              <ul className="space-y-2 list-disc list-inside ml-4">
                <li>Standard Contractual Clauses (SCCs) approved by the EU Commission</li>
                <li>Data Processing Agreements with all third-party processors</li>
                <li>Adequacy decisions where applicable</li>
              </ul>
            </div>
          </div>

          {/* Children's Privacy */}
          <div id="children" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Children's Privacy</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                Prompt & Pause is not intended for children under 16 (UK/EU) or 13 (US). We do not knowingly collect
                data from children. If you believe we have collected data from a child, contact us immediately at{" "}
                <a href="mailto:privacy@promptandpause.com" className="text-white underline">
                  privacy@promptandpause.com
                </a>
                .
              </p>
            </div>
          </div>

          {/* Changes */}
          <div id="changes" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Changes to This Policy</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or
                prominent notice on our website. Continued use after changes constitutes acceptance.
              </p>
              <p className="text-sm text-neutral-500">Last updated: January 2026</p>
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Contact Us</h2>
            <div className="space-y-4 text-neutral-300 leading-relaxed">
              <p>For privacy-related questions or to exercise your rights:</p>
              <div className="p-6 bg-white/5 backdrop-blur-md rounded-lg mt-6">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@promptandpause.com" className="text-white underline hover:text-neutral-300">
                    privacy@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Data Protection Officer:</strong>{" "}
                  <a href="mailto:dpo@promptandpause.com" className="text-white underline hover:text-neutral-300">
                    dpo@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>General Inquiries:</strong>{" "}
                  <a href="mailto:support@promptandpause.com" className="text-white underline hover:text-neutral-300">
                    support@promptandpause.com
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
          <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase">Questions About Your Privacy?</h2>
          <p className="text-xl text-neutral-400 mb-8">We're here to help. Reach out anytime.</p>
          <Link
            href="/contact"
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



