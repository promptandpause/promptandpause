"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { getSupabaseClient } from "@/lib/supabase/client"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import {
  faArrowRight,
  faChevronDown,
  faCircleCheck,
  faCircleQuestion,
  faClock,
  faEnvelope,
  faLifeRing,
} from "@fortawesome/free-solid-svg-icons"

function getBrowserName(ua: string): string {
  if (ua.includes('Edg/')) return 'Edge'
  if (ua.includes('Chrome/')) return 'Chrome'
  if (ua.includes('Firefox/')) return 'Firefox'
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari'
  return 'Your browser'
}

export default function SupportPage() {
  return (
    <AuthGuard redirectPath="/dashboard/support">
      <SupportContent />
    </AuthGuard>
  )
}

function SupportContent() {
  const { theme } = useTheme()
  const isDark = theme === "dark"

  const [view, setView] = useState<"form" | "success" | "error">("form")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [createdTicket, setCreatedTicket] = useState<any>(null)
  const [form, setForm] = useState({
    ticket_title: "",
    description_text: "",
    priority_level: "medium" as "low" | "medium" | "high" | "urgent",
  })
  const [userId, setUserId] = useState<string | null>(null)
  const [browser, setBrowser] = useState("")

  useEffect(() => {
    setBrowser(getBrowserName(navigator.userAgent))
    getSupabaseClient().auth.getUser().then(({ data }) => {
      if (data.user) setUserId(data.user.id)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMessage("")

    try {
      const res = await fetch("/api/support/tickets/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok || !data.success) {
        const detail = data.details?.fieldErrors ? Object.entries(data.details.fieldErrors).map(([k, v]) => `${k}: ${(v as string[]).join(', ')}`).join('; ') : ''
        throw new Error(data.error + (detail ? ` — ${detail}` : ''))
      }

      setCreatedTicket(data.ticket)
      setView("success")
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong")
      setView("error")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setView("form")
    setForm({ ticket_title: "", description_text: "", priority_level: "medium" })
    setCreatedTicket(null)
    setErrorMessage("")
  }

  const cardClass = isDark
    ? 'bg-white/[0.04] border border-white/[0.06]'
    : 'bg-white/70 backdrop-blur-[12px] border border-slate-100 shadow-soft-card'

  const inputClass = `w-full px-4 py-3 rounded-xl border font-medium outline-none transition-all ${
    isDark
      ? 'bg-white/5 border-white/10 text-white placeholder:text-white/40 focus:border-indigo-400/60 focus:ring-2 focus:ring-indigo-400/20'
      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20'
  }`

  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-white/80' : 'text-slate-700'}`

  return (
    <div className={`min-h-screen ${isDark ? "bg-[#0A0E18]" : "bg-[#F9FBFB]"}`}>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />

        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1000px] mx-auto px-4 md:px-8 pt-16 md:pt-10 pb-10">
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 260, damping: 22 }}
              className="mb-10"
            >
              <div className="flex items-center gap-3 mb-2">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                  <FontAwesomeIcon icon={faLifeRing} className="text-xl" />
                </div>
                <h1 className={`text-3xl lg:text-4xl font-extrabold tracking-tight ${isDark ? "text-white" : "text-slate-900"}`}>Support</h1>
              </div>
              <p className={`font-medium ${isDark ? "text-white/40" : "text-slate-500"}`}>Need help? We're here for you.</p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              {/* Left: Quick Help */}
              <div className="space-y-8">
                <div className="space-y-3">
                  <h2 className={`text-lg font-bold ${isDark ? "text-white" : "text-slate-900"}`}>Quick Help</h2>
                  <p className={`text-sm leading-relaxed ${isDark ? "text-white/50" : "text-slate-500"}`}>
                    Check our knowledge base or reach out directly if you can't find what you're looking for.
                  </p>
                </div>

                <div className="space-y-4">
                  <a
                    href="mailto:support@promptandpause.com"
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${cardClass} ${isDark ? 'hover:border-white/20' : 'hover:border-slate-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                      <FontAwesomeIcon icon={faEnvelope} className="text-lg" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>Email Support</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-slate-500"}`}>support@promptandpause.com</p>
                    </div>
                  </a>

                  <a
                    href="https://github.com/promptandpause/promptandpause#readme"
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-start gap-4 p-4 rounded-2xl transition-all ${cardClass} ${isDark ? 'hover:border-white/20' : 'hover:border-slate-200'}`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-50 text-purple-600'}`}>
                      <FontAwesomeIcon icon={faCircleQuestion} className="text-lg" />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isDark ? "text-white" : "text-slate-900"}`}>FAQ Center</p>
                      <p className={`text-xs mt-0.5 ${isDark ? "text-white/40" : "text-slate-500"}`}>Visit documentation</p>
                    </div>
                  </a>
                </div>

                {/* Pro Tip */}
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-gradient-to-br from-[#1B2436] to-[#0A0E18] border border-white/10' : 'bg-slate-900 shadow-soft-card'}`}>
                  <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">Pro Tip</p>
                  <p className="text-sm leading-relaxed text-white/80">
                    Including your <span className="text-white font-semibold">User ID</span> and <span className="text-white font-semibold">Browser Version</span> helps us resolve tickets 30% faster.
                  </p>
                  {(userId || browser) && (
                    <div className="mt-4 pt-4 border-t border-white/10 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">User ID</span>
                        <span className="font-mono text-white/90 truncate">{userId ? `${userId.slice(0, 6)}…${userId.slice(-4)}` : '—'}</span>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-400">Browser</span>
                        <span className="font-medium text-white/90">{browser || '—'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Right: Ticket form / success / error */}
              <div className="md:col-span-2">
                {view === "form" && (
                  <motion.form
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onSubmit={handleSubmit}
                    className={`rounded-[32px] p-6 md:p-10 space-y-6 ${cardClass}`}
                  >
                    <div className="mb-2">
                      <h3 className={`text-xl md:text-2xl font-extrabold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Submit a Ticket</h3>
                      <p className={`text-sm ${isDark ? "text-white/40" : "text-slate-500"}`}>We typically respond within 24 hours.</p>
                    </div>

                    <div>
                      <label className={labelClass}>Subject <span className="text-red-500">*</span></label>
                      <input
                        type="text"
                        required
                        value={form.ticket_title}
                        onChange={(e) => setForm({ ...form, ticket_title: e.target.value })}
                        placeholder="Brief summary of your issue"
                        className={inputClass}
                      />
                    </div>

                    <div>
                      <label className={labelClass}>Description <span className="text-red-500">*</span></label>
                      <textarea
                        required
                        rows={6}
                        value={form.description_text}
                        onChange={(e) => setForm({ ...form, description_text: e.target.value })}
                        placeholder="Describe your issue in detail..."
                        className={`${inputClass} resize-none`}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div>
                        <label className={labelClass}>Priority</label>
                        <div className="relative">
                          <select
                            value={form.priority_level}
                            onChange={(e) => setForm({ ...form, priority_level: e.target.value as any })}
                            className={`${inputClass} appearance-none cursor-pointer pr-10`}
                          >
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="urgent">Urgent</option>
                          </select>
                          <FontAwesomeIcon icon={faChevronDown} className={`absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-sm ${isDark ? 'text-white/40' : 'text-slate-400'}`} />
                        </div>
                      </div>

                      <div>
                        <label className={labelClass}>Response time</label>
                        <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                          <FontAwesomeIcon icon={faClock} className={`text-base ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`} />
                          <p className={`text-sm font-medium ${isDark ? 'text-white/70' : 'text-slate-600'}`}>Within 24 hours</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? "Submitting..." : "Submit Ticket"}
                        {!loading && <FontAwesomeIcon icon={faArrowRight} className="text-sm" />}
                      </button>
                    </div>
                  </motion.form>
                )}

                {view === "success" && createdTicket && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[32px] p-10 text-center ${cardClass}`}
                  >
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 mb-6">
                      <FontAwesomeIcon icon={faCircleCheck} className="text-3xl" />
                    </div>
                    <h2 className={`text-xl font-extrabold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Ticket Submitted</h2>
                    <p className={`mb-4 ${isDark ? "text-white/60" : "text-slate-500"}`}>
                      Your ticket <span className={`font-mono font-bold ${isDark ? "text-indigo-400" : "text-indigo-600"}`}>{createdTicket.ticket_no}</span> has been received.
                    </p>
                    <p className={`text-sm ${isDark ? "text-white/40" : "text-slate-500"}`}>
                      We typically respond within 24-48 hours. You can track the status by replying to the email confirmation.
                    </p>
                    <button
                      onClick={resetForm}
                      className="mt-6 px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-colors"
                    >
                      Submit Another Ticket
                    </button>
                  </motion.div>
                )}

                {view === "error" && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className={`rounded-[32px] p-10 text-center ${cardClass}`}
                  >
                    <h2 className={`text-xl font-extrabold mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>Something went wrong</h2>
                    <p className={`text-sm mb-6 ${isDark ? "text-white/50" : "text-slate-500"}`}>{errorMessage}</p>
                    <button
                      onClick={resetForm}
                      className="px-6 py-3 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white font-bold text-sm transition-colors"
                    >
                      Try Again
                    </button>
                  </motion.div>
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
