import Link from "next/link"
import Image from "next/image"
import { Linkedin, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <div
      className="relative h-auto min-h-[700px] sm:h-[600px] lg:h-[800px]"
      style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
    >
      <div className="relative h-[calc(100vh+700px)] sm:h-[calc(100vh+600px)] lg:h-[calc(100vh+800px)] -top-[100vh]">
        <div className="h-auto min-h-[700px] sm:h-[600px] lg:h-[800px] sticky top-[calc(100vh-700px)] sm:top-[calc(100vh-600px)] lg:top-[calc(100vh-800px)]">
          <div className="bg-neutral-900 py-8 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8 h-full w-full flex flex-col justify-between">
            {/* Desktop & Mobile: All Columns in Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 text-center lg:text-left">
              {/* Product Column */}
              <div className="flex flex-col gap-1.5 sm:gap-2 items-center lg:items-start">
                <h3 className="mb-1.5 sm:mb-2 uppercase text-neutral-400 text-xs sm:text-sm font-semibold">Product</h3>
                <Link
                  href="/homepage/features"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Features
                </Link>
                <Link
                  href="/homepage/pricing"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Pricing
                </Link>
                <Link
                  href="/homepage/our-mission"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Our Mission
                </Link>
                <Link
                  href="/homepage/research"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Research
                </Link>
              </div>

              {/* Resources Column */}
              <div className="flex flex-col gap-1.5 sm:gap-2 items-center lg:items-start">
                <h3 className="mb-1.5 sm:mb-2 uppercase text-neutral-400 text-xs sm:text-sm font-semibold">Resources</h3>
                <Link
                  href="/homepage/research"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Support
                </Link>
                <Link
                  href="/homepage/contact"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Contact
                </Link>
                <Link
                  href="/homepage/systems"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  System Status
                </Link>
                <Link
                  href="#"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Blog
                </Link>
                <Link
                  href="/homepage/contact#press"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Press Kit
                </Link>
              </div>

              {/* Crisis Resources - All Devices */}
              <div className="flex flex-col gap-1.5 sm:gap-2 items-center lg:items-start lg:min-w-[200px]">
                <h3 className="mb-1.5 sm:mb-2 uppercase text-red-400 text-xs sm:text-sm font-semibold">Crisis Resources</h3>
                <p className="text-white/90 text-sm sm:text-base">UK: Samaritans 116 123</p>
                <p className="text-white/90 text-sm sm:text-base">UK: NHS 111</p>
                <p className="text-white/90 text-sm sm:text-base">US: 988 Lifeline</p>
                <p className="text-white/90 text-sm sm:text-base">US: Crisis Text 741741</p>
                <p className="text-red-500 text-xs mt-2 font-medium">Not a crisis service</p>
              </div>

              {/* Legal & Social Column */}
              <div className="flex flex-col gap-1.5 sm:gap-2 items-center lg:items-start">
                <h3 className="mb-1.5 sm:mb-2 uppercase text-neutral-400 text-xs sm:text-sm font-semibold">Legal</h3>
                <Link
                  href="/homepage/privacy-policy"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/homepage/terms-of-service"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/homepage/cookie-policy"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Cookie Policy
                </Link>
                <div className="flex gap-3 mt-3">
                  <a
                    href="https://linkedin.com/promptandpause"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors duration-300"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                  <a
                    href="https://twitter.com/promptandpause"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors duration-300"
                    aria-label="Twitter/X"
                  >
                    <Twitter className="w-5 h-5" />
                  </a>
                  <a
                    href="https://instagram.com/promptandpause"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors duration-300"
                    aria-label="Instagram"
                  >
                    <Instagram className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center items-center gap-4 sm:gap-0 mt-8">
              <div className="flex flex-col items-center gap-3">
                <div className="relative h-24 sm:h-24 lg:h-32 w-64 sm:w-80 lg:w-96">
                  <Image
                    src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/logo-mIsk3V4EJtLDHE4QyKtcshcClQ8y4E_cmlt8i.svg"
                    alt="Prompt & Pause"
                    fill
                    className="object-contain object-center invert"
                  />
                </div>
                <p className="text-white text-sm sm:text-base text-center">©2025 Prompt & Pause</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
