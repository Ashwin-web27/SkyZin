'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Code2, Palette, BarChart3, Smartphone, Globe, Database } from 'lucide-react';

export function TracksSection() {
  const tracks = [
    {
      id: 'web-dev',
      title: 'Web Development',
      description: 'Master modern web technologies and build amazing applications',
      icon: Globe,
      color: 'from-blue-500 to-cyan-500',
      courses: '25+ Courses',
      level: 'Beginner to Expert'
    },
    {
      id: 'mobile-dev',
      title: 'Mobile Development',
      description: 'Create stunning mobile apps for iOS and Android',
      icon: Smartphone,
      color: 'from-green-500 to-emerald-500',
      courses: '18+ Courses',
      level: 'Intermediate'
    },
    {
      id: 'data-science',
      title: 'Data Science',
      description: 'Analyze data, build models, and drive insights',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500',
      courses: '22+ Courses',
      level: 'All Levels'
    },
    {
      id: 'ui-ux',
      title: 'UI/UX Design',
      description: 'Design beautiful and user-friendly interfaces',
      icon: Palette,
      color: 'from-orange-500 to-red-500',
      courses: '15+ Courses',
      level: 'Beginner to Pro'
    },
    {
      id: 'programming',
      title: 'Programming',
      description: 'Learn programming fundamentals and advanced concepts',
      icon: Code2,
      color: 'from-indigo-500 to-purple-500',
      courses: '30+ Courses',
      level: 'All Levels'
    },
    {
      id: 'databases',
      title: 'Database Management',
      description: 'Master SQL, NoSQL, and database optimization',
      icon: Database,
      color: 'from-teal-500 to-blue-500',
      courses: '12+ Courses',
      level: 'Intermediate to Expert'
    }
  ];

  return (
    <section id="tracks" className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-800/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Explore Learning Tracks
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Choose from our carefully curated learning paths designed to take you from beginner to expert in your chosen field.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {tracks.map((track) => {
            const IconComponent = track.icon;
            
            return (
              <div
                key={track.id}
                className="group relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${track.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300 rounded-2xl`}></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${track.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-3">{track.title}</h3>
                  <p className="text-white/70 mb-4 text-sm leading-relaxed">{track.description}</p>
                  
                  {/* Stats */}
                  <div className="flex justify-between items-center mb-6 text-sm">
                    <span className="text-cyan-400 font-medium">{track.courses}</span>
                    <span className="text-white/60">{track.level}</span>
                  </div>

                  {/* CTA Button */}
                  <Button asChild className={`w-full bg-gradient-to-r ${track.color} text-white border-0 hover:shadow-lg transition-all duration-300`}>
                    <Link href="/login">
                      Start Learning
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white">
            <Link href="/login">
              View All Tracks
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}