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
            © 2026 Prompt &amp; Pause
          </span>
        </span>
      </nav>
    </footer>
  )
}
