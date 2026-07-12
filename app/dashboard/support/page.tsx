"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import GlobalDataSync from "../components/global-data-sync"
import { DashboardSidebar } from "../components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { useTranslation } from "@/hooks/useTranslation"
import { useState } from "react"
import { motion } from "framer-motion"
import { Lifebuoy, CheckCircle, Clock, ArrowRight } from "phosphor-react"

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
  const { t } = useTranslation()

  const [view, setView] = useState<"form" | "success" | "error">("form")
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [createdTicket, setCreatedTicket] = useState<any>(null)
  const [form, setForm] = useState({
    ticket_title: "",
    description_text: "",
    priority_level: "medium" as "low" | "medium" | "high" | "urgent",
  })

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
        throw new Error(data.error || "Failed to submit ticket")
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

  const bg = isDark ? "bg-[#1a1a2e]" : "bg-[#EFF3F4]"
  const cardBg = isDark ? "bg-[#16213e]" : "bg-white"
  const textPrimary = isDark ? "text-white" : "text-[#0F1419]"
  const textSecondary = isDark ? "text-gray-400" : "text-[#536471]"
  const border = isDark ? "border-gray-700" : "border-[#B3D9F2]"
  const inputBg = isDark ? "bg-[#0f3460]" : "bg-white"

  return (
    <div className={`min-h-screen ${bg}`}>
      <GlobalDataSync />
      <DashboardSidebar />

      <div className="lg:pl-64">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-8">
            <Lifebuoy className={`w-8 h-8 ${isDark ? "text-blue-400" : "text-[#1D9BF0]"}`} weight="fill" />
            <h1 className={`text-2xl font-bold ${textPrimary}`}>Support</h1>
          </div>

          {view === "form" && (
            <motion.form
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmit}
              className={`${cardBg} ${border} border rounded-xl p-6 space-y-6`}
            >
              {errorMessage && (
                <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-lg text-sm">
                  {errorMessage}
                </div>
              )}

              <div>
                <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Subject *</label>
                <input
                  type="text"
                  required
                  value={form.ticket_title}
                  onChange={(e) => setForm({ ...form, ticket_title: e.target.value })}
                  placeholder="Brief summary of your issue"
                  className={`w-full px-4 py-3 ${border} border-2 rounded-lg ${textPrimary} ${inputBg} outline-none focus:border-[#1D9BF0] transition-colors`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Description *</label>
                <textarea
                  required
                  rows={6}
                  value={form.description_text}
                  onChange={(e) => setForm({ ...form, description_text: e.target.value })}
                  placeholder="Describe your issue in detail..."
                  className={`w-full px-4 py-3 ${border} border-2 rounded-lg ${textPrimary} ${inputBg} outline-none focus:border-[#1D9BF0] transition-colors resize-none`}
                />
              </div>

              <div>
                <label className={`block text-sm font-semibold mb-2 ${textPrimary}`}>Priority</label>
                <select
                  value={form.priority_level}
                  onChange={(e) => setForm({ ...form, priority_level: e.target.value as any })}
                  className={`w-full px-4 py-3 ${border} border-2 rounded-lg ${textPrimary} ${inputBg} outline-none focus:border-[#1D9BF0] transition-colors`}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full px-6 py-3 bg-[#1D9BF0] text-white font-medium rounded-lg hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? "Submitting..." : "Submit Ticket"}
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </motion.form>
          )}

          {view === "success" && createdTicket && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${cardBg} ${border} border rounded-xl p-8 text-center`}
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" weight="fill" />
              </div>
              <h2 className={`text-xl font-bold mb-2 ${textPrimary}`}>Ticket Submitted</h2>
              <p className={`mb-4 ${textSecondary}`}>
                Your ticket <span className="font-mono font-bold text-[#1D9BF0]">{createdTicket.ticket_no}</span> has been received.
              </p>
              <p className={`text-sm ${textSecondary}`}>
                We typically respond within 24-48 hours. You can track the status by replying to the email confirmation.
              </p>
              <button
                onClick={() => {
                  setView("form")
                  setForm({ ticket_title: "", description_text: "", priority_level: "medium" })
                  setCreatedTicket(null)
                }}
                className="mt-6 px-6 py-2 border-2 border-[#1D9BF0] text-[#1D9BF0] font-medium rounded-lg hover:bg-[#1D9BF0] hover:text-white transition-colors"
              >
                Submit Another Ticket
              </button>
            </motion.div>
          )}

          {view === "error" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${cardBg} ${border} border rounded-xl p-8 text-center`}
            >
              <p className={`text-red-600 mb-4 ${textPrimary}`}>{errorMessage}</p>
              <button
                onClick={() => setView("form")}
                className="px-6 py-2 border-2 border-[#1D9BF0] text-[#1D9BF0] font-medium rounded-lg hover:bg-[#1D9BF0] hover:text-white transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}
