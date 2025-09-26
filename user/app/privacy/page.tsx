"use client"

export default function PrivacyPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,#394867_20%,#0b1020_60%,#080c1a_100%)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/images/login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <section className="relative z-10 container mx-auto flex min-h-[100dvh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">Privacy Policy</h1>
          <div className="space-y-6 text-white/80 text-sm leading-relaxed">
            <p>
              At <strong>[Your Company Name]</strong>, we value your privacy. This policy explains how we collect, use,
              and protect your information.
            </p>

            <h2 className="text-lg font-semibold text-white">1. Information We Collect</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Name, email, phone number.</li>
              <li>Payment details (processed via PhonePe, not stored by us).</li>
              <li>Usage data like IP address, browser type, course activity.</li>
            </ul>

            <h2 className="text-lg font-semibold text-white">2. How We Use Your Data</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>To process payments and deliver services.</li>
              <li>To improve our platform and user experience.</li>
              <li>To send important updates and offers.</li>
            </ul>

            <h2 className="text-lg font-semibold text-white">3. Data Protection</h2>
            <p>We use encryption and secure methods. Sensitive payment details are handled only by PhonePe.</p>

            <h2 className="text-lg font-semibold text-white">4. Contact</h2>
            <p>
              For privacy concerns, email us at <strong>[your email]</strong>.
            </p>

            <p className="mt-6 text-center">
              <a href="/login" className="text-indigo-300 underline underline-offset-4">
                Back to Login
              </a>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
