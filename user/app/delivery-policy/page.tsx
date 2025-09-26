"use client"

export default function DeliveryPolicyPage() {
  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[radial-gradient(1200px_600px_at_50%_-10%,#394867_20%,#0b1020_60%,#080c1a_100%)] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-20"
        style={{ backgroundImage: "url('/images/login.png')", backgroundSize: "cover", backgroundPosition: "center" }}
        aria-hidden="true"
      />
      <section className="relative z-10 container mx-auto flex min-h-[100dvh] items-center justify-center px-4 py-16">
        <div className="w-full max-w-3xl rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-md">
          <h1 className="mb-6 text-center text-3xl font-semibold tracking-wide">Delivery Policy</h1>
          <div className="space-y-6 text-white/80 text-sm leading-relaxed">
            <h2 className="text-lg font-semibold text-white">1. Digital Products</h2>
            <p>All services (courses, videos, content) are delivered instantly online after payment confirmation.</p>

            <h2 className="text-lg font-semibold text-white">2. Delivery Timeline</h2>
            <p>Access is typically provided immediately. In case of issues, it may take up to 24 hours.</p>

            <h2 className="text-lg font-semibold text-white">3. No Physical Shipping</h2>
            <p>We only provide digital services, no physical delivery involved.</p>

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
