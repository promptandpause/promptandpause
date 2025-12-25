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
          scrolled ? "bg-black/30 backdrop-blur-md shadow-lg" : "bg-black/10 backdrop-blur-sm"
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
              href="/auth/signin"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg hover:scale-105 transition-all duration-300 border border-white/20"
            >
              Login
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative p-2 text-white hover:bg-white/10 rounded-lg transition-colors duration-300 flex items-center"
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
        <div className="flex flex-col items-center justify-center min-h-screen gap-8 px-6 pt-20">
          <Link
            href="/our-mission"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in"
            style={{ animationDelay: "0.1s" }}
          >
            Our Mission
          </Link>
          <Link
            href="/features"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in"
            style={{ animationDelay: "0.2s" }}
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in"
            style={{ animationDelay: "0.3s" }}
          >
            Pricing
          </Link>
          <Link
            href="/research#need-urgent-help"
            onClick={closeMenu}
            className="text-red-400 text-2xl font-light hover:text-red-300 transition-colors duration-300 animate-fade-in border border-red-400/30 px-6 py-2 rounded-lg"
            style={{ animationDelay: "0.35s" }}
          >
            Crisis Resources
          </Link>
          <Link
            href="/contact"
            onClick={closeMenu}
            className="text-white text-2xl font-light hover:text-white/70 transition-colors duration-300 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Contact
          </Link>
          <Link
            href="/auth/signin"
            onClick={closeMenu}
            className="mt-4 px-8 py-3 bg-white text-black text-xl font-medium rounded-lg hover:bg-white/90 transition-all duration-300 animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            Login
          </Link>
        </div>
      </div>
    </>
  )
}

