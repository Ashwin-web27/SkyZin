"use client"

export default function RefundPolicyPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,#394867_20%,#0b1020_60%,#080c1a_100%)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/images/login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <section className="relative z-10 container mx-auto flex min-h-[100dvh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">Refund & Cancellation Policy</h1>
          <div className="space-y-6 text-white/80 text-sm leading-relaxed">
            <h2 className="text-lg font-semibold text-white">1. Course Purchases</h2>
            <p>
              All purchases are final. Refunds are only applicable in cases of duplicate payment or failed transaction
              with no access.
            </p>

            <h2 className="text-lg font-semibold text-white">2. Refund Process</h2>
            <p>
              Refund requests must be emailed to <strong>[skyzin2025@gmail.com]</strong>. Approved refunds will be processed within
              7–10 business days.
            </p>

            <h2 className="text-lg font-semibold text-white">3. Contact</h2>
            <p>For issues, contact us at [skyzin2025@gmail.com/ 8888116841 & 8767735164].</p>

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
