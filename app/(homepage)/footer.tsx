import Link from "next/link"
import Image from "next/image"
import { Linkedin, Twitter, Instagram } from "lucide-react"

export default function Footer() {
  return (
    <footer className="relative bg-neutral-900 py-8 sm:py-8 lg:py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Desktop & Mobile: All Columns in Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 lg:gap-12 xl:gap-16 text-center lg:text-left">
              {/* Product Column */}
              <div className="flex flex-col gap-1.5 sm:gap-2 items-center lg:items-start">
                <h3 className="mb-1.5 sm:mb-2 uppercase text-neutral-400 text-xs sm:text-sm font-semibold">Product</h3>
                <Link
                  href="/features"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Features
                </Link>
                <Link
                  href="/pricing"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Pricing
                </Link>
                <Link
                  href="/our-mission"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Our Mission
                </Link>
                <Link
                  href="/research"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Research
                </Link>
              </div>

              {/* Resources Column */}
              <div className="flex flex-col gap-1.5 sm:gap-2 items-center lg:items-start">
                <h3 className="mb-1.5 sm:mb-2 uppercase text-neutral-400 text-xs sm:text-sm font-semibold">Resources</h3>
                <Link
                  href="/research"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Support
                </Link>
                <Link
                  href="/contact"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Contact
                </Link>
                <Link
                  href="/systems"
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
                  href="/contact#press"
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
                  href="/privacy-policy"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Privacy Policy
                </Link>
                <Link
                  href="/terms-of-service"
                  className="text-white/90 hover:text-white transition-colors duration-300 text-sm sm:text-base"
                >
                  Terms of Service
                </Link>
                <Link
                  href="/cookie-policy"
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
            <div className="flex flex-col items-center gap-2">
              <p className="text-white text-sm sm:text-base text-center">©2026 Prompt & Pause</p>
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={1.5}
                      stroke="currentColor"
                      className="h-4 w-4"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z"
                      />
                    </svg>
                    <span>FCA Regulated Partners</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path
                        fillRule="evenodd"
                        d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>SSL Secured</span>
                  </div>
                  <div className="flex items-center gap-2 text-[11px] sm:text-xs text-neutral-400">
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                      <path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span>GDPR Compliant</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

