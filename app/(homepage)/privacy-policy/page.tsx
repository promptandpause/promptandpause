"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Shield, Lock, Database, CreditCard, Server, MessageSquare, Users, Flag } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"
import { useRef } from "react"
import Link from "next/link"
import { useLenis } from "@/hooks/useLenis"

export default function PrivacyPolicyPage() {
  useLenis()
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
    { id: "social-features", title: "Social Features & Public Content" },
    { id: "content-moderation", title: "Content Moderation & Reporting" },
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
      <main className="min-h-screen bg-slate-100 text-slate-900">
      {/* Hero Section */}
      <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-100 via-slate-100 to-slate-200" />

        <motion.div style={{ opacity, scale }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-6"
          >
            <Shield className="w-16 h-16 mx-auto mb-6 text-indigo-600" />
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
            className="text-xl md:text-2xl text-slate-600 mb-8 text-balance"
          >
            Your privacy matters. Here's how we protect and handle your data.
          </motion.p>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="text-sm text-slate-500"
          >
            Last Updated: July 2026
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
                className="p-4 bg-slate-50 backdrop-blur-md rounded-lg hover:bg-slate-100 transition-all duration-300 hover:scale-105"
              >
                <span className="text-slate-500 text-sm">0{index + 1}</span>
                <h3 className="text-lg font-bold">{section.title}</h3>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <section className="py-20 px-4 bg-white">
        <div className="max-w-4xl mx-auto space-y-20">
          {/* Introduction */}
          <div id="introduction" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Introduction</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Database className="w-6 h-6" />
                  Account Information
                </h3>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
                  <li>Email address (required for account creation)</li>
                  <li>Name (optional)</li>
                  <li>Password (encrypted and stored securely via Supabase Auth)</li>
                  <li>Account preferences and settings</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <MessageSquare className="w-6 h-6" />
                  Reflection Data
                </h3>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
                  <li>Your responses to daily prompts</li>
                  <li>Self-journal entries (private, not shared with AI)</li>
                  <li>Optional check-in information (if you choose to use it)</li>
                  <li>Custom focus areas and preferences</li>
                  <li>Reflection history</li>
                  <li>Timestamps of interactions</li>
                  <li>Delivery preferences (email, Slack)</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Users className="w-6 h-6" />
                  Social & Community Data
                </h3>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
                  <li>Profile information you choose to add (display name, username, bio, avatar, cover photo, theme preferences)</li>
                  <li>Reflections you mark as "Public" or "Friends Only," and who can see them based on that setting</li>
                  <li>Likes, comments, and whiteboard messages you post or receive</li>
                  <li>Follow and friend connections between accounts</li>
                  <li>Users you block, and users who block you</li>
                  <li>Reports you submit about other users' content, and reports submitted about your content</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <CreditCard className="w-6 h-6" />
                  Payment Information
                </h3>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
                  <li>Payment details (processed and stored by Stripe, not by us)</li>
                  <li>Billing address</li>
                  <li>Transaction history</li>
                </ul>
              </div>

              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg">
                <h3 className="text-2xl font-bold mb-4 flex items-center gap-3">
                  <Server className="w-6 h-6" />
                  Technical Data
                </h3>
                <ul className="space-y-2 text-slate-600 list-disc list-inside">
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
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
              <p className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-lg">
                <strong>Legal Basis (GDPR):</strong> We process your data based on (1) your consent, (2) contractual
                necessity, (3) legitimate interests, and (4) legal obligations.
              </p>
            </div>
          </div>

          {/* Social Features & Public Content */}
          <div id="social-features" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase flex items-center gap-3">
              <Users className="w-8 h-8" />
              Social Features & Public Content
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Prompt & Pause includes optional social features: a public community feed, following other users,
                friends-only sharing, comments, likes, and a profile whiteboard. These features are entirely opt-in --
                by default, your reflections are private and visible only to you.
              </p>
              <p>
                <strong>You control visibility per-reflection.</strong> Each reflection you write can be set to
                Private (only you), Friends Only (accepted friend connections), or Public (visible to any signed-in
                user, including in the community "For You" feed). Changing a reflection's visibility takes effect
                immediately, but we cannot guarantee removal from another user's device cache or from anyone who
                already viewed or screenshotted it before you changed the setting.
              </p>
              <p>
                <strong>Your profile.</strong> If you set your profile to public, your display name, username,
                avatar, bio, and any reflections you've marked Public or Friends Only (to the relevant audience) are
                visible to other users of the service. Your profile is not indexed for public web search by us, but
                we cannot control third-party search engines or archival services.
              </p>
              <p>
                <strong>Comments and likes.</strong> When you comment on or like another user's public or
                friends-only reflection, your name, profile, and the content of your comment are visible to that
                user and, depending on the reflection's visibility, to other users who can see that reflection.
                Reflection owners can remove comments from their own reflections; you can always delete your own
                comments.
              </p>
              <p>
                <strong>Blocking.</strong> If you block another user, neither of you will see the other's public
                content, comments, or likes, and any existing follow or friend connection between you is
                automatically removed. Blocking does not delete content that already existed before the block, and
                does not notify the blocked user.
              </p>
            </div>
          </div>

          {/* Content Moderation & Reporting */}
          <div id="content-moderation" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase flex items-center gap-3">
              <Flag className="w-8 h-8" />
              Content Moderation & Reporting
            </h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Users can report reflections, comments, or other users for reasons including spam, harassment,
                hate speech, inappropriate content, or content indicating risk of self-harm. When you submit a
                report, we collect the reported content, your account identifier as the reporter, the reason
                selected, and any additional details you provide.
              </p>
              <p>
                Reports are reviewed by our moderation team. We may remove reported content, restrict an account,
                or take no action if a report does not violate our guidelines. We do not disclose the identity of
                the reporter to the reported user.
              </p>
              <p className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
                <strong>Self-harm and safety reports:</strong> If a report indicates a user may be at risk of
                self-harm, we prioritize that report for review. Prompt & Pause is not a crisis service; if you or
                someone else is in immediate danger, contact local emergency services. Our in-app{" "}
                <Link href="/crisis-resources" className="text-indigo-600 underline hover:text-slate-900">
                  Crisis Resources
                </Link>{" "}
                page lists further support options.
              </p>
            </div>
          </div>

          {/* Third-Party Services */}
          <div id="third-party" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Third-Party Services</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>We use the following third-party services to operate Prompt & Pause:</p>

              <div className="grid md:grid-cols-2 gap-4 mt-6">
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Supabase</h4>
                  <p className="text-sm text-slate-500">
                    Database hosting and authentication. Data stored in EU/UK regions.
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Groq API</h4>
                  <p className="text-sm text-slate-500">
                    Primary AI processing for prompt generation. Data not used for training.
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">OpenAI API</h4>
                  <p className="text-sm text-slate-500">
                    Secondary AI processing. Data not used for training (zero retention policy).
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Resend</h4>
                  <p className="text-sm text-slate-500">Email delivery service for prompts and notifications.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Stripe</h4>
                  <p className="text-sm text-slate-500">Payment processing. We do not store your payment details.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Vercel</h4>
                  <p className="text-sm text-slate-500">Hosting and infrastructure. Data stored in EU/US regions.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Slack</h4>
                  <p className="text-sm text-slate-500">
                    Optional integration for prompt delivery to your workspace.
                  </p>
                </div>
              </div>

              <p className="mt-6 p-4 bg-slate-100 border border-slate-200 rounded-lg">
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
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>Under GDPR, you have the following rights:</p>

              <div className="grid gap-4 mt-6">
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Access</h4>
                  <p className="text-sm text-slate-500">Request a copy of all personal data we hold about you.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Rectification</h4>
                  <p className="text-sm text-slate-500">Request correction of inaccurate or incomplete data.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Erasure ("Right to be Forgotten")</h4>
                  <p className="text-sm text-slate-500">
                    Request deletion of your personal data (subject to legal obligations).
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Restrict Processing</h4>
                  <p className="text-sm text-slate-500">Request limitation of how we process your data.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Data Portability</h4>
                  <p className="text-sm text-slate-500">Receive your data in a machine-readable format.</p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Object</h4>
                  <p className="text-sm text-slate-500">
                    Object to processing based on legitimate interests or direct marketing.
                  </p>
                </div>
                <div className="p-4 bg-white border border-slate-200 rounded-lg">
                  <h4 className="font-bold mb-2">Right to Withdraw Consent</h4>
                  <p className="text-sm text-slate-500">
                    Withdraw consent at any time (where processing is based on consent).
                  </p>
                </div>
              </div>

              <p className="mt-6">
                To exercise any of these rights, contact us at{" "}
                <a href="mailto:privacy@promptandpause.com" className="text-indigo-600 underline hover:text-slate-900">
                  privacy@promptandpause.com
                </a>
                . We will respond within 30 days.
              </p>

              <p className="p-4 bg-slate-100 border border-slate-200 rounded-lg">
                <strong>Right to Complain:</strong> You have the right to lodge a complaint with the UK Information
                Commissioner's Office (ICO) or your local data protection authority.
              </p>
            </div>
          </div>

          {/* Cookies */}
          <div id="cookies" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Cookies & Tracking</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                We use cookies and similar tracking technologies to improve your experience. See our{" "}
                <Link href="/cookie-policy" className="text-indigo-600 underline hover:text-slate-900">
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
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
                <li>
                  <strong>Public/Friends-Only Reflections, Comments, Likes, Whiteboard Entries:</strong> Retained
                  while the content or your account exists, or until you delete the specific item or change its
                  visibility. Deleting your account removes this content going forward, subject to our backup
                  retention above.
                </li>
                <li>
                  <strong>Content Reports:</strong> Retained for as long as necessary for moderation, safety, and
                  legal purposes, typically up to 2 years after resolution.
                </li>
              </ul>
            </div>
          </div>

          {/* International Transfers */}
          <div id="international" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">International Transfers</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
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
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                Prompt & Pause is not intended for children under 16 (UK/EU) or 13 (US). We do not knowingly collect
                data from children. If you believe we have collected data from a child, contact us immediately at{" "}
                <a href="mailto:privacy@promptandpause.com" className="text-indigo-600 underline hover:text-slate-900">
                  privacy@promptandpause.com
                </a>
                .
              </p>
            </div>
          </div>

          {/* Changes */}
          <div id="changes" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Changes to This Policy</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>
                We may update this Privacy Policy from time to time. We will notify you of material changes via email or
                prominent notice on our website. Continued use after changes constitutes acceptance.
              </p>
              <p className="text-sm text-slate-500">Last updated: January 2026</p>
            </div>
          </div>

          {/* Contact */}
          <div id="contact" className="scroll-mt-20">
            <h2 className="text-4xl font-bold mb-6 uppercase">Contact Us</h2>
            <div className="space-y-4 text-slate-600 leading-relaxed">
              <p>For privacy-related questions or to exercise your rights:</p>
              <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg mt-6">
                <p>
                  <strong>Email:</strong>{" "}
                  <a href="mailto:privacy@promptandpause.com" className="text-indigo-600 underline hover:text-slate-900">
                    privacy@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>Data Protection Officer:</strong>{" "}
                  <a href="mailto:dpo@promptandpause.com" className="text-indigo-600 underline hover:text-slate-900">
                    dpo@promptandpause.com
                  </a>
                </p>
                <p className="mt-2">
                  <strong>General Inquiries:</strong>{" "}
                  <a href="mailto:support@promptandpause.com" className="text-indigo-600 underline hover:text-slate-900">
                    support@promptandpause.com
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-slate-200">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase text-slate-900">Questions About Your Privacy?</h2>
          <p className="text-xl text-slate-600 mb-8">We're here to help. Reach out anytime.</p>
          <Link
            href="/contact"
            className="inline-block px-8 py-4 bg-white text-slate-900 font-bold uppercase hover:bg-slate-100 transition-colors duration-300"
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



