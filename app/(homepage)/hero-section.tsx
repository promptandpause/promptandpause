"use client"

import Navigation from "./Navigation"
import Link from "next/link"

export default function HeroSection() {
  return (
    <div className="relative min-h-screen bg-white overflow-hidden">
      <Navigation />

      <div className="relative z-10 flex items-center min-h-screen pt-20 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: Text */}
            <div className="max-w-xl">
              <h1 className="font-sans text-[#0F1419] text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
                Pause.
                <br />
                Reflect.
                <br />
                Grow.
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-[#536471] leading-relaxed max-w-md">
                One thoughtful question a day. Five quiet minutes. A private space that's just yours.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row gap-3">
                <Link
                  href="/login?mode=signup"
                  className="inline-flex items-center justify-center px-8 py-3.5 bg-[#1D9BF0] text-white font-semibold text-base rounded-full hover:bg-[#1A8CD8] transition-colors"
                >
                  Start reflecting
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center px-8 py-3.5 border border-[#EFF3F4] text-[#0F1419] font-semibold text-base rounded-full hover:bg-[#F7F9FA] transition-colors"
                >
                  Sign in
                </Link>
              </div>
            </div>

            {/* Right: Product preview */}
            <div className="hidden lg:flex justify-center">
              <div className="relative w-full max-w-md">
                <div className="rounded-2xl border border-[#EFF3F4] bg-white shadow-xl shadow-[#0F1419]/5 p-8">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="h-8 w-8 rounded-full bg-[#1D9BF0] flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
                      </svg>
                    </div>
                    <span className="text-sm font-semibold text-[#0F1419]">Today's Prompt</span>
                  </div>
                  <blockquote className="text-xl font-serif leading-relaxed text-[#0F1419]">
                    &ldquo;What moment from this week are you most grateful for?&rdquo;
                  </blockquote>
                  <div className="mt-6 pt-6 border-t border-[#EFF3F4]">
                    <div className="h-20 rounded-lg bg-[#F7F9FA] border border-[#EFF3F4] p-3">
                      <p className="text-sm text-[#8B98A5] italic">Write your reflection here...</p>
                    </div>
                    <div className="mt-3 flex justify-end">
                      <div className="h-2 w-16 rounded-full bg-[#EFF3F4]" />
                    </div>
                  </div>
                </div>
                <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-[#1D9BF0]/5 rounded-full blur-2xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
