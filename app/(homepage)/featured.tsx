import { Feather, Lock, Clock } from "lucide-react"

const features = [
  {
    icon: Feather,
    title: "Gentle rhythm",
    body: "One prompt a day. No streaks, no anxiety — just a quiet moment when you want it.",
  },
  {
    icon: Lock,
    title: "Private by default",
    body: "Your reflections stay yours. Not used for training. Not shared. Just for you.",
  },
  {
    icon: Clock,
    title: "Five minutes",
    body: "Short enough for a morning coffee. Long enough to actually feel like a pause.",
  },
]

export default function Featured() {
  return (
    <section className="bg-[#F7F9FA] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#0F1419]">
            Why it works
          </h2>
          <p className="mt-4 text-lg text-[#536471]">
            Prompt &amp; Pause is built around a simple idea: reflection shouldn't feel like work.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-5xl grid-cols-1 gap-8 sm:grid-cols-3">
          {features.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex flex-col items-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white border border-[#EFF3F4] shadow-sm">
                <Icon className="h-6 w-6 text-[#1D9BF0]" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-[#0F1419]">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[#536471]">{body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
