import { Button } from "@/components/ui/button"

export function CtaBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-r from-white/10 to-white/5 px-6 py-10">
      <div className="max-w-3xl">
        <h3 className="text-pretty text-2xl font-semibold">
          Together, let&apos;s shape the future of digital innovation
        </h3>
        <p className="mt-2 text-sm text-white/70">
          Join a community of learners and mentors building real products with modern tools.
        </p>
      </div>
      <div className="mt-6">
        <Button className="rounded-full bg-indigo-600 hover:bg-indigo-500">Get Started</Button>
      </div>
    </div>
  )
}
