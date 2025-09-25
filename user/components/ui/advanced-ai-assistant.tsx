'use client';

import { useState, useEffect } from 'react';
import { Bot, Sparkles, BookOpen, Target, TrendingUp } from 'lucide-react';

export function AdvancedAIAssistant() {
  const [currentBot, setCurrentBot] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  const bots = [
    {
      id: 'mentor',
      icon: Bot,
      color: 'from-blue-500 to-cyan-500',
      name: 'AI Mentor',
      messages: [
        "🎯 I'll guide you to the perfect career path",
        "📈 Let's unlock your potential together",
        "🚀 Ready to accelerate your learning?",
      ]
    },
    {
      id: 'tutor',
      icon: BookOpen,
      color: 'from-purple-500 to-pink-500',
      name: 'AI Tutor',
      messages: [
        "📚 I have personalized courses just for you",
        "🧠 Let's make complex topics simple",
        "⚡ Quick learning, lasting results",
      ]
    },
    {
      id: 'coach',
      icon: Target,
      color: 'from-green-500 to-emerald-500',
      name: 'AI Coach',
      messages: [
        "🎯 Set goals, achieve milestones",
        "💪 I'll keep you motivated every step",
        "🏆 Success is just one course away",
      ]
    }
  ];

  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const botInterval = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentBot((prev) => (prev + 1) % bots.length);
        setMessageIndex(0);
        setIsAnimating(false);
      }, 500);
    }, 6000);

    const messageInterval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % bots[currentBot].messages.length);
    }, 2000);

    return () => {
      clearInterval(botInterval);
      clearInterval(messageInterval);
    };
  }, [currentBot, bots.length]);

  const currentBotData = bots[currentBot];
  const IconComponent = currentBotData.icon;

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Rotating Background Rings */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 rounded-full border border-cyan-400/20 animate-spin-slow"></div>
        <div className="absolute inset-4 rounded-full border border-purple-400/20 animate-reverse-spin-slow"></div>
        <div className="absolute inset-8 rounded-full border border-blue-400/20 animate-spin-slow"></div>
      </div>

      {/* Central AI Bot */}
      <div 
        className={`
          relative transition-all duration-500 ease-out transform
          ${isAnimating ? 'scale-110 rotate-12' : 'scale-100 rotate-0'}
        `}
      >
        {/* Main Bot Container */}
        <div className={`relative w-40 h-40 rounded-full bg-gradient-to-br ${currentBotData.color} shadow-2xl animate-float`}>
          {/* Glowing Aura */}
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${currentBotData.color} blur-xl opacity-50 animate-pulse`}></div>
          
          {/* Inner Glow */}
          <div className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"></div>
          
          {/* Bot Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <IconComponent className="w-16 h-16 text-white drop-shadow-lg animate-pulse" strokeWidth={1.5} />
          </div>

          {/* Floating Sparkles */}
          <div className="absolute inset-0">
            <Sparkles className="absolute top-4 right-8 w-4 h-4 text-yellow-300 animate-bounce" />
            <Sparkles className="absolute bottom-6 left-4 w-3 h-3 text-pink-300 animate-bounce" style={{ animationDelay: '1s' }} />
            <TrendingUp className="absolute top-8 left-6 w-3 h-3 text-green-300 animate-bounce" style={{ animationDelay: '2s' }} />
          </div>

          {/* Energy Particles */}
          <div className="absolute inset-0">
            <div className="absolute top-6 left-8 w-2 h-2 bg-cyan-400 rounded-full animate-ping"></div>
            <div className="absolute bottom-8 right-6 w-1.5 h-1.5 bg-purple-400 rounded-full animate-ping" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute top-12 right-4 w-1 h-1 bg-green-400 rounded-full animate-ping" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>

        {/* Bot Name Tag */}
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-4 py-1 shadow-lg border border-white/50">
            <p className="text-sm font-semibold text-gray-800">{currentBotData.name}</p>
          </div>
        </div>
      </div>

      {/* Dynamic Message Bubbles */}
      <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 w-72">
        <div 
          className={`
            relative bg-white/95 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-xl border border-white/30
            transition-all duration-500 ease-out transform
            ${isAnimating ? 'scale-95 opacity-70' : 'scale-100 opacity-100'}
          `}
        >
          <p className="text-sm font-medium text-gray-800 text-center">
            {currentBotData.messages[messageIndex]}
          </p>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2">
            <div className="w-0 h-0 border-l-[10px] border-r-[10px] border-t-[10px] border-l-transparent border-r-transparent border-t-white/95"></div>
          </div>
        </div>
      </div>

      {/* Bot Selector Dots */}
      <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {bots.map((bot, index) => (
          <button
            key={bot.id}
            onClick={() => setCurrentBot(index)}
            className={`
              w-3 h-3 rounded-full transition-all duration-300
              ${index === currentBot 
                ? `bg-gradient-to-r ${bot.color} shadow-lg scale-125` 
                : 'bg-white/50 hover:bg-white/70'
              }
            `}
          />
        ))}
      </div>
    </div>
  );
}