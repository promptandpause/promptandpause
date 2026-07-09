"use client"

import { motion } from "framer-motion"
import { Sparkles, Shield, Wind, Moon } from "lucide-react"

const principles = [
  {
    icon: Sparkles,
    title: "One prompt at a time",
    body: "No feeds, no algorithm. Just a single question chosen to help you pause and reflect.",
  },
  {
    icon: Shield,
    title: "Truly private",
    body: "Your reflections are encrypted and never used to train AI. This space belongs to you.",
  },
  {
    icon: Wind,
    title: "No pressure",
    body: "Skip a day, take a week off — we'll be here when you come back. No guilt, no streaks.",
  },
  {
    icon: Moon,
    title: "Calm by design",
    body: "Quiet colors, gentle copy, soft motion. Everything here is meant to lower your shoulders.",
  },
]

export default function Principles() {
  return (
    <section className="bg-white py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1419]">
            Built on four principles
          </h2>
          <p className="mt-4 text-lg text-[#536471]">
            Every decision in Prompt &amp; Pause comes back to these.
          </p>
        </div>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-80px" }}
          variants={{ show: { transition: { staggerChildren: 0.1 } } }}
          className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-6 sm:grid-cols-2"
        >
          {principles.map(({ icon: Icon, title, body }) => (
            <motion.div
              key={title}
              variants={{
                hidden: { opacity: 0, y: 16 },
                show: { opacity: 1, y: 0, transition: { duration: 0.5 } },
              }}
              className="flex gap-5 rounded-2xl border border-[#EFF3F4] bg-white p-6 shadow-sm"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F7F9FA] border border-[#EFF3F4]">
                <Icon className="h-5 w-5 text-[#1D9BF0]" />
              </span>
              <div>
                <h3 className="font-semibold text-[#0F1419]">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-[#536471]">{body}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
