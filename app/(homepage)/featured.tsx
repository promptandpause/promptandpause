import Image from "next/image"
import Link from "next/link"

export default function Featured() {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0 bg-[#F5F3EE]">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469858/ivan-sitting-glear_t7agby.jpg"
          alt="Person reflecting with journal in peaceful setting"
          width={600}
          height={800}
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4 text-sm tracking-[0.18em] text-[#6B7F6E] font-semibold">One thoughtful question</h3>
        <p className="text-2xl lg:text-4xl mb-8 text-[#2F3B34]">
          Prompt &amp; Pause gives you a single prompt at a time—so your attention stays on what matters, not on metrics.
          <span className="text-[#4A5A49]"> Write privately, at your own pace, and return when you want a little more perspective.</span>
        </p>
        <Link href="/our-mission" className="bg-gradient-to-r from-[#6FA984] to-[#5A8F6E] text-white px-6 py-3 text-sm font-semibold rounded-xl transition-all duration-300 hover:from-[#5E9876] hover:to-[#4F7C5F] hover:shadow-lg hover:shadow-[#6FA984]/30 cursor-pointer w-fit inline-block text-center">
          LEARN MORE
        </Link>
      </div>
    </div>
  )
}

