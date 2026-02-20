"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"

export default function LoadingBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { theme } = useTheme()

  const isDark = theme === 'dark'

  useEffect(() => {
    setIsLoading(true)
    setProgress(0)

    // Simulate smooth loading progress
    const timer1 = setTimeout(() => setProgress(30), 80)
    const timer2 = setTimeout(() => setProgress(60), 160)
    const timer3 = setTimeout(() => setProgress(85), 240)
    const timer4 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setIsLoading(false), 150)
    }, 350)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0, opacity: 0 }}
          animate={{ scaleX: progress / 100, opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className={`fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left motion-reduce:hidden ${
            isDark
              ? 'bg-gradient-to-r from-[#B8C9E0] via-[#C4B5E0] to-[#A8D5BA] shadow-lg shadow-[#C4B5E0]/30'
              : 'bg-gradient-to-r from-[#5B7FA5] via-[#7E6BA5] to-[#5A8F6E] shadow-lg shadow-[#7E6BA5]/30'
          }`}
          style={{ transformOrigin: "left" }}
        />
      )}
    </AnimatePresence>
  )
}
