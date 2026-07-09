import Link from "next/link"

const footerLinks = [
  { label: "About", href: "/our-mission" },
  { label: "Features", href: "/features" },
  { label: "Pricing", href: "/pricing" },
  { label: "Resources", href: "/research" },
  { label: "Help", href: "/contact" },
  { label: "Terms", href: "/terms-of-service" },
  { label: "Privacy", href: "/privacy-policy" },
  { label: "Cookies", href: "/cookie-policy" },
  { label: "Security", href: "/security" },
  { label: "Crisis Help", href: "/research#need-urgent-help" },
  { label: "Developers", href: "/support-us" },
  { label: "Accessibility", href: "/our-mission" },
]

export default function Footer() {
  return (
    <footer className="bg-white border-t border-[#EFF3F4] py-4 px-4">
      <nav
        aria-label="Footer"
        className="flex flex-wrap flex-row justify-center gap-x-1 gap-y-1 max-w-5xl mx-auto"
      >
        {footerLinks.map((link, i) => (
          <span key={link.label} className="flex items-center">
            <Link
              href={link.href}
              className="text-[11px] text-[#536471] hover:underline px-1 py-0.5 leading-none"
            >
              {link.label}
            </Link>
            {i < footerLinks.length - 1 && (
              <span className="text-[#536471] text-[11px] select-none">·</span>
            )}
          </span>
        ))}
        <span className="flex items-center">
          <span className="text-[11px] text-[#536471] px-1 py-0.5 leading-none">
            &copy; 2026 Prompt &amp; Pause
          </span>
        </span>
      </nav>
      <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center mt-3">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#8A9A8A]">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="h-4 w-4" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Zm0 3h.008v.008h-.008v-.008Z" />
            </svg>
            <span>FCA Regulated Partners</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#8A9A8A]">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>SSL Secured</span>
          </div>
          <div className="flex items-center gap-2 text-[11px] sm:text-xs text-[#8A9A8A]">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
            </svg>
            <span>GDPR Compliant</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
