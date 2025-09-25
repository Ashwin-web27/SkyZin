import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, Award, Briefcase } from "lucide-react"

export function Features() {
  const items = [
    {
      icon: <GraduationCap className="h-5 w-5 text-cyan-400" />,
      title: "Learn the Latest Skills",
      desc: "Curriculum updated with modern frameworks, tools, and practices.",
    },
    {
      icon: <Award className="h-5 w-5 text-indigo-400" />,
      title: "Earn a Certificate",
      desc: "Shareable certificates to showcase your progress and expertise.",
    },
    {
      icon: <Briefcase className="h-5 w-5 text-slate-900" />,
      title: "Get Ready for a Career",
      desc: "Portfolio projects, mentorship, and interview preparation.",
    },
  ]

  return (
    <div>
      <h2 className="mb-6 text-center text-2xl font-semibold">Key Benefits</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Card key={it.title} className="border-slate-200 bg-white text-slate-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-slate-900">
                <span className="rounded-md bg-slate-100 p-2">{it.icon}</span> {it.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-600">{it.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
