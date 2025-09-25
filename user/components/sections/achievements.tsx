"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { ShieldCheck, Users, Target, Lightbulb } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalInstructors: number;
  totalPayments: number;
  monthlyRevenue: number;
}

export function Achievements() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Use public endpoint or create a public stats endpoint
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/users/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error("Error fetching stats:", error);
        // Don't show error toast for stats as it's not critical for UX
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  const getAchievements = () => {
    if (!stats) {
      // Fallback to static content when stats not available
      return [
        {
          title: "Trusted by Students",
          desc: "Learners from around the world have completed our hands‑on projects.",
          icon: <Users className="h-5 w-5 text-cyan-400" />,
        },
        {
          title: "Quality Courses",
          desc: "Recognized for clear structure, support, and industry relevance.",
          icon: <ShieldCheck className="h-5 w-5 text-indigo-400" />,
        },
        {
          title: "Growing Community",
          desc: "Building a supportive learning environment for all skill levels.",
          icon: <Target className="h-5 w-5 text-white/90" />,
        },
        {
          title: "Expert Instructors",
          desc: "Learn from experienced professionals with real-world expertise.",
          icon: <Lightbulb className="h-5 w-5 text-white/90" />,
        },
      ];
    }

    return [
      {
        title: `${stats.totalUsers.toLocaleString()} Students`,
        desc: "Learners from around the world trust our educational platform.",
        icon: <Users className="h-5 w-5 text-cyan-400" />,
      },
      {
        title: `${stats.totalCourses} Active Courses`,
        desc: "Comprehensive curriculum covering multiple domains and skill levels.",
        icon: <ShieldCheck className="h-5 w-5 text-indigo-400" />,
      },
      {
        title: `${stats.totalPayments.toLocaleString()} Enrollments`,
        desc: "Successful course completions and ongoing learning journeys.",
        icon: <Target className="h-5 w-5 text-white/90" />,
      },
      {
        title: `${stats.totalInstructors} Expert Instructors`,
        desc: "Professional educators with real-world industry experience.",
        icon: <Lightbulb className="h-5 w-5 text-white/90" />,
      },
    ];
  };

  const achievements = getAchievements();

  const goals = [
    { title: "Practical Skills", desc: "Project‑based learning with code reviews and feedback." },
    { title: "Problem Solving", desc: "Challenges that mirror real product constraints." },
    { title: "Community", desc: "Peer support, showcase days, and alumni network." },
    { title: "Stay Ahead", desc: "Continual updates as tools and frameworks evolve." },
  ]

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-sm uppercase tracking-wide text-white/60">About Online Education</h3>
          <h2 className="mt-2 text-2xl font-semibold">Achievements</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-white/5">
                <CardHeader className="flex flex-row items-center gap-3">
                  <Skeleton className="h-9 w-9 rounded-md" />
                  <Skeleton className="h-5 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
        <div>
          <h2 className="mb-4 text-2xl font-semibold">Our Goals</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="border-white/10 bg-white/5">
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3 mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-sm uppercase tracking-wide text-white/60">About Online Education</h3>
        <h2 className="mt-2 text-2xl font-semibold">Achievements</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {achievements.map((a) => (
            <Card key={a.title} className="border-white/10 bg-white/5">
              <CardHeader className="flex flex-row items-center gap-3">
                <span className="rounded-md bg-white/10 p-2">{a.icon}</span>
                <CardTitle className="text-base">{a.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70">{a.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-4 text-2xl font-semibold">Our Goals</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {goals.map((g) => (
            <Card key={g.title} className="border-white/10 bg-white/5">
              <CardHeader>
                <CardTitle className="text-base">{g.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-white/70">{g.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
