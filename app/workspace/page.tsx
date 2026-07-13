"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { Users, ArrowLeft, Plus, Loader2 } from 'lucide-react'
import Link from 'next/link'
import { DashboardSidebar } from '@/app/dashboard/components/DashboardSidebar'

interface OrgSummary {
  id: string
  name: string
  slug: string
  seat_count: number
  status: string
  myRole: 'owner' | 'admin' | 'member'
}

export default function WorkspaceLandingPage() {
  const { theme } = useTheme()
  const isDark = theme === 'dark'
  const router = useRouter()

  const [orgs, setOrgs] = useState<OrgSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)

  const [orgName, setOrgName] = useState('')
  const [seatCount, setSeatCount] = useState(5)
  const [billingInterval, setBillingInterval] = useState<'monthly' | 'annual'>('monthly')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/org/mine')
      .then(r => r.ok ? r.json() : Promise.resolve({ organizations: [] }))
      .then(({ organizations }) => setOrgs(organizations || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function handleCreate() {
    if (!orgName.trim()) {
      setError('Give your workspace a name')
      return
    }
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/org/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgName: orgName.trim(), seatCount, billingInterval }),
      })
      const body = await res.json()
      if (!res.ok) {
        setError(body.error || 'Something went wrong')
        setSubmitting(false)
        return
      }
      window.location.href = body.checkoutUrl
    } catch {
      setError('Something went wrong. Try again.')
      setSubmitting(false)
    }
  }

  const pricePerSeat = billingInterval === 'annual' ? 6 : 7.5

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0A0A0A]' : 'bg-[#FFFFFF]'}`}>
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <main className="flex-1 pb-32 md:pb-10 overflow-y-auto scrollbar-thin">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 pt-16 md:pt-10 pb-8">
        <Link
          href="/dashboard"
          className={`hidden md:inline-flex items-center gap-2 text-sm mb-8 transition-colors ${
            isDark ? 'text-white/50 hover:text-white' : 'text-[#536471] hover:text-[#0F1419]'
          }`}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className={`text-2xl sm:text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>
          Workspaces
        </h1>
        <p className={`text-sm mb-8 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
          Bring Prompt & Pause to your team. Your personal reflections stay exactly as private as they are today.
        </p>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className={`h-6 w-6 animate-spin ${isDark ? 'text-white/30' : 'text-[#8B98A5]'}`} />
          </div>
        ) : (
          <>
            {orgs.length > 0 && (
              <div className="space-y-3 mb-8">
                {orgs.map(org => (
                  <button
                    key={org.id}
                    onClick={() => router.push(`/workspace/${org.id}`)}
                    className={`w-full text-left p-4 rounded-xl border transition-colors flex items-center justify-between ${
                      isDark
                        ? 'bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.07]'
                        : 'bg-[#F7F9FA] border-[#EFF3F4] hover:bg-[#EFF3F4]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${isDark ? 'bg-[#1D9BF0]/20' : 'bg-[#1D9BF0]/10'}`}>
                        <Users className="h-5 w-5 text-[#1D9BF0]" />
                      </div>
                      <div>
                        <div className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>{org.name}</div>
                        <div className={`text-xs ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                          {org.seat_count} seats · {org.myRole}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {!showCreate ? (
              <button
                onClick={() => setShowCreate(true)}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-full text-sm font-semibold transition-colors ${
                  isDark ? 'bg-white/[0.06] text-white hover:bg-white/10' : 'bg-[#EFF3F4] text-[#0F1419] hover:bg-[#E1E8EA]'
                }`}
              >
                <Plus className="h-4 w-4" />
                Create a workspace
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-5 rounded-2xl border ${isDark ? 'bg-white/[0.04] border-white/[0.08]' : 'bg-[#F7F9FA] border-[#EFF3F4]'}`}
              >
                <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-[#0F1419]'}`}>Create a workspace</h2>

                <label className={`text-xs font-medium block mb-1.5 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                  Workspace name
                </label>
                <input
                  value={orgName}
                  onChange={e => setOrgName(e.target.value)}
                  placeholder="Acme Inc."
                  className={`w-full px-3.5 py-2.5 rounded-lg text-sm mb-4 border outline-none focus:border-[#1D9BF0] ${
                    isDark ? 'bg-white/[0.04] border-white/10 text-white placeholder:text-white/30' : 'bg-white border-[#CFD9DE] text-[#0F1419]'
                  }`}
                />

                <label className={`text-xs font-medium block mb-1.5 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                  Number of seats
                </label>
                <input
                  type="number"
                  min={1}
                  max={1000}
                  value={seatCount}
                  onChange={e => setSeatCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className={`w-full px-3.5 py-2.5 rounded-lg text-sm mb-4 border outline-none focus:border-[#1D9BF0] ${
                    isDark ? 'bg-white/[0.04] border-white/10 text-white' : 'bg-white border-[#CFD9DE] text-[#0F1419]'
                  }`}
                />

                <label className={`text-xs font-medium block mb-1.5 ${isDark ? 'text-white/50' : 'text-[#536471]'}`}>
                  Billing
                </label>
                <div className="flex gap-2 mb-5">
                  <button
                    onClick={() => setBillingInterval('monthly')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      billingInterval === 'monthly'
                        ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white'
                        : isDark ? 'border-white/10 text-white/60' : 'border-[#CFD9DE] text-[#536471]'
                    }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingInterval('annual')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                      billingInterval === 'annual'
                        ? 'bg-[#1D9BF0] border-[#1D9BF0] text-white'
                        : isDark ? 'border-white/10 text-white/60' : 'border-[#CFD9DE] text-[#536471]'
                    }`}
                  >
                    Annual <span className="opacity-75">(save 20%)</span>
                  </button>
                </div>

                <p className={`text-xs mb-5 ${isDark ? 'text-white/40' : 'text-[#8B98A5]'}`}>
                  £{pricePerSeat}/seat/{billingInterval === 'annual' ? 'mo, billed annually' : 'mo'} · £{(pricePerSeat * seatCount).toFixed(2)}{billingInterval === 'annual' ? '/mo' : '/mo'} total for {seatCount} {seatCount === 1 ? 'seat' : 'seats'}
                </p>

                {error && (
                  <p className="text-xs text-red-500 mb-4">{error}</p>
                )}

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowCreate(false)}
                    className={`px-4 py-2.5 rounded-full text-sm font-medium ${isDark ? 'text-white/60 hover:bg-white/5' : 'text-[#536471] hover:bg-white'}`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreate}
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-full text-sm font-semibold bg-[#1D9BF0] text-white hover:bg-[#1A8CD8] transition-colors disabled:opacity-60"
                  >
                    {submitting ? 'Starting checkout\u2026' : 'Continue to payment'}
                  </button>
                </div>
              </motion.div>
            )}
          </>
        )}
        </div>
        </main>
      </div>
    </div>
  )
}
