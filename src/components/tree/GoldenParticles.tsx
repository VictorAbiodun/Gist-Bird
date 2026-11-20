'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface Particle {
  id: number;
  x: number; // percentage (canopy region: 45% - 95%)
  y: number; // percentage (canopy and tree height: 12% - 55%)
  size: number;
  duration: number;
  delay: number;
  maxOpacity: number;
}

export function GoldenParticles() {
  const shouldReduceMotion = useReducedMotion();
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles after mount to avoid hydration mismatch
    const items: Particle[] = Array.from({ length: 18 }).map((_, i) => ({
      id: i,
      x: 48 + Math.random() * 46, // 48% - 94% around the tree and canopy
      y: 12 + Math.random() * 45, // 12% - 57%
      size: 3 + Math.random() * 4.5, // 3px - 7.5px
      duration: 3.5 + Math.random() * 4,
      delay: i * 0.35 + Math.random() * 1.5,
      maxOpacity: 0.45 + Math.random() * 0.45,
    }));
    setParticles(items);
  }, []);

  if (shouldReduceMotion || particles.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, #FFF7B2 0%, #FFD700 65%, rgba(255, 215, 0, 0) 100%)',
            boxShadow: '0 0 6px 2px rgba(255, 215, 0, 0.45)',
          }}
          animate={{
            y: [0, -12 - (p.id % 6), 0],
            x: [0, (p.id % 2 === 0 ? 8 : -8), 0],
            opacity: [0.15, p.maxOpacity, 0.2],
            scale: [0.8, 1.25, 0.85],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}
