"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"

interface CelebrationModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message?: string
  streakCount?: number
  wordCount?: number
  isMilestone?: boolean
  duration?: number // Auto-close after duration (ms), default 3000
}

export default function CelebrationModal({
  isOpen,
  onClose,
  title,
  message,
  streakCount,
  wordCount,
  isMilestone = false,
  duration = 3000
}: CelebrationModalProps) {
  const { theme } = useTheme()
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    if (isOpen) {
      // Delay content appearance for animation sync
      const contentTimer = setTimeout(() => setShowContent(true), 200)
      
      // Auto-close after duration
      const closeTimer = setTimeout(() => {
        onClose()
        setShowContent(false)
      }, duration)

      return () => {
        clearTimeout(contentTimer)
        clearTimeout(closeTimer)
      }
    } else {
      setShowContent(false)
    }
  }, [isOpen, duration, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ type: "spring", duration: 0.5, bounce: 0.3 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div 
              className={`
                relative max-w-md w-full rounded-3xl p-8 
                pointer-events-auto
                ${theme === 'dark' 
                  ? 'bg-gradient-to-br from-slate-800/95 to-slate-900/95 border-2 border-white/10' 
                  : 'bg-gradient-to-br from-white/95 to-orange-50/95 border-2 border-orange-200/50'
                }
                shadow-2xl backdrop-blur-xl
              `}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-orange-400 to-pink-500 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎉</span>
                </div>
              </div>

              {/* Content with stagger animation */}
              <AnimatePresence>
                {showContent && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center space-y-4"
                  >
                    {/* Title */}
                    <motion.h2
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3, type: "spring" }}
                      className={`text-2xl md:text-3xl font-bold ${
                        theme === 'dark' ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {title}
                    </motion.h2>

                    {/* Message */}
                    {message && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className={`text-base md:text-lg ${
                          theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                        }`}
                      >
                        {message}
                      </motion.p>
                    )}

                    {/* Streak Counter with animated number */}
                    {streakCount !== undefined && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.5, type: "spring", bounce: 0.5 }}
                        className={`
                          inline-flex items-center gap-2 px-6 py-3 rounded-full
                          ${isMilestone
                            ? 'bg-gradient-to-r from-orange-500 to-pink-500'
                            : theme === 'dark'
                              ? 'bg-orange-500/30 border-2 border-orange-400/50'
                              : 'bg-orange-500/20 border-2 border-orange-400/50'
                          }
                        `}
                      >
                        <motion.span
                          key={streakCount}
                          initial={{ scale: 1.5, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ type: "spring", bounce: 0.6 }}
                          className={`text-3xl font-bold ${
                            isMilestone ? 'text-white' : theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                          }`}
                        >
                          {streakCount}
                        </motion.span>
                        <span className={`text-xl ${
                          isMilestone ? 'text-white' : theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                        }`}>
                          day streak 🔥
                        </span>
                      </motion.div>
                    )}

                    {/* Word Count */}
                    {wordCount !== undefined && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6 }}
                        className={`text-sm ${theme === 'dark' ? 'text-white/60' : 'text-gray-600'}`}
                      >
                        {wordCount} words written
                      </motion.p>
                    )}

                    {/* Milestone message */}
                    {isMilestone && (
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="text-lg font-semibold bg-gradient-to-r from-orange-400 to-pink-500 bg-clip-text text-transparent"
                      >
                        You're building consistency! Amazing! ✨
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Close button (subtle) */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.5 }}
                whileHover={{ opacity: 1 }}
                transition={{ delay: 1 }}
                onClick={onClose}
                className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
                  ${theme === 'dark' 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-700'
                  }
                  transition-colors duration-200
                `}
                aria-label="Close celebration"
              >
                ✕
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
