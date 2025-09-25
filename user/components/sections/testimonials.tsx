"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

const DATA = [
  {
    quote: "The lessons were practical and engaging. I built a real project and landed my first interview.",
    name: "Alex M.",
  },
  {
    quote: "Clear explanations and supportive mentors. The portfolio guidance made all the difference.",
    name: "Zoe R.",
  },
  {
    quote: "Loved the community! Weekly reviews kept me accountable and improved my skills fast.",
    name: "Daniel K.",
  },
]

export function Testimonials() {
  const [i, setI] = useState(0)

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-semibold">What Students Say</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {DATA.map((t, idx) => (
          <Card
            key={t.name}
            className={`border-white/10 bg-white/5 transition ${idx === i ? "ring-1 ring-indigo-500/40" : ""}`}
          >
            <CardContent className="p-5">
              <p className="text-sm text-white/80">“{t.quote}”</p>
              <p className="mt-4 text-xs text-white/60">— {t.name}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex justify-center gap-2">
        {DATA.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setI(idx)}
            aria-label={`Show testimonial ${idx + 1}`}
            className={`h-2 w-2 rounded-full ${i === idx ? "bg-indigo-500" : "bg-white/30"}`}
          />
        ))}
      </div>
    </div>
  )
}
