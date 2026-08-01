"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X } from "lucide-react"

export default function Navigation() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const closeMenu = () => setIsOpen(false)

  const handleLogin = (e: React.MouseEvent) => {
    e.preventDefault()
    if (window.location.pathname === "/") {
      const el = document.getElementById("auth-section")
      if (el) el.scrollIntoView({ behavior: "smooth" })
    } else {
      router.push("/#auth-section")
    }
    closeMenu()
  }

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
      <nav
        className={`fixed top-0 left-0 right-0 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md border-b border-[#EFF3F4]"
            : "bg-white/70 backdrop-blur-sm"
        } py-3 sm:py-3 px-4 sm:px-6`}
        style={{ zIndex: 10000 }}
      >
        <div className="flex justify-between items-center">
          <Link href="/" className="relative flex items-center">
            <img
              src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
              alt="Prompt & Pause"
              className="h-6 sm:h-7 transition-all duration-300"
            />
          </Link>

          <div className="hidden lg:flex items-center gap-6 xl:gap-8 text-[#0F1419] font-sans text-sm">
            <Link href="/our-mission" className="hover:text-[#536471] transition-colors duration-200">
              Our Mission
            </Link>
            <Link href="/features" className="hover:text-[#536471] transition-colors duration-200">
              Features
            </Link>
            <Link href="/pricing" className="hover:text-[#536471] transition-colors duration-200">
              Pricing
            </Link>
            <Link href="/research" className="hover:text-[#536471] transition-colors duration-200">
              Resources
            </Link>
            <a
              href="/#auth-section"
              onClick={handleLogin}
              className="px-5 py-2 bg-[#0F1419] hover:bg-black text-white font-semibold rounded-full transition-colors duration-200 inline-block cursor-pointer"
            >
              Log in
            </a>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden relative p-3 min-w-[44px] min-h-[44px] text-[#0F1419] hover:bg-[#F7F9FA] rounded-lg transition-colors duration-200 flex items-center justify-center touch-manipulation"
            aria-label={isOpen ? "Close menu" : "Open menu"}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      <div
        className={`lg:hidden fixed inset-0 bg-white transition-all duration-300 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
        style={{ top: 0, zIndex: 9999 }}
      >
        <div className="flex flex-col items-center justify-center min-h-screen gap-6 px-6 pt-20 pb-safe">
          <Link
            href="/our-mission"
            onClick={closeMenu}
            className="text-[#0F1419] text-2xl font-light hover:text-[#536471] transition-colors duration-200 py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
          >
            Our Mission
          </Link>
          <Link
            href="/features"
            onClick={closeMenu}
            className="text-[#0F1419] text-2xl font-light hover:text-[#536471] transition-colors duration-200 py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            onClick={closeMenu}
            className="text-[#0F1419] text-2xl font-light hover:text-[#536471] transition-colors duration-200 py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
          >
            Pricing
          </Link>
          <Link
            href="/research"
            onClick={closeMenu}
            className="text-[#0F1419] text-2xl font-light hover:text-[#536471] transition-colors duration-200 py-2 px-4 min-h-[44px] flex items-center touch-manipulation"
          >
            Resources
          </Link>
          <a
            href="/#auth-section"
            onClick={handleLogin}
            className="mt-4 px-8 py-4 bg-[#0F1419] text-white text-xl font-semibold rounded-full hover:bg-black transition-colors duration-200 min-h-[52px] flex items-center touch-manipulation cursor-pointer"
          >
            Log in
          </a>
        </div>
      </div>
    </>
  )
}
