import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function Services() {
  const services = [
    { title: "Interview Workshops", img: "/interview-workshop-speaker.jpg" },
    { title: "1:1 Mentorship", img: "/mentorship-session.png" },
    { title: "Career Coaching", img: "/career-advice-portrait.jpg" },
    { title: "Project Reviews", img: "/code-review-session.png" },
  ]
  return (
    <div>
      <h2 className="mb-6 text-2xl font-semibold">Our Services</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {services.map((s) => (
          <Card key={s.title} className="border-white/10 bg-white/5">
            <CardHeader className="p-0">
              <Image
                src={s.img || "/placeholder.svg"}
                alt={s.title}
                width={640}
                height={160}
                className="h-40 w-full rounded-t-xl object-cover"
              />
            </CardHeader>
            <CardContent className="p-4">
              <CardTitle className="text-base">{s.title}</CardTitle>
              <p className="mt-1 text-sm text-white/70">Practical sessions designed to boost your confidence.</p>
            </CardContent>
            <CardFooter className="p-4 pt-0">
              <Button size="sm" variant="secondary" className="rounded-full bg-white/10 text-white hover:bg-white/20">
                Learn more
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
