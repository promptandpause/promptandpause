"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"

export default function LoadingBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const { theme } = useTheme()
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const isDark = theme === 'dark'

  useEffect(() => {
    // Clear any in-flight timers from previous navigation
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []

    setIsLoading(true)
    setProgress(0)

    // Smooth eased progress curve
    const t1 = setTimeout(() => setProgress(25), 60)
    const t2 = setTimeout(() => setProgress(50), 150)
    const t3 = setTimeout(() => setProgress(72), 280)
    const t4 = setTimeout(() => setProgress(88), 420)
    const t5 = setTimeout(() => {
      setProgress(100)
      const t6 = setTimeout(() => setIsLoading(false), 300)
      timersRef.current.push(t6)
    }, 560)

    timersRef.current = [t1, t2, t3, t4, t5]

    return () => timersRef.current.forEach(clearTimeout)
  }, [pathname])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ scaleX: 0, opacity: 1 }}
          animate={{ scaleX: progress / 100 }}
          exit={{ opacity: 0, transition: { duration: 0.4, ease: 'easeOut' } }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed top-0 left-0 right-0 h-[2px] z-[100] origin-left motion-reduce:hidden ${
            isDark
              ? 'bg-gradient-to-r from-[#8BA8C8] via-[#B8A8D8] to-[#8ABFA8]'
              : 'bg-gradient-to-r from-[#6366F1] via-[#818CF8] to-[#818CF8]'
          }`}
          style={{ transformOrigin: 'left' }}
        >
          {/* Shimmer glow at the leading edge */}
          <div className={`absolute right-0 top-0 h-full w-16 ${
            isDark
              ? 'bg-gradient-to-l from-[#C4B5E0]/60 to-transparent'
              : 'bg-gradient-to-l from-[#7E6BA5]/50 to-transparent'
          } blur-[2px]`} />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
