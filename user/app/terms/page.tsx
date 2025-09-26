"use client"

export default function TermsPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,#394867_20%,#0b1020_60%,#080c1a_100%)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/images/login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <section className="relative z-10 container mx-auto flex min-h-[100dvh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">Terms & Conditions</h1>
          <div className="space-y-6 text-white/80 text-sm leading-relaxed">
            <p>
              Welcome to <strong>[Your Company Name]</strong>. By using our website/app, you agree to these Terms &
              Conditions.
            </p>

            <h2 className="text-lg font-semibold text-white">1. Services</h2>
            <p>We provide an e-learning platform where users can register, purchase, and access educational content.</p>

            <h2 className="text-lg font-semibold text-white">2. User Responsibilities</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Provide accurate registration details.</li>
              <li>Maintain confidentiality of your account.</li>
              <li>Do not misuse the platform for unlawful purposes.</li>
            </ul>

            <h2 className="text-lg font-semibold text-white">3. Payments</h2>
            <p>
              Payments are securely processed via PhonePe. We are not responsible for delays/errors caused by banks or
              the payment gateway.
            </p>

            <h2 className="text-lg font-semibold text-white">4. Refunds</h2>
            <p>Refunds are subject to our Refund & Cancellation Policy.</p>

            <h2 className="text-lg font-semibold text-white">5. Governing Law</h2>
            <p>These Terms shall be governed by the laws of India.</p>

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
