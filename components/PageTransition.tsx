"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

interface PageTransitionProps {
  children: React.ReactNode
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't animate on first render (server-side)
  if (!isClient) {
    return <>{children}</>
  }

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 8 }}
      animate={{ 
        opacity: 1, 
        y: 0,
        transition: {
          duration: 0.3,
          ease: [0.22, 1, 0.36, 1],
        }
      }}
      // Reduced motion support - disable animations
      className="motion-reduce:!transform-none motion-reduce:!opacity-100"
    >
      {children}
    </motion.div>
  )
}
