"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"

export default function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  // Close mobile menu when clicking a link
  const closeMenu = () => setIsOpen(false)

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "unset"
    }
    return () => {
      document.body.style.overflow = "unset"
    }
  }, [isOpen])

  return (
    <>
      {/* Navigation Bar - Always visible with higher z-index */}
      <nav
        className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
          scrolled ? "bg-black/40 backdrop-blur-md shadow-lg shadow-purple-900/10" : "bg-black/10 backdrop-blur-sm"
        } py-3 sm:py-4 px-4 sm:px-6`}
        style={{ zIndex: 10000 }}
      >
        <div className="flex justify-between items-center">
          {/* Logo - Vertically centered */}
          <Link href="/" className="relative flex items-center">
            <img
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              alt="Prompt & Pause"
              className="h-6 sm:h-8 invert transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-white/90 font-sans text-sm font-light">
            <Link
              href="/our-mission"
              className="hover:text-white hover:scale-105 transition-all duration-300"
            >
              Our Mission
            </Link>
            <Link
              href="/features"
              className="hover:text-white hover:scale-105 transition-all duration-300"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="hover:text-white hover:scale-105 transition-all duration-300"
            >
              Pricing
            </Link>
            <Link
              href="/research"
              className="hover:text-white hover:scale-105 transition-all duration-300 text-red-400 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              Resources
            </Link>
            <Link
              href="/contact"
              className="hover:text-white hover:scale-105 transition-all duration-300"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 rounded-xl hover:scale-105 transition-all duration-300 shadow-md shadow-purple-500/20"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative p-3 min-w-[44px] min-h-[44px] text-white hover:bg-white/10 rounded-lg transition-colors duration-300 flex items-center justify-center touch-manipulation"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Below nav bar */}
      <div
        className={`lg:hidden fixed inset-0 bg-black transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{ top: 0, zIndex: 9999 }}
      >
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 pt-20 pb-safe">
          <Link
            href="/our-mission"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.1s" }}
          >
            Our Mission
          </Link>
          <Link
            href="/features"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.2s" }}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.3s" }}
          >
            Pricing
          </Link>
          <Link
            href="/research#need-urgent-help"
            onClick={closeMenu}
            className="text-red-400 text-2xl font-light hover:text-red-300 transition-colors duration-300 animate-fade-in border border-red-400/30 px-6 py-3 rounded-lg min-h-[48px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.35s" }}
          >
            Crisis Resources
          </Link>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.4s" }}
          >
            Contact
          </Link>
          <Link
            href="/login"
            onClick={closeMenu}
            className="mt-4 px-8 py-4 bg-gradient-to-r from-purple-600 to-purple-500 text-white text-xl font-medium rounded-2xl hover:from-purple-700 hover:to-purple-600 transition-all duration-300 animate-fade-in min-h-[52px] flex items-center touch-manipulation shadow-lg shadow-purple-500/25"
            style={{ animationDelay: "0.5s" }}
          >
            Login
          </Link>
        </div>
      </div>
    </>
  )
}

