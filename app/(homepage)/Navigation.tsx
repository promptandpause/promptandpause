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
          scrolled
            ? "bg-[#F5F3EE]/90 backdrop-blur-md shadow-lg shadow-[#D5E8DA]/60"
            : "bg-[#F5F3EE]/70 backdrop-blur-sm"
        } py-3 sm:py-4 px-4 sm:px-6`}
        style={{ zIndex: 10000 }}
      >
        <div className="flex justify-between items-center">
          {/* Logo - Vertically centered */}
          <Link href="/" className="relative flex items-center">
            <img
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              alt="Prompt & Pause"
              className="h-6 sm:h-8 transition-all duration-300"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-[#4A5A49] font-sans text-sm font-light">
            <Link
              href="/our-mission"
              className="hover:text-[#2F3B34] hover:scale-105 transition-all duration-300"
            >
              Our Mission
            </Link>
            <Link
              href="/features"
              className="hover:text-[#2F3B34] hover:scale-105 transition-all duration-300"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              className="hover:text-[#2F3B34] hover:scale-105 transition-all duration-300"
            >
              Pricing
            </Link>
            <Link
              href="/research"
              className="hover:text-red-600 hover:scale-105 transition-all duration-300 text-red-500 border border-red-400/30 px-3 py-1.5 rounded-lg hover:bg-red-500/10"
            >
              Resources
            </Link>
            <Link
              href="/contact"
              className="hover:text-[#2F3B34] hover:scale-105 transition-all duration-300"
            >
              Contact
            </Link>
            <Link
              href="/login"
              className="px-4 py-2 bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] hover:from-[#5E9876] hover:to-[#4F7C5F] rounded-xl hover:scale-105 transition-all duration-300 shadow-md shadow-[#6FA984]/25 text-white"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative p-3 min-w-[44px] min-h-[44px] text-[#3D4D3D] hover:bg-[#E8F0E3] rounded-lg transition-colors duration-300 flex items-center justify-center touch-manipulation"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Overlay - Below nav bar */}
      <div
        className={`lg:hidden fixed inset-0 bg-[#F5F3EE] transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{ top: 0, zIndex: 9999 }}
      >
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 pt-20 pb-safe">
          <Link
            href="/our-mission"
            onClick={closeMenu}
            className="text-[#2F3B34] text-2xl font-light hover:text-[#4A5A49] transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.1s" }}
          >
            Our Mission
          </Link>
          <Link
            href="/features"
            onClick={closeMenu}
            className="text-[#2F3B34] text-2xl font-light hover:text-[#4A5A49] transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.2s" }}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={closeMenu}
            className="text-[#2F3B34] text-2xl font-light hover:text-[#4A5A49] transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.3s" }}
          >
            Pricing
          </Link>
          <Link
            href="/research#need-urgent-help"
            onClick={closeMenu}
            className="text-red-500 text-2xl font-light hover:text-red-400 transition-colors duration-300 animate-fade-in border border-red-400/30 px-6 py-3 rounded-lg min-h-[48px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.35s" }}
          >
            Crisis Resources
          </Link>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="text-[#2F3B34] text-2xl font-light hover:text-[#4A5A49] transition-colors duration-300 animate-fade-in py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
            style={{ animationDelay: "0.4s" }}
          >
            Contact
          </Link>
          <Link
            href="/login"
            onClick={closeMenu}
            className="mt-4 px-8 py-4 bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] text-white text-xl font-medium rounded-2xl hover:from-[#5E9876] hover:to-[#4F7C5F] transition-all duration-300 animate-fade-in min-h-[52px] flex items-center touch-manipulation shadow-lg shadow-[#6FA984]/25"
            style={{ animationDelay: "0.5s" }}
          >
            Login
          </Link>
        </div>
      </div>
    </>
  )
}

