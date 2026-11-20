'use client';

import { motion, useReducedMotion } from 'framer-motion';

export function AmbientClouds() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Cloud 1: High altitude, slow drift */}
      <motion.div
        className="absolute top-[4%] w-[38%] opacity-35"
        initial={{ x: '-120%' }}
        animate={{ x: ['-120%', '320%'] }}
        transition={{
          duration: 65,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg viewBox="0 0 160 60" fill="white" className="filter blur-[1.5px]">
          <path d="M20 45 Q 10 45 10 35 Q 10 25 25 25 Q 35 10 55 12 Q 75 8 95 20 Q 115 15 130 25 Q 150 28 145 42 Q 140 48 125 45 Z" />
        </svg>
      </motion.div>

      {/* Cloud 2: Lower fluffy cloud, slightly faster */}
      <motion.div
        className="absolute top-[12%] w-[46%] opacity-25"
        initial={{ x: '-140%' }}
        animate={{ x: ['-140%', '280%'] }}
        transition={{
          duration: 52,
          delay: 18,
          repeat: Infinity,
          ease: 'linear',
        }}
      >
        <svg viewBox="0 0 200 70" fill="white" className="filter blur-[2px]">
          <path d="M30 55 Q 15 55 15 40 Q 15 28 35 28 Q 50 12 75 14 Q 100 10 125 22 Q 150 18 168 30 Q 190 35 182 52 Q 175 58 150 55 Z" />
        </svg>
      </motion.div>
    </div>
  );
}
