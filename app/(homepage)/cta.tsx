"use client"

import Link from "next/link"
import { motion } from "framer-motion"
import { ArrowUpRight } from "lucide-react"

export default function Cta() {
  return (
    <section
      aria-labelledby="cta-heading"
      className="relative isolate overflow-hidden bg-[#F5F3EE] px-6 py-24 sm:py-32 lg:px-12"
    >
      <motion.div
        initial={{ opacity: 0, y: 32 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        className="relative mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-white/50 bg-gradient-to-br from-[#2F3B34] via-[#3B4A40] to-[#4A5A49] px-8 py-16 shadow-2xl shadow-[#2F3B34]/25 sm:px-14 sm:py-20 lg:px-20"
      >
        {/* Decorative glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 85% 0%, rgba(143,191,154,0.28), transparent 60%), radial-gradient(500px 300px at 10% 100%, rgba(111,169,132,0.25), transparent 60%)",
          }}
        />

        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/85 backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-[#8FBF9A]" />
              7-day free trial
            </span>
            <h2
              id="cta-heading"
              className="mt-6 font-serif text-4xl leading-[1.1] tracking-tight text-white sm:text-5xl lg:text-6xl"
            >
              Take five quiet minutes with&nbsp;yourself.
            </h2>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75 sm:text-xl">
              No credit card. No pressure. Start with one prompt tomorrow morning and see how it
              feels.
            </p>
          </div>

          <div className="flex flex-col gap-3 lg:col-span-4 lg:items-end">
            <Link
              href="/signup"
              className="group inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-7 py-4 text-sm font-semibold text-[#2F3B34] shadow-xl shadow-black/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl sm:w-auto"
            >
              Start your free trial
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
            <Link
              href="/login"
              className="text-center text-sm font-semibold text-white/80 underline-offset-4 hover:text-white hover:underline sm:text-right"
            >
              Already have an account? Sign in
            </Link>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
