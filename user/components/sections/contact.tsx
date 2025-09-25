"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export function Contact() {
  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-semibold">Contact Us</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-white/70">
            <p>We&apos;re here to help you choose the right path.</p>
            <p>Email: hello@SkyZin.io</p>
            <p>Phone: +1 (555) 010‑1010</p>
            <p>Hours: Mon–Fri, 9am–5pm</p>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-white/5">
          <CardHeader>
            <CardTitle>Send a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => e.preventDefault()} className="grid gap-3" aria-label="Contact form">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input placeholder="First name" aria-label="First name" />
                <Input placeholder="Last name" aria-label="Last name" />
              </div>
              <Input type="email" placeholder="Email address" aria-label="Email address" />
              <Textarea placeholder="Your message..." aria-label="Message" className="min-h-28" />
              <Button type="submit" className="rounded-full bg-indigo-600 hover:bg-indigo-500">
                Send Message
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
