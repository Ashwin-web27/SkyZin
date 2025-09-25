'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Zap, Users, Shield, HeadphonesIcon, Trophy, Rocket } from 'lucide-react';

export function ServicesSection() {
  const services = [
    {
      icon: Zap,
      title: 'AI-Powered Learning',
      description: 'Get personalized course recommendations and adaptive learning paths powered by our AI assistant.',
      features: ['Smart course suggestions', 'Progress tracking', 'Difficulty adjustment', 'Learning analytics'],
      color: 'from-yellow-500 to-orange-500',
      popular: false
    },
    {
      icon: Users,
      title: 'Mentorship Program',
      description: 'Connect with industry experts who will guide you through your learning journey and career transitions.',
      features: ['1-on-1 mentoring', 'Career guidance', 'Code reviews', 'Interview prep'],
      color: 'from-blue-500 to-cyan-500',
      popular: true
    },
    {
      icon: Trophy,
      title: 'Certification Program',
      description: 'Earn industry-recognized certificates that validate your skills and boost your career prospects.',
      features: ['Verified certificates', 'LinkedIn integration', 'Employer recognition', 'Skill validation'],
      color: 'from-purple-500 to-pink-500',
      popular: false
    },
    {
      icon: Shield,
      title: 'Premium Support',
      description: '24/7 technical support and priority access to instructors for all your learning needs.',
      features: ['24/7 chat support', 'Priority responses', 'Technical assistance', 'Learning guidance'],
      color: 'from-green-500 to-emerald-500',
      popular: false
    },
    {
      icon: Rocket,
      title: 'Job placement',
      description: 'Get matched with top companies and receive support throughout your job search process.',
      features: ['Job matching', 'Resume building', 'Interview coaching', 'Salary negotiation'],
      color: 'from-indigo-500 to-purple-500',
      popular: true
    },
    {
      icon: HeadphonesIcon,
      title: 'Community Access',
      description: 'Join our vibrant learning community with forums, study groups, and networking events.',
      features: ['Study groups', 'Code challenges', 'Networking events', 'Peer learning'],
      color: 'from-teal-500 to-blue-500',
      popular: false
    }
  ];

  return (
    <section id="services" className="py-20 bg-gradient-to-b from-slate-900/50 to-slate-800/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Our Services
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Comprehensive learning solutions designed to accelerate your career growth and ensure your success in the tech industry.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const IconComponent = service.icon;
            
            return (
              <div
                key={index}
                className="group relative bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8 hover:bg-white/15 transition-all duration-300 hover:scale-105"
              >
                {/* Popular Badge */}
                {service.popular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-yellow-400 to-orange-500 text-black text-xs font-bold px-3 py-1 rounded-full">
                    Most Popular
                  </div>
                )}

                {/* Background Gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300 rounded-2xl`}></div>
                
                <div className="relative z-10">
                  {/* Icon */}
                  <div className={`w-16 h-16 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                    <IconComponent className="w-8 h-8 text-white" strokeWidth={2} />
                  </div>

                  {/* Content */}
                  <h3 className="text-xl font-bold text-white mb-4">{service.title}</h3>
                  <p className="text-white/70 mb-6 text-sm leading-relaxed">{service.description}</p>
                  
                  {/* Features List */}
                  <ul className="space-y-2 mb-6">
                    {service.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3 text-sm text-white/80">
                        <div className={`w-1.5 h-1.5 bg-gradient-to-r ${service.color} rounded-full`}></div>
                        {feature}
                      </li>
                    ))}
                  </ul>

                  {/* CTA Button */}
                  <Button asChild className={`w-full bg-gradient-to-r ${service.color} text-white border-0 hover:shadow-lg transition-all duration-300 font-medium`}>
                    <Link href="/login">
                      Learn More
                    </Link>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-3xl border border-indigo-500/30 p-8 md:p-12">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
              Ready to Transform Your Career?
            </h3>
            <p className="text-lg text-white/80 mb-8 max-w-2xl mx-auto">
              Join thousands of learners who have successfully launched their tech careers with SkyZin. 
              Our comprehensive services ensure you have everything you need to succeed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-indigo-600 hover:bg-indigo-500 text-white">
                <Link href="/login">
                  Start Free Trial
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10">
                <Link href="/login">
                  Schedule Demo
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}