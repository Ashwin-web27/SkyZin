"use client"

import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { smoothScrollToSection, navigationItems } from "@/lib/smooth-scroll"
import { useActiveSection } from "@/hooks/use-active-section"
import Image from "next/image"

export function Navbar() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const activeSection = useActiveSection()

  return (
    <header className="container mx-auto px-4 py-2">
      <div className="flex items-center justify-between gap-8 h-20">
        {/* Logo Section - Clean */}
        <div className="flex items-center min-w-[200px] flex-shrink-0">
          <div className="relative w-20 h-20 md:w-40 md:h-">
            <Image
              src="/placeholder-logo.png"
              alt="Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
        
        {/* Navigation Menu - Separate Center Section */}
        <nav className="hidden md:flex items-center gap-1 rounded-full border border-white/20 bg-slate-800/40 shadow-lg px-6 py-3 backdrop-blur-md flex-1 justify-center max-w-lg mx-6">
          <div className="flex items-center gap-1">
            {navigationItems.map((item) => (
              <button 
                key={item.sectionId}
                onClick={() => smoothScrollToSection(item.sectionId)}
                className={`rounded-full px-4 py-2 text-sm transition font-medium whitespace-nowrap ${
                  activeSection === item.sectionId 
                    ? 'bg-indigo-600/80 text-white shadow-lg ring-2 ring-indigo-400/50' 
                    : 'text-slate-200 hover:bg-slate-700/60 hover:text-white'
                }`}
              >
                {item.name}
              </button>
            ))}
          </div>
        </nav>

        {/* Action Buttons - Separate Right Section */}
        <div className="hidden sm:flex items-center gap-3 min-w-[220px] justify-end flex-shrink-0">
          <div className="flex items-center gap-2 p-1 rounded-full bg-slate-800/30 border border-slate-600/30 backdrop-blur-sm">
            <Button asChild size="sm" variant="ghost" className="rounded-full text-slate-200 hover:bg-slate-700/60 hover:text-white">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="rounded-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 shadow-lg">
              <Link href="/signup">Create Account</Link>
            </Button>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="sm:hidden bg-white/10 text-white hover:bg-white/20"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 sm:hidden" onClick={() => setIsMobileMenuOpen(false)} />
          <div className="fixed top-0 right-0 h-full w-64 bg-[#0b1020]/95 backdrop-blur border-l border-white/10 z-50 sm:hidden">
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12">
                    <Image
                      src="/placeholder-logo.png"
                      alt="Logo"
                      fill
                      className="object-contain"
                    />
                  </div>
                  <span className="text-lg font-semibold">Menu</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="text-white hover:bg-white/10"
                >
                  <X size={20} />
                </Button>
              </div>

              <div className="space-y-2">
                {navigationItems.map((item) => (
                  <button
                    key={item.sectionId}
                    className={`block w-full text-left px-3 py-2 rounded-md transition ${
                      activeSection === item.sectionId 
                        ? 'bg-white/20 text-white shadow-lg' 
                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => {
                      smoothScrollToSection(item.sectionId);
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.name}
                  </button>
                ))}
              </div>

              <div className="pt-4 border-t border-white/10 space-y-2">
                <Button
                  asChild
                  variant="ghost"
                  className="w-full justify-start text-white/90 hover:bg-white/10"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button
                  asChild
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-500"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href="/signup">Create Account</Link>
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}
