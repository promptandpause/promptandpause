"use client"

import Navigation from "./Navigation"
import Link from "next/link"
import { useState } from "react"

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M21.35 11.1h-9.18v2.97h5.27c-.23 1.4-1.62 4.1-5.27 4.1-3.17 0-5.76-2.62-5.76-5.85s2.59-5.85 5.76-5.85c1.8 0 3.02.77 3.71 1.43l2.53-2.44C16.88 3.84 15.21 3 12.17 3 7.04 3 2.93 7.11 2.93 12.24s4.11 9.24 9.24 9.24c5.33 0 8.86-3.75 8.86-9.04 0-.61-.07-1.07-.18-1.34z" fill="#EA4335"/>
    </svg>
  )
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.18 0-.36-.02-.53-.06-.01-.18-.04-.56-.04-.95 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.22.05.45.05.68zm4.565 16.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z"/>
    </svg>
  )
}

export default function HeroSection() {
  const [email, setEmail] = useState("")

  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <Navigation />

      <div className="relative z-10 flex items-center min-h-screen pt-20 pb-20">
        <div className="max-w-[1280px] mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-4 items-center min-h-[78vh]">
            {/* Left: Heading + Sign up form */}
            <div className="max-w-md mx-auto lg:mx-0 w-full">
              <h1 className="font-bold text-[#0F1419] text-5xl sm:text-6xl lg:text-7xl tracking-tight leading-[1.05] mb-10">
                Pause &amp; reflect.
              </h1>

              <div className="max-w-sm">
                <p className="text-2xl sm:text-3xl font-bold text-[#0F1419] mb-6">
                  Join today.
                </p>

                <div className="flex flex-col gap-3">
                  <Link
                    href="/login?mode=signup"
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0F1419] text-white font-medium py-2.5 px-6 hover:bg-black/90 transition-colors"
                  >
                    <GoogleIcon />
                    Sign up with Google
                  </Link>
                  <Link
                    href="/login?mode=signup"
                    className="flex items-center justify-center gap-2 w-full rounded-full bg-[#0F1419] text-white font-medium py-2.5 px-6 hover:bg-black/90 transition-colors"
                  >
                    <AppleIcon />
                    Sign up with Apple
                  </Link>

                  <div className="flex items-center gap-3 my-1">
                    <div className="h-px flex-1 bg-[#EFF3F4]" />
                    <span className="text-[#536471] text-sm">or</span>
                    <div className="h-px flex-1 bg-[#EFF3F4]" />
                  </div>

                  <form onSubmit={(e) => e.preventDefault()}>
                    <input
                      type="text"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email"
                      className="w-full rounded-xl border border-[#CFD9DE] px-3 py-3 text-[#0F1419] text-base placeholder:text-[#536471] focus:border-[#1D9BF0] focus:outline-none focus:ring-1 focus:ring-[#1D9BF0] mb-3"
                    />
                    <button
                      type="submit"
                      disabled={!email}
                      className="w-full rounded-full bg-[#1D9BF0] text-white font-bold py-3 px-6 hover:bg-[#1A8CD8] transition-colors disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                    >
                      Continue
                    </button>
                  </form>

                  <p className="text-[13px] text-[#536471] leading-relaxed mt-1">
                    By signing up, you agree to the{" "}
                    <Link href="/terms-of-service" className="text-[#1D9BF0] hover:underline">Terms of Service</Link>
                    {" "}and{" "}
                    <Link href="/privacy-policy" className="text-[#1D9BF0] hover:underline">Privacy Policy</Link>
                    , including{" "}
                    <Link href="/cookie-policy" className="text-[#1D9BF0] hover:underline">Cookie Use</Link>.
                  </p>
                </div>

                <div className="mt-10">
                  <p className="text-[#0F1419] font-bold mb-3">Already have an account?</p>
                  <Link
                    href="/login"
                    className="block w-full max-w-sm text-center rounded-full border border-[#CFD9DE] text-[#1D9BF0] font-bold py-3 px-6 hover:bg-[#1D9BF0]/10 transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              </div>
            </div>

            {/* Right: Big brand mark */}
            <div className="hidden lg:flex justify-center items-center">
              <img
                src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg"
                alt="Prompt & Pause"
                className="w-72 xl:w-80 h-auto opacity-90"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
