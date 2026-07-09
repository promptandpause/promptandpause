import HeroSection from "./hero-section"
import Featured from "./featured"
import Principles from "./principles"
import Promo from "./promo"
import Cta from "./cta"
import Footer from "./footer"
import CookieConsent from "./CookieConsent"

export default function Home() {
  return (
    <main>
      <HeroSection />
      <Featured />
      <Principles />
      <Promo />
      <Cta />
      <Footer />
      <CookieConsent />
    </main>
  )
}
