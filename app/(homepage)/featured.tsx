import Image from "next/image"
import Link from "next/link"

export default function Featured() {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center min-h-screen px-6 py-12 lg:py-0">
      <div className="flex-1 h-[400px] lg:h-[800px] mb-8 lg:mb-0 lg:order-2">
        <Image
          src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766469858/ivan-sitting-glear_t7agby.jpg"
          alt="Person reflecting with journal in peaceful setting"
          width={600}
          height={800}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 text-left lg:h-[800px] flex flex-col justify-center lg:mr-12 lg:order-1">
        <h3 className="uppercase mb-4">One thoughtful question</h3>
        <p className="text-2xl lg:text-4xl mb-8">
          Prompt &amp; Pause gives you a single prompt at a time—so your attention stays on what matters, not on metrics.
          Write privately, at your own pace, and return when you want a little more perspective.
        </p>
        <Link href="/our-mission" className="bg-black text-white border border-black px-4 py-2 text-sm transition-all duration-300 hover:bg-white hover:text-black cursor-pointer w-fit inline-block text-center">
          LEARN MORE
        </Link>
      </div>
    </div>
  )
}

