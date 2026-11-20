'use client';

import { useEffect, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

interface LeafData {
  id: number;
  startX: number; // percentage (55% - 95% from canopy)
  startY: number; // percentage (8% - 32% from canopy)
  size: number;
  color: string;
  duration: number;
  delay: number;
  swayAmount: number;
  initialRotate: number;
}

const LEAF_COLORS = [
  '#2F7543', // deep forest green
  '#3A8E51', // classic storybook leaf green
  '#48A763', // bright canopy green
  '#72B35B', // fresh olive lime
  '#86C566', // sunlight gold-green
  '#56964E', // vibrant woodland green
];

export function FallingLeaves() {
  const shouldReduceMotion = useReducedMotion();
  const [leaves, setLeaves] = useState<LeafData[]>([]);

  useEffect(() => {
    // Generate randomized independent leaves after mount to avoid hydration mismatch
    const generated: LeafData[] = Array.from({ length: 14 }).map((_, i) => ({
      id: i,
      startX: 55 + Math.random() * 38, // 55% - 93% (tree canopy region on the right)
      startY: 8 + Math.random() * 26,  // 8% - 34% (upper canopy branches)
      size: 14 + Math.random() * 12,   // 14px - 26px
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      duration: 7.5 + Math.random() * 6, // 7.5s - 13.5s natural fall duration
      delay: i * 0.85 + Math.random() * 1.5,
      swayAmount: 25 + Math.random() * 35, // 25px - 60px drift
      initialRotate: Math.random() * 360,
    }));
    setLeaves(generated);
  }, []);

  if (shouldReduceMotion || leaves.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            left: `${leaf.startX}%`,
            top: `${leaf.startY}%`,
            width: leaf.size,
            height: leaf.size * 1.4,
          }}
          initial={{
            opacity: 0,
            y: 0,
            x: 0,
            rotate: leaf.initialRotate,
            rotateX: 0,
            rotateY: 0,
          }}
          animate={{
            opacity: [0, 0.95, 0.9, 0.8, 0],
            y: ['0%', '250%', '550%', '850%', '1150%'],
            x: [
              0,
              -leaf.swayAmount * 0.7,
              leaf.swayAmount * 0.5,
              -leaf.swayAmount * 0.9,
              leaf.swayAmount * 0.4,
            ],
            rotate: [leaf.initialRotate, leaf.initialRotate + 180, leaf.initialRotate + 360],
            rotateX: [0, 180, 360, 540],
            rotateY: [0, 120, 240, 360],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {/* Detailed SVG leaf with stem and natural bevel */}
          <svg
            viewBox="0 0 24 34"
            width="100%"
            height="100%"
            className="filter drop-shadow-[0_2px_4px_rgba(10,50,20,0.18)]"
          >
            <path
              d="M12 2 C18 8, 22 17, 18 26 C15 30, 12 32, 12 33 C12 32, 9 30, 6 26 C2 17, 6 8, 12 2 Z"
              fill={leaf.color}
            />
            {/* Subtle central vein */}
            <path
              d="M12 4 C12 12, 12 24, 12 31"
              stroke="rgba(255, 255, 255, 0.35)"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            {/* Delicate side branch veins */}
            <path
              d="M12 12 Q 16 10 18 13 M12 17 Q 7 15 5 18 M12 22 Q 16 20 17 23"
              stroke="rgba(255, 255, 255, 0.22)"
              strokeWidth="0.9"
              strokeLinecap="round"
            />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}
