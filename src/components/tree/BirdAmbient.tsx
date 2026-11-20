'use client';

import { motion, useReducedMotion } from 'framer-motion';

/**
 * Subtle sunlight glint / glisten on Chief Coo's sunglasses lens
 * Positioned precisely at the sunglasses location (x: ~54%, y: ~56.4%)
 * Brings life to the character without cutting into or distorting the original artwork.
 */
export function BirdAmbient() {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {/* Sunlight sparkle on sunglasses */}
      <motion.div
        className="absolute"
        style={{
          left: '53.8%',
          top: '56.2%',
          width: 14,
          height: 14,
          transform: 'translate(-50%, -50%)',
        }}
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: [0, 0, 0.95, 0.8, 0, 0],
          scale: [0, 0.2, 1.2, 0.9, 0, 0],
          rotate: [0, 0, 45, 90, 90, 90],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          times: [0, 0.65, 0.75, 0.82, 0.9, 1],
          ease: 'easeInOut',
        }}
      >
        {/* 4-point golden star sparkle */}
        <svg viewBox="0 0 24 24" width="100%" height="100%">
          <path
            d="M12 0 Q 12 12 24 12 Q 12 12 12 24 Q 12 12 0 12 Q 12 12 12 0 Z"
            fill="#FFFFFF"
            className="filter drop-shadow-[0_0_4px_#FFE066]"
          />
        </svg>
      </motion.div>
    </div>
  );
}
