export default function Promo() {
  return (
    <section className="bg-[#0F1419] py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            No hour-long sessions.
            <br />
            Just a few quiet minutes.
          </h2>
          <p className="mt-6 text-lg text-white/70 max-w-xl mx-auto">
            Something you can fit into a morning coffee or a lunch break. No pressure. No performance.
          </p>
        </div>
        <div className="mx-auto mt-16 grid max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3 border-t border-white/15 pt-12">
          {[
            { value: "5 min", label: "Daily ritual" },
            { value: "1", label: "Prompt per day" },
            { value: "0", label: "Likes or streaks" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-5xl font-bold text-white">{stat.value}</p>
              <p className="mt-2 text-sm text-white/60">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
