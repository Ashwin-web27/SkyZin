"use client"

import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { SkyZin3DLogo } from "@/components/ui/skyzin-3d-logo"
import { Rocket, ArrowRight } from "lucide-react"
import { smoothScrollToSection } from "@/lib/smooth-scroll"

export function Hero() {
  const handleExploreTracksClick = () => {
    smoothScrollToSection('tracks');
  };

  return (
    <section id="home" className="container mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-10 sm:py-16 md:grid-cols-2">
      <div className="order-2 md:order-1">
        <h1 className="text-pretty text-3xl font-semibold leading-tight sm:text-4xl lg:text-5xl">
          Your Career starts
          <br />
          with the Right Skills.
        </h1>
        <p className="mt-3 max-w-xl text-sm text-white/70">
          Courses you love, a community that supports you, and credentials that matter. Learn by doing and get
          job‑ready.
        </p>

        <div className="mt-5 flex items-center gap-3">
          <Button asChild className="rounded-full bg-indigo-600 hover:bg-indigo-500">
            <Link href="/login">
              Get Now <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </Button>
          <Button 
            variant="outline" 
            className="rounded-full border border-white/15 bg-transparent text-white/80 hover:bg-white/10 hover:text-white"
            onClick={handleExploreTracksClick}
          >
            Explore Tracks
          </Button>
        </div>

        <div className="mt-6">
          <Progress value={68} className="h-2 rounded-full bg-white/10" />
          <p className="mt-2 text-xs text-white/60">Learning progress demo</p>
        </div>

        <ul className="mt-6 grid grid-cols-2 gap-4 text-sm text-white/80 sm:grid-cols-3">
          <li className="flex items-start gap-2">
            <span className="mt-1 rounded-md bg-white/10 p-2">
              <Rocket className="h-4 w-4 text-cyan-400" />
            </span>
            <div>
              <p className="font-medium">Learn Latest Skills</p>
              <p className="text-xs text-white/60">Stay current with industry tools and workflows.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 rounded-md bg-white/10 p-2">
              <svg className="h-4 w-4 text-cyan-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M7 12l3 3 7-7"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <div>
              <p className="font-medium">Earn Certificates</p>
              <p className="text-xs text-white/60">Build a portfolio that recruiters trust.</p>
            </div>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 rounded-md bg-white/10 p-2">
              <svg className="h-4 w-4 text-indigo-400" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M12 2v20M2 12h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </span>
            <div>
              <p className="font-medium">Get Job‑Ready</p>
              <p className="text-xs text-white/60">Hands‑on projects and interview prep.</p>
            </div>
          </li>
        </ul>
      </div>

      <div className="order-1 md:order-2 relative">
        {/* 3D SkyZin Logo - Main Feature */}
        <div className="flex items-center justify-center h-full min-h-[500px]">
          <SkyZin3DLogo />
        </div>
      </div>
    </section>
  )
}
