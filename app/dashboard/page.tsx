"use client"

import { AuthGuard } from "@/components/auth/AuthGuard"
import { useTier } from "@/hooks/useTier"
import { PromptLimitBanner } from "@/components/tier/TierGate"
import TodaysPrompt from "./components/todays-prompt"
import MoodTracker from "./components/mood-tracker"
import WeeklyInsights from "./components/weekly-insights"
import MoodAnalytics from "./components/mood-analytics"
import FocusAreasManager from "./components/focus-areas-manager"
import QuickStats from "./components/quick-stats"
import ActivityCalendar from "./components/activity-calendar"
import GlobalDataSync from "./components/global-data-sync"
import { BubbleBackground } from "@/components/ui/bubble-background"
import { DashboardSidebar } from "./components/DashboardSidebar"
import { useTheme } from "@/contexts/ThemeContext"
import { getPageBackground } from "@/lib/utils/themeStyles"
import { motion } from "framer-motion"

export default function DashboardPage() {
  const { tier, features = {} } = useTier()
  const { theme } = useTheme()

  return (
    <AuthGuard redirectPath="/dashboard">
      <div 
        className="min-h-screen relative" 
        style={theme === 'light' ? { backgroundColor: '#F5F5DC' } : { background: 'linear-gradient(to bottom right, #0f172a, #1e293b, #0f172a)' }}
      >
      {/* Global Data Sync - Auto-syncs with Supabase every 5 minutes */}
      <GlobalDataSync />
      
      {/* Animated Bubble Background */}
      <BubbleBackground 
        interactive
        className="fixed inset-0 -z-10"
      />
      {/* Theme overlay for cohesive background */}
      <div className={`fixed inset-0 -z-10 ${theme === 'light' ? 'bg-[#F5F5DC]/60' : 'bg-black/20'}`} />

      <div className="relative z-10 px-3 md:px-6 pt-3 md:pt-6 pb-24 md:pb-6 w-full max-w-[1920px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4 md:gap-6 items-start">
          {/* Universal Sidebar - Desktop & Mobile */}
          <DashboardSidebar />

          {/* Main Content Area with Stagger Animation */}
          <motion.div 
            className="col-span-1 md:col-span-7 space-y-4 md:space-y-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.1,
              }
            }
          }}
        >
          {/* Show prompt limit warning for free users - Moved to inside TodaysPrompt */}
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
            }}
            className="motion-reduce:!transform-none motion-reduce:!opacity-100"
          >
            <TodaysPrompt />
          </motion.div>
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
            }}
            className="motion-reduce:!transform-none motion-reduce:!opacity-100"
          >
            <MoodTracker />
          </motion.div>
          
          {tier === 'premium' && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
              }}
              className="motion-reduce:!transform-none motion-reduce:!opacity-100"
            >
              <WeeklyInsights />
            </motion.div>
          )}
          
          {tier === 'premium' && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 20 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
              }}
              className="motion-reduce:!transform-none motion-reduce:!opacity-100"
            >
              <MoodAnalytics />
            </motion.div>
          )}
          
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } }
            }}
            className="motion-reduce:!transform-none motion-reduce:!opacity-100"
          >
            <QuickStats />
          </motion.div>
        </motion.div>

        {/* Right Sidebar with Stagger Animation - Hidden on mobile */}
        <motion.div 
          className="hidden md:block md:col-span-3 space-y-4 md:space-y-6"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.08,
                delayChildren: 0.3,
              }
            }
          }}
        >
          <motion.div
            variants={{
              hidden: { opacity: 0, x: 20 },
              visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
            }}
            className="motion-reduce:!transform-none motion-reduce:!opacity-100"
          >
            <ActivityCalendar />
          </motion.div>
          
          {tier === 'premium' && (
            <motion.div
              variants={{
                hidden: { opacity: 0, x: 20 },
                visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeOut" } }
              }}
              className="motion-reduce:!transform-none motion-reduce:!opacity-100"
            >
              <FocusAreasManager />
            </motion.div>
          )}
        </motion.div>
        </div>
      </div>
    </div>
    </AuthGuard>
  )
}

