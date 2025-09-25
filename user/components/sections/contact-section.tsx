'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Mail, MapPin, Phone, Clock, MessageCircle, Send } from 'lucide-react';

export function ContactSection() {
  const contactInfo = [
    {
      icon: Mail,
      title: 'Email Us',
      content: 'hello@SkyZin.com',
      subtitle: 'We reply within 24 hours',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Phone,
      title: 'Call Us',
      content: '+1 (555) 123-4567',
      subtitle: 'Mon-Fri, 9 AM - 6 PM EST',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: MapPin,
      title: 'Visit Us',
      content: '123 Tech Street, Silicon Valley',
      subtitle: 'CA 94000, United States',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Clock,
      title: 'Support Hours',
      content: '24/7 Online Support',
      subtitle: 'Always here to help',
      color: 'from-orange-500 to-red-500'
    }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Redirect to login for form submission
    window.location.href = '/login';
  };

  return (
    <section id="contact" className="py-20 bg-gradient-to-b from-slate-800/30 to-slate-900/50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">
            Get In Touch
          </h2>
          <p className="text-xl text-white/70 max-w-3xl mx-auto">
            Have questions about our courses or need help choosing the right learning path? 
            Our team is here to guide you on your journey to success.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Information */}
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-6">Let's Connect</h3>
              <p className="text-white/70 mb-8 leading-relaxed">
                Whether you're just starting your learning journey or looking to advance your career, 
                we're excited to help you achieve your goals. Reach out through any of these channels.
              </p>
            </div>

            {/* Contact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {contactInfo.map((info, index) => {
                const IconComponent = info.icon;
                
                return (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all duration-300 group"
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${info.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6 text-white" strokeWidth={2} />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">{info.title}</h4>
                    <p className="text-white/90 font-medium mb-1">{info.content}</p>
                    <p className="text-white/60 text-sm">{info.subtitle}</p>
                  </div>
                );
              })}
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-indigo-600/20 to-purple-600/20 rounded-2xl border border-indigo-500/30 p-6">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-cyan-400" />
                Quick Actions
              </h4>
              <div className="space-y-3">
                <Button asChild className="w-full bg-indigo-600 hover:bg-indigo-500 text-white justify-start">
                  <Link href="/login">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Start Live Chat
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full border-white/30 text-white hover:bg-white/10 justify-start">
                  <Link href="/login">
                    <Phone className="w-4 h-4 mr-2" />
                    Schedule Call
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20 p-8">
            <h3 className="text-2xl font-bold text-white mb-6">Send us a Message</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    First Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Your first name"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Last Name
                  </label>
                  <Input
                    type="text"
                    placeholder="Your last name"
                    className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Email Address
                </label>
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Subject
                </label>
                <Input
                  type="text"
                  placeholder="What can we help you with?"
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Message
                </label>
                <Textarea
                  placeholder="Tell us more about your inquiry..."
                  rows={4}
                  className="bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-cyan-400 resize-none"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-500 hover:to-purple-500 font-medium"
                size="lg"
              >
                <Send className="w-4 h-4 mr-2" />
                Send Message
              </Button>
            </form>

            <p className="text-white/60 text-xs mt-4 text-center">
              By submitting this form, you agree to our Terms of Service and Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}