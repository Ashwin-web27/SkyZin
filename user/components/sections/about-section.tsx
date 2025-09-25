'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Users, Award, BookOpen, TrendingUp } from 'lucide-react';

export function AboutSection() {
  const stats = [
    {
      icon: Users,
      value: '50,000+',
      label: 'Active Learners',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: BookOpen,
      value: '200+',
      label: 'Expert Courses',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Award,
      value: '95%',
      label: 'Success Rate',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: TrendingUp,
      value: '4.8/5',
      label: 'Average Rating',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const features = [
    {
      title: 'AI-Powered Learning',
      description: 'Our AI assistant personalizes your learning experience based on your interests and progress.',
      highlight: 'Personalized paths'
    },
    {
      title: 'Industry Experts',
      description: 'Learn from professionals who have built real products and worked at top tech companies.',
      highlight: 'Real-world experience'
    },
    {
      title: 'Hands-On Projects',
      description: 'Build portfolio-worthy projects that demonstrate your skills to potential employers.',
      highlight: 'Portfolio ready'
    },
    {
      title: 'Career Support',
      description: 'Get interview preparation, resume reviews, and job placement assistance.',
      highlight: 'Job guarantee'
    }
  ];

  return (
    <section id="about" className="py-20 bg-gradient-to-b from-slate-800/30 to-slate-900/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            About SkyZin
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            We're on a mission to make quality education accessible to everyone. Our platform combines cutting-edge technology with expert instruction to help you launch your career.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            
            return (
              <div
                key={index}
                className="text-center group hover:scale-105 transition-transform duration-300"
              >
                <div className={`w-16 h-16 bg-gradient-to-br ${stat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:shadow-lg transition-all duration-300`}>
                  <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-white mb-2">{stat.value}</div>
                <div className="text-white/60 text-sm">{stat.label}</div>
              </div>
            );
          })}
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300"
            >
              <div className="flex items-start gap-4">
                <div className="bg-indigo-600 rounded-lg p-2 flex-shrink-0">
                  <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse"></div>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                  <p className="text-white/70 mb-4">{feature.description}</p>
                  <div className="inline-block bg-gradient-to-r from-cyan-400/20 to-blue-400/20 rounded-full px-3 py-1 text-sm text-cyan-400 border border-cyan-400/30">
                    {feature.highlight}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Mission Statement */}
        <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl border border-indigo-500/30 p-8 md:p-12 text-center">
          <h3 className="text-2xl md:text-3xl font-bold text-white mb-6">
            Our Mission
          </h3>
          <p className="text-lg text-white/80 mb-8 max-w-4xl mx-auto leading-relaxed">
            We believe that everyone deserves access to high-quality education that can transform their career. 
            Our platform combines the latest in AI technology with expert instruction to create personalized 
            learning experiences that adapt to your pace and style.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white">
              <Link href="/login">
                Start Your Journey
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
              <Link href="/login">
                Meet Our Team
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}