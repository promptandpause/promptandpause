"use client"

import { motion, useScroll, useTransform } from "framer-motion"
import { Shield, Lock, Search, CheckCircle, AlertTriangle, Eye, FileText, RefreshCw, Server, ShieldCheck } from "lucide-react"
import Navigation from "../Navigation"
import Footer from "../footer"
import { useRef } from "react"
import Link from "next/link"
import { useLenis } from "@/hooks/useLenis"

const testingAreas = [
  { icon: Lock, label: "Authentication & Session Management", description: "Login flows, session tokens, password reset, MFA bypass attempts" },
  { icon: Search, label: "Injection Attacks", description: "SQL injection, XSS, CSRF, CSV injection, command injection" },
  { icon: Server, label: "API Security", description: "Rate limiting, authentication headers, endpoint enumeration, IDOR" },
  { icon: Eye, label: "Access Controls", description: "Horizontal & vertical privilege escalation, RLS policy validation" },
  { icon: FileText, label: "Data Exposure", description: "Sensitive data in responses, error messages, logs, and headers" },
  { icon: RefreshCw, label: "Business Logic", description: "Subscription bypass, gifted subscription abuse, tier enforcement" },
]

const findings = [
  { severity: "Critical", count: 0, color: "text-red-500", bg: "bg-red-500/10 border-red-500/20" },
  { severity: "High", count: 0, color: "text-orange-500", bg: "bg-orange-500/10 border-orange-500/20" },
  { severity: "Medium", count: 2, color: "text-yellow-600", bg: "bg-yellow-500/10 border-yellow-500/20" },
  { severity: "Low / Informational", count: 4, color: "text-blue-500", bg: "bg-blue-500/10 border-blue-500/20" },
]

const remediations = [
  { item: "Content Security Policy (CSP) hardened", status: "resolved" },
  { item: "Security response headers (HSTS, X-Frame-Options, etc.)", status: "resolved" },
  { item: "Rate limiting on all authentication endpoints", status: "resolved" },
  { item: "CSV injection sanitisation in data exports", status: "resolved" },
  { item: "Admin OTP brute-force protection", status: "resolved" },
  { item: "JWT verification optimised (fast-path claims)", status: "resolved" },
]

export default function SecurityPage() {
  useLenis()
  const heroRef = useRef(null)
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] })
  const opacity = useTransform(scrollYProgress, [0, 1], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 1], [1, 0.85])

  return (
    <>
      <Navigation />
      <main className="min-h-screen bg-[#F0EDE6] text-[#2F3B34]">

        {/* Hero */}
        <section ref={heroRef} className="relative h-screen flex items-center justify-center overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[#F0EDE6] via-[#E8EAE6] to-[#DCE6D9]" />
          <motion.div style={{ opacity, scale }} className="relative z-10 text-center px-4 max-w-4xl mx-auto">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="mb-6">
              <ShieldCheck className="w-16 h-16 mx-auto mb-6 text-[#6FA984]" />
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }}
              className="text-6xl md:text-8xl font-bold mb-6 uppercase tracking-tight text-balance"
            >
              Security
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.4 }}
              className="text-xl md:text-2xl text-[#4A5A49] mb-8 text-balance max-w-2xl mx-auto"
            >
              We take the security of your mental health data seriously. Here's exactly what we do to protect it.
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.6 }}
              className="text-sm text-[#6B7F6E]"
            >
              Last reviewed: February 2026
            </motion.p>
          </motion.div>
        </section>

        {/* Pentest Providers */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-bold mb-4 uppercase">Penetration Testing</h2>
              <p className="text-lg text-[#4A5A49] max-w-2xl mx-auto">
                Prompt &amp; Pause undergoes regular independent penetration testing by specialist security firms. We publish our testing programme and remediation status openly.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 gap-6 mb-16">
              {/* Akido */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} viewport={{ once: true }}
                className="p-8 bg-[#F5F3EE] border border-[#DCE6D9] rounded-2xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2F3B34] flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-[#6FA984]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">Akido Security</h3>
                    <p className="text-sm text-[#6B7F6E] mt-1">Automated + manual penetration testing</p>
                  </div>
                </div>
                <p className="text-[#4A5A49] leading-relaxed mb-4">
                  Akido provides continuous automated security scanning combined with expert-led manual penetration testing. Their platform covers OWASP Top 10, API security, and business logic vulnerabilities.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["OWASP Top 10", "API Testing", "Auth Flows", "Continuous Scanning"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-[#DCE6D9] text-[#2F3B34] rounded-full">{tag}</span>
                  ))}
                </div>
              </motion.div>

              {/* HostedScan */}
              <motion.div
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} viewport={{ once: true }}
                className="p-8 bg-[#F5F3EE] border border-[#DCE6D9] rounded-2xl"
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-[#2F3B34] flex items-center justify-center flex-shrink-0">
                    <Search className="w-6 h-6 text-[#6FA984]" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold">HostedScan</h3>
                    <p className="text-sm text-[#6B7F6E] mt-1">Vulnerability scanning &amp; monitoring</p>
                  </div>
                </div>
                <p className="text-[#4A5A49] leading-relaxed mb-4">
                  HostedScan runs scheduled vulnerability scans across our infrastructure, network, and web application layers. Results are reviewed and triaged by our team on every scan cycle.
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Network Scanning", "CVE Detection", "SSL/TLS Checks", "Scheduled Scans"].map(tag => (
                    <span key={tag} className="px-2.5 py-1 text-xs font-medium bg-[#DCE6D9] text-[#2F3B34] rounded-full">{tag}</span>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Testing cadence */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
              className="p-6 bg-[#DCE6D9] border border-[#C5D9C8] rounded-2xl text-center"
            >
              <p className="text-[#2F3B34] font-medium">
                Testing cadence: <strong>continuous automated scanning</strong> + <strong>manual penetration tests on every major release</strong> and at minimum quarterly.
              </p>
            </motion.div>
          </div>
        </section>

        {/* What We Test */}
        <section className="py-24 px-4 bg-[#F0EDE6]">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="text-4xl font-bold mb-12 uppercase"
            >
              What We Test
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-4">
              {testingAreas.map((area, index) => (
                <motion.div
                  key={area.label}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.07 }} viewport={{ once: true }}
                  className="p-5 bg-white border border-[#DCE6D9] rounded-xl flex gap-4"
                >
                  <div className="w-10 h-10 rounded-lg bg-[#DCE6D9] flex items-center justify-center flex-shrink-0">
                    <area.icon className="w-5 h-5 text-[#2F3B34]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-[#2F3B34] mb-1">{area.label}</h3>
                    <p className="text-sm text-[#6B7F6E]">{area.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Most Recent Findings */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="mb-12"
            >
              <h2 className="text-4xl font-bold mb-4 uppercase">Most Recent Assessment</h2>
              <p className="text-[#4A5A49]">February 2026 — Full application penetration test. All findings remediated or accepted with documented rationale.</p>
            </motion.div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
              {findings.map((f, index) => (
                <motion.div
                  key={f.severity}
                  initial={{ opacity: 0, scale: 0.95 }} whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4, delay: index * 0.08 }} viewport={{ once: true }}
                  className={`p-5 rounded-xl border text-center ${f.bg}`}
                >
                  <div className={`text-4xl font-bold mb-1 ${f.color}`}>{f.count}</div>
                  <div className="text-sm font-medium text-[#2F3B34]">{f.severity}</div>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
              className="p-6 bg-[#F5F3EE] border border-[#DCE6D9] rounded-2xl mb-8"
            >
              <h3 className="text-xl font-bold mb-5 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-[#6FA984]" />
                Remediation Status
              </h3>
              <div className="space-y-3">
                {remediations.map((r, index) => (
                  <motion.div
                    key={r.item}
                    initial={{ opacity: 0, x: -10 }} whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.06 }} viewport={{ once: true }}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="w-4 h-4 text-[#6FA984] flex-shrink-0" />
                    <span className="text-[#4A5A49] text-sm">{r.item}</span>
                    <span className="ml-auto text-xs font-medium text-[#6FA984] bg-[#DCE6D9] px-2 py-0.5 rounded-full">Resolved</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} viewport={{ once: true }}
              className="p-5 bg-amber-50 border border-amber-200 rounded-xl flex gap-3"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                <strong>Responsible Disclosure:</strong> We do not publish full pentest reports publicly to avoid providing a roadmap for attackers. Summaries like this page are our commitment to transparency without compromising security.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Our Security Practices */}
        <section className="py-24 px-4 bg-[#F0EDE6]">
          <div className="max-w-4xl mx-auto">
            <motion.h2
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
              className="text-4xl font-bold mb-12 uppercase"
            >
              Our Security Practices
            </motion.h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[
                { title: "Encryption at Rest & in Transit", body: "All data is encrypted using AES-256 at rest and TLS 1.2+ in transit. Reflection text is additionally encrypted at the application layer before storage." },
                { title: "Row-Level Security (RLS)", body: "Supabase RLS policies ensure users can only access their own data. Every table has enforced policies — no shared data access is possible at the database level." },
                { title: "Zero Data Training Policy", body: "Your reflection data is never used to train AI models. We have zero-retention agreements with all AI providers (OpenAI, Groq, Anthropic)." },
                { title: "Dependency Scanning", body: "Automated dependency vulnerability scanning runs on every commit via GitHub Actions. Critical CVEs trigger immediate patching workflows." },
                { title: "Least Privilege Access", body: "Internal team access follows least-privilege principles. Production database access is restricted, logged, and requires MFA." },
                { title: "Incident Response", body: "We have a documented incident response plan. In the event of a breach, affected users will be notified within 72 hours per GDPR Article 33 requirements." },
              ].map((item, index) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.07 }} viewport={{ once: true }}
                  className="p-6 bg-white border border-[#DCE6D9] rounded-xl"
                >
                  <h3 className="font-bold text-lg mb-2 text-[#2F3B34]">{item.title}</h3>
                  <p className="text-sm text-[#6B7F6E] leading-relaxed">{item.body}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Responsible Disclosure / Bug Bounty */}
        <section className="py-24 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} viewport={{ once: true }}
            >
              <h2 className="text-4xl font-bold mb-6 uppercase">Responsible Disclosure</h2>
              <p className="text-[#4A5A49] leading-relaxed mb-8">
                If you discover a security vulnerability in Prompt &amp; Pause, we ask that you report it to us privately before public disclosure. We commit to acknowledging your report within 48 hours and providing a remediation timeline within 7 days.
              </p>
              <div className="p-6 bg-[#F5F3EE] border border-[#DCE6D9] rounded-2xl space-y-3">
                <p className="font-bold text-[#2F3B34]">Report a vulnerability:</p>
                <p className="text-[#4A5A49]">
                  Email:{" "}
                  <a href="mailto:security@promptandpause.com" className="text-[#6FA984] underline hover:text-[#2F3B34]">
                    security@promptandpause.com
                  </a>
                </p>
                <p className="text-sm text-[#6B7F6E]">
                  Please include: affected URL or endpoint, steps to reproduce, potential impact, and your contact details. We do not pursue legal action against good-faith security researchers.
                </p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-[#DCE6D9]">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 uppercase text-[#2F3B34]">Questions About Security?</h2>
            <p className="text-xl text-[#4A5A49] mb-8">We're transparent about how we protect your data. Reach out anytime.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block px-8 py-4 bg-[#2F3B34] text-white font-bold uppercase hover:bg-[#4A5A49] transition-colors duration-300 rounded"
              >
                Contact Us
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-block px-8 py-4 bg-white text-[#2F3B34] font-bold uppercase hover:bg-[#F0EDE6] transition-colors duration-300 rounded"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </>
  )
}
