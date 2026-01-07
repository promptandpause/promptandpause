"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useTheme } from "@/contexts/ThemeContext"
import { Badge, getRarityColor } from "@/lib/types/achievements"
import { Button } from "@/components/ui/button"
import { Share2, X, Twitter, Linkedin, Instagram } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface BadgeUnlockModalProps {
  badge: Badge | null
  isOpen: boolean
  onClose: () => void
  onShare?: () => void
}

export default function BadgeUnlockModal({
  badge,
  isOpen,
  onClose,
  onShare
}: BadgeUnlockModalProps) {
  const { theme } = useTheme()
  const [showContent, setShowContent] = useState(false)
  const [showConfetti, setShowConfetti] = useState(false)
  const [showShareMenu, setShowShareMenu] = useState(false)

  useEffect(() => {
    if (isOpen && badge) {
      // Show confetti immediately
      setShowConfetti(true)
      
      // Delay content for dramatic effect
      const contentTimer = setTimeout(() => setShowContent(true), 300)
      
      // Hide confetti after it plays once
      const confettiTimer = setTimeout(() => setShowConfetti(false), 3000)

      return () => {
        clearTimeout(contentTimer)
        clearTimeout(confettiTimer)
      }
    } else {
      setShowContent(false)
      setShowConfetti(false)
    }
  }, [isOpen, badge])

  if (!badge) return null

  const rarityColors = getRarityColor(badge.rarity)
  
  // Generate share text
  const shareText = `I just unlocked the "${badge.name}" badge on Prompt & Pause! ${badge.unlockMessage} 🎉`
  const shareUrl = typeof window !== 'undefined' ? window.location.origin : 'https://promptandpause.com'
  const shareHashtags = 'MentalWellness,SelfReflection,PromptAndPause'
  
  // Social media share URLs
  const socialLinks = {
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}&hashtags=${shareHashtags}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}&summary=${encodeURIComponent(shareText)}`,
    instagram: '', // Instagram doesn't support URL sharing, will show copy message
    snapchat: `https://www.snapchat.com/scan?attachmentUrl=${encodeURIComponent(shareUrl)}`,
    reddit: `https://reddit.com/submit?url=${encodeURIComponent(shareUrl)}&title=${encodeURIComponent(shareText)}`
  }
  
  const handleSocialShare = (platform: keyof typeof socialLinks) => {
    if (platform === 'instagram') {
      // Instagram doesn't support direct sharing, so copy to clipboard
      navigator.clipboard.writeText(shareText + '\n\n' + shareUrl)
      alert('Achievement copied to clipboard! Paste it in your Instagram story or post.')
      return
    }
    
    const url = socialLinks[platform]
    if (url) {
      window.open(url, '_blank', 'width=600,height=400')
      setShowShareMenu(false)
    }
  }

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
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] rounded-3xl"
            onClick={onClose}
          />

          {/* Background Confetti removed to avoid WASM fetch errors in dev */}

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: -50, rotate: 5 }}
            transition={{ 
              type: "spring", 
              duration: 0.8, 
              bounce: 0.5,
              delay: 0.15
            }}
            className="fixed inset-0 z-[102] flex items-center justify-center p-4"
          >
            {/* Animated rings around modal */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: [0.8, 1.2, 1], opacity: [0, 0.5, 0] }}
              transition={{ 
                duration: 1.5, 
                repeat: Infinity, 
                repeatDelay: 0.5,
                ease: "easeOut"
              }}
              className={`absolute w-full h-full rounded-full pointer-events-none motion-reduce:hidden ${
                theme === 'dark'
                  ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20'
                  : 'bg-gradient-to-r from-orange-400/30 to-red-400/30'
              }`}
              style={{ filter: 'blur(40px)' }}
            />
            
            <div 
              className={`
                relative max-w-md w-full rounded-3xl p-8 
                pointer-events-auto overflow-hidden
                ${theme === 'dark' 
                  ? 'bg-gradient-to-br from-slate-800/98 via-slate-900/98 to-slate-950/98 border-2 border-white/20' 
                  : 'bg-gradient-to-br from-white/98 via-orange-50/95 to-pink-50/95 border-2 border-orange-300/60'
                }
                shadow-[0_20px_80px_rgba(0,0,0,0.4)] backdrop-blur-2xl
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Animated gradient overlay */}
              <motion.div
                animate={{
                  backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                }}
                transition={{
                  duration: 8,
                  repeat: Infinity,
                  ease: 'linear'
                }}
                className="absolute inset-0 opacity-30 motion-reduce:hidden"
                style={{
                  background: theme === 'dark'
                    ? 'linear-gradient(90deg, rgba(251,146,60,0.15) 0%, rgba(239,68,68,0.15) 50%, rgba(251,146,60,0.15) 100%)'
                    : 'linear-gradient(90deg, rgba(251,146,60,0.1) 0%, rgba(239,68,68,0.1) 50%, rgba(251,146,60,0.1) 100%)',
                  backgroundSize: '200% 200%'
                }}
              />
              
              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    x: [0, Math.random() * 200 - 100],
                    y: [0, Math.random() * 200 - 100],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.5 + i * 0.15,
                    ease: "easeOut"
                  }}
                  className="absolute w-2 h-2 rounded-full bg-yellow-400 motion-reduce:hidden"
                  style={{
                    left: '50%',
                    top: '40%',
                    boxShadow: '0 0 10px rgba(250, 204, 21, 0.8)'
                  }}
                />
              ))}
              {/* Close button */}
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.7 }}
                whileHover={{ opacity: 1, scale: 1.1 }}
                transition={{ delay: 0.5 }}
                onClick={onClose}
                className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center
                  ${theme === 'dark' 
                    ? 'bg-white/10 hover:bg-white/20 text-white' 
                    : 'bg-gray-200/50 hover:bg-gray-300/50 text-gray-700'
                  }
                  transition-colors duration-200
                `}
                aria-label="Close badge notification"
              >
                <X className="w-4 h-4" />
              </motion.button>

              {/* Content with stagger animation */}
              <AnimatePresence>
                {showContent && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="flex flex-col items-center text-center space-y-6"
                  >
                    {/* Badge Unlocked Header */}
                    <motion.div
                      initial={{ opacity: 0, y: -30, scale: 0.8 }}
                      animate={{ 
                        opacity: 1, 
                        y: 0, 
                        scale: 1,
                      }}
                      transition={{ 
                        delay: 0.4, 
                        type: "spring",
                        bounce: 0.6
                      }}
                      className="relative"
                    >
                      <motion.div
                        animate={{
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className={`text-sm font-black uppercase tracking-[0.2em] ${
                          theme === 'dark' ? 'text-orange-300' : 'text-orange-600'
                        } drop-shadow-[0_0_8px_rgba(251,146,60,0.5)] motion-reduce:!transform-none`}
                      >
                        ✨ Badge Unlocked! ✨
                      </motion.div>
                    </motion.div>

                    {/* Badge Icon with Enhanced Glow */}
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        delay: 0.5, 
                        type: "spring", 
                        bounce: 0.6,
                        duration: 0.8
                      }}
                      className="relative"
                    >
                      {/* Outer pulse ring */}
                      <motion.div
                        animate={{
                          scale: [1, 1.3, 1],
                          opacity: [0.5, 0, 0.5]
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: "easeInOut"
                        }}
                        className={`absolute inset-0 w-32 h-32 rounded-full ${rarityColors.bg} ${rarityColors.border} border-2 motion-reduce:hidden`}
                        style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
                      />
                      
                      <motion.div
                        whileHover={{ scale: 1.1, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                        className={`
                          relative w-32 h-32 rounded-full flex items-center justify-center
                          ${rarityColors.bg} ${rarityColors.border} border-4
                          shadow-[0_0_40px_rgba(251,146,60,0.5)] ${rarityColors.glow}
                          motion-reduce:!transform-none
                        `}
                      >
                        {/* Rotating glow effect for all badges */}
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ 
                            duration: badge.rarity === 'legendary' ? 2 : 4, 
                            repeat: Infinity, 
                            ease: "linear" 
                          }}
                          className={`absolute inset-0 rounded-full motion-reduce:hidden ${
                            badge.rarity === 'legendary'
                              ? 'bg-gradient-to-r from-yellow-400/40 via-orange-400/40 to-yellow-400/40'
                              : 'bg-gradient-to-r from-orange-400/20 via-red-400/20 to-orange-400/20'
                          }`}
                          style={{ filter: 'blur(12px)' }}
                        />
                        
                        {/* Icon with pop animation */}
                        <motion.span 
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 1.5,
                            repeat: Infinity,
                            ease: "easeInOut",
                            delay: 0.8
                          }}
                          className="text-7xl relative z-10 drop-shadow-[0_0_10px_rgba(0,0,0,0.3)] motion-reduce:!transform-none" 
                          role="img" 
                          aria-label={badge.name}
                        >
                          {badge.icon}
                        </motion.span>
                      </motion.div>
                    </motion.div>

                    {/* Badge Name */}
                    <motion.h2
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ delay: 0.7, type: "spring", bounce: 0.5 }}
                      className={`text-3xl font-black bg-gradient-to-r ${
                        theme === 'dark' 
                          ? 'from-white via-orange-200 to-white' 
                          : 'from-gray-900 via-orange-600 to-gray-900'
                      } bg-clip-text text-transparent drop-shadow-sm`}
                    >
                      {badge.name}
                    </motion.h2>

                    {/* Rarity Badge */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8, rotateX: -90 }}
                      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                      transition={{ delay: 0.8, type: "spring" }}
                      whileHover={{ scale: 1.1 }}
                      className={`
                        px-5 py-2 rounded-full text-sm font-black uppercase tracking-widest
                        ${rarityColors.bg} ${rarityColors.border} border-2 ${rarityColors.text}
                        shadow-lg ${rarityColors.glow}
                        relative overflow-hidden
                      `}
                    >
                      {/* Shimmer effect */}
                      <motion.div
                        animate={{
                          x: ['-100%', '200%']
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatDelay: 1,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent motion-reduce:hidden"
                        style={{ skewX: '-20deg' }}
                      />
                      <span className="relative z-10">{badge.rarity}</span>
                    </motion.div>

                    {/* Description */}
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.9 }}
                      className={`text-base leading-relaxed ${
                        theme === 'dark' ? 'text-white/80' : 'text-gray-700'
                      } font-medium`}
                    >
                      {badge.description}
                    </motion.p>

                    {/* Unlock Message */}
                    <motion.div
                      initial={{ opacity: 0, y: 20, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ delay: 1, type: "spring", bounce: 0.4 }}
                      className={`
                        p-5 rounded-2xl w-full relative overflow-hidden
                        ${theme === 'dark' 
                          ? 'bg-gradient-to-br from-green-500/25 to-emerald-500/25 border-2 border-green-500/40' 
                          : 'bg-gradient-to-br from-green-500/15 to-emerald-500/15 border-2 border-green-400/40'
                        }
                        shadow-[0_8px_30px_rgba(34,197,94,0.2)]
                      `}
                    >
                      {/* Shine effect */}
                      <motion.div
                        animate={{
                          x: ['-100%', '200%']
                        }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          repeatDelay: 2,
                          ease: "easeInOut"
                        }}
                        className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent motion-reduce:hidden"
                        style={{ skewX: '-20deg' }}
                      />
                      <p className={`text-lg font-bold relative z-10 ${
                        theme === 'dark' ? 'text-green-200' : 'text-green-800'
                      } drop-shadow-sm`}>
                        ✨ {badge.unlockMessage}
                      </p>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 1.1 }}
                      className="w-full pt-4 space-y-3"
                    >
                      {/* Share Achievement Button */}
                      <Button
                        onClick={() => setShowShareMenu(true)}
                        variant="outline"
                        className={`w-full gap-2 ${
                          theme === 'dark'
                            ? 'border-white/20 hover:bg-white/10'
                            : 'border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <Share2 className="w-4 h-4" />
                        Share Achievement
                      </Button>

                      {/* Continue Button */}
                      <Button
                        onClick={onClose}
                        className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold shadow-lg"
                      >
                        Continue
                      </Button>
                    </motion.div>

                    {/* Fun Fact about Badge */}
                    {badge.category === 'streak' && badge.requirement >= 7 && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.2 }}
                        className={`text-xs italic ${
                          theme === 'dark' ? 'text-white/50' : 'text-gray-500'
                        }`}
                      >
                        💡 Did you know? It takes {badge.requirement} days to start building a lasting habit!
                      </motion.p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Share Dialog */}
          <Dialog open={showShareMenu} onOpenChange={setShowShareMenu}>
            <DialogContent className={`max-w-md ${
              theme === 'dark'
                ? 'bg-slate-900 border-white/10'
                : 'bg-white border-gray-300'
            }`}>
              <DialogHeader>
                <DialogTitle className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>
                  Share Your Achievement
                </DialogTitle>
                <DialogDescription className={theme === 'dark' ? 'text-white/70' : 'text-gray-600'}>
                  Choose a platform to share your {badge.name} badge
                </DialogDescription>
              </DialogHeader>

              <div className="grid grid-cols-2 gap-3 mt-4">
                {/* Twitter/X */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleSocialShare('twitter')
                    setShowShareMenu(false)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white shadow-md hover:shadow-lg"
                >
                  <Twitter className="w-4 h-4" />
                  <span>Twitter</span>
                </motion.button>

                {/* LinkedIn */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleSocialShare('linkedin')
                    setShowShareMenu(false)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-[#0A66C2] hover:bg-[#004182] text-white shadow-md hover:shadow-lg"
                >
                  <Linkedin className="w-4 h-4" />
                  <span>LinkedIn</span>
                </motion.button>

                {/* Instagram */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleSocialShare('instagram')
                    setShowShareMenu(false)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-gradient-to-br from-[#833AB4] via-[#FD1D1D] to-[#F77737] hover:opacity-90 text-white shadow-md hover:shadow-lg"
                >
                  <Instagram className="w-4 h-4" />
                  <span>Instagram</span>
                </motion.button>

                {/* Snapchat */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleSocialShare('snapchat')
                    setShowShareMenu(false)
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-[#FFFC00] hover:bg-[#e6e300] text-black shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.206 2.024c-1.062 0-2.022.273-2.88.82a4.773 4.773 0 0 0-1.84 2.173c-.203.527-.31 1.086-.31 1.677 0 .48.076.95.227 1.406.125.378.308.732.548 1.06-.24-.017-.484-.025-.73-.025-1.062 0-2.023.273-2.88.82a4.773 4.773 0 0 0-1.84 2.173c-.204.527-.31 1.086-.31 1.677 0 1.236.414 2.332 1.24 3.287.828.955 1.88 1.616 3.157 1.982.638.183 1.3.275 1.987.275 1.062 0 2.022-.273 2.88-.82a4.773 4.773 0 0 0 1.84-2.173c.203-.527.31-1.086.31-1.677 0-.48-.076-.95-.227-1.406a4.55 4.55 0 0 0-.548-1.06c.24.017.484.025.73.025 1.062 0 2.023-.273 2.88-.82a4.773 4.773 0 0 0 1.84-2.173c.204-.527.31-1.086.31-1.677 0-1.236-.414-2.332-1.24-3.287-.828-.955-1.88-1.616-3.157-1.982-.638-.183-1.3-.275-1.987-.275z"/>
                  </svg>
                  <span>Snapchat</span>
                </motion.button>

                {/* Reddit */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    handleSocialShare('reddit')
                    setShowShareMenu(false)
                  }}
                  className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-semibold text-sm transition-all bg-[#FF4500] hover:bg-[#e03d00] text-white shadow-md hover:shadow-lg"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                  </svg>
                  <span>Share on Reddit</span>
                </motion.button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </AnimatePresence>
  )
}
