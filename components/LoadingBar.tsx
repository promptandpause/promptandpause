"use client"

import { useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function LoadingBar() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)
  const [progress, setProgress] = useState(0)

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
          className="fixed top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-orange-400 via-pink-400 to-orange-500 z-[100] origin-left shadow-lg shadow-orange-500/50 motion-reduce:hidden"
          style={{ transformOrigin: "left" }}
        />
      )}
    </AnimatePresence>
  )
}
