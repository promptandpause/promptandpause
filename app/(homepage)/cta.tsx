"use client"

import Link from "next/link"

export default function Cta() {
  return (
    <section className="bg-[#F7F9FA] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-3xl bg-[#0F1419] px-8 py-16 text-center shadow-2xl shadow-[#0F1419]/25 sm:px-16 sm:py-20">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Take five quiet minutes with yourself.
          </h2>
          <p className="mt-4 text-lg text-white/70 max-w-lg mx-auto">
            No credit card. No pressure. Start with one prompt tomorrow morning.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login?mode=signup"
              className="inline-flex items-center justify-center px-8 py-3.5 bg-white text-[#0F1419] font-semibold text-base rounded-full hover:bg-white/90 transition-colors"
            >
              Start your free trial
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-8 py-3.5 border border-white/20 text-white font-semibold text-base rounded-full hover:bg-white/10 transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
