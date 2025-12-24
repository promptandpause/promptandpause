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
        <h3 className="uppercase mb-4">AI-Personalized Prompts</h3>
        <p className="text-2xl lg:text-4xl mb-8">
          Our AI learns your patterns and tailors daily prompts to your current mood, goals, and life challenges—whether
          it's job hunt anxiety or creative burnout. UK and US-focused support integrated with NHS and local mental health resources,
          designed for the unique stressors of modern life.
        </p>
        <Link href="/homepage/our-mission" className="bg-black text-white border border-black px-4 py-2 text-sm transition-all duration-300 hover:bg-white hover:text-black cursor-pointer w-fit inline-block text-center">
          LEARN MORE
        </Link>
      </div>
    </div>
  )
}
