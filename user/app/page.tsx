import { Navbar } from "@/components/sections/navbar"
import { Hero } from "@/components/sections/hero"
import { Features } from "@/components/sections/features"
import { TracksSection } from "@/components/sections/tracks-section"
import { AboutSection } from "@/components/sections/about-section"
import { ServicesSection } from "@/components/sections/services-section"
import { ContactSection } from "@/components/sections/contact-section"
import { FooterSection } from "@/components/sections/footer-section"

export default function Page() {
  return (
    <main className="relative min-h-screen bg-[#0c0f1a] text-white">
      {/* Background accents to emulate glossy dark look */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(900px 400px at 50% 10%, rgba(99,102,241,0.20), transparent 60%), radial-gradient(700px 350px at 50% 45%, rgba(34,211,238,0.12), transparent 60%), radial-gradient(500px 300px at 50% 85%, rgba(255,255,255,0.06), transparent 60%), #0b1220",
        }}
      />
      <Navbar />
      <Hero />

      <section className="container mx-auto px-4 py-10 sm:py-14">
        <Features />
      </section>

      {/* New Sections */}
      <TracksSection />
      <AboutSection />
      <ServicesSection />
      <ContactSection />

      <FooterSection />
      
    </main>
  )
}
