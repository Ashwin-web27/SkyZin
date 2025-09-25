'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function SkyZin3DLogo() {
  const [isHovered, setIsHovered] = useState(false);
  const [animationPhase, setAnimationPhase] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setAnimationPhase((prev) => (prev + 1) % 3);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative w-80 h-80 flex items-center justify-center">
      {/* Ambient Glow */}
      <motion.div
        className="absolute inset-0 rounded-full blur-3xl bg-gradient-to-r from-yellow-400/30 via-orange-500/40 to-amber-600/30"
        animate={{
          opacity: [0.4, 0.8, 0.4],
          scale: [0.8, 1.2, 0.8],
        }}
        transition={{ repeat: Infinity, duration: 6, ease: 'easeInOut' }}
      />

      {/* Main Logo Container */}
      <motion.div
        className="relative cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        initial={{ rotateY: 0 }}
        animate={{
          rotateY: isHovered ? 360 : 0,
          scale: isHovered ? 1.1 : 1,
        }}
        transition={{
          rotateY: { duration: 2, ease: 'easeInOut' },
          scale: { duration: 0.3 },
        }}
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* Uploaded Image instead of SVG */}
        <motion.div
          className="relative w-64 h-64"
          animate={{
            rotateZ: [0, 5, -5, 0],
            scale:
              animationPhase === 0
                ? [1, 1.05, 1]
                : animationPhase === 1
                ? [1, 0.95, 1]
                : [1, 1.02, 1],
          }}
          transition={{
            rotateZ: { repeat: Infinity, duration: 8, ease: 'easeInOut' },
            scale: { duration: 2, ease: 'easeInOut' },
          }}
        >
          <Image
            src="/SkyZin.png" // <-- place your uploaded image in the public/ folder
            alt="SkyZin Logo"
            width={300}
            height={300}
            className="drop-shadow-2xl rounded-lg"
          />
        </motion.div>

        {/* Floating Particles */}
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-yellow-400 rounded-full"
              style={{
                left: `${20 + i * 10}%`,
                top: `${30 + (i % 2) * 40}%`,
              }}
              animate={{
                y: [-20, -40, -20],
                opacity: [0, 1, 0],
                scale: [0, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 3,
                delay: i * 0.5,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* SkyZin Text with 3D effect */}
      <motion.div
        className="absolute -bottom-16 left-1/2 transform -translate-x-1/2"
        animate={{
          scale: isHovered ? 1.1 : 1,
          rotateX: isHovered ? 5 : 0,
        }}
        transition={{ duration: 0.3 }}
        style={{ transformStyle: 'preserve-3d' }}
      >

        

        
      </motion.div>

      {/* Ripple Effect */}
      {isHovered && (
        <motion.div
          className="absolute inset-0 rounded-full border-4 border-yellow-400/50"
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 2, opacity: [0, 1, 0] }}
          transition={{ duration: 1.5 }}
        />
      )}
    </div>
  );
}
