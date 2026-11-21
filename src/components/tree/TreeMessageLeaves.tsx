'use client';

import Image from 'next/image';
import { motion, useReducedMotion } from 'framer-motion';
import type { TreeEnvelope } from './treeEnvelope';

interface TreeMessageLeavesProps {
  envelopes: TreeEnvelope[];
  onSelectEnvelope: (envelope: TreeEnvelope) => void;
  activeEnvelopeId?: string | null;
}

export function TreeMessageLeaves({
  envelopes,
  onSelectEnvelope,
  activeEnvelopeId,
}: TreeMessageLeavesProps) {
  const shouldReduceMotion = useReducedMotion();
  const total = envelopes.length;

  if (total === 0) {
    return null;
  }

  // Responsive envelope sizing based on crowding
  const isCrowded = total > 6;
  const isDense = total > 10;
  const envelopeWidth = isDense ? 36 : isCrowded ? 44 : 52;
  const envelopeHeight = Math.round(envelopeWidth * (200 / 256)); // Preserve SVG aspect ratio

  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {envelopes.map((env, i) => {
        const isLanded = env.state === 'landed';
        const isDetached = activeEnvelopeId === env.id;

        return (
          <motion.div
            key={env.id}
            className="pointer-events-auto absolute"
            style={{
              left: `${env.x}%`,
              top: `${env.y}%`,
              transform: 'translate(-50%, 0)',
              transformOrigin: 'top center',
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{
              scale: isDetached ? 0.9 : 1,
              opacity: 1,
              y: shouldReduceMotion || isDetached ? 0 : [0, -4, 0],
              rotate: shouldReduceMotion || isDetached ? 0 : [-env.swayAngle, env.swayAngle, -env.swayAngle],
            }}
            transition={{
              scale: { duration: 0.45, delay: i * 0.06 },
              opacity: { duration: 0.45, delay: i * 0.06 },
              y: {
                duration: env.swayDuration,
                repeat: isDetached ? 0 : Infinity,
                ease: 'easeInOut',
                delay: env.swayDelay,
              },
              rotate: {
                duration: env.swayDuration * 1.15,
                repeat: isDetached ? 0 : Infinity,
                ease: 'easeInOut',
                delay: env.swayDelay,
              },
            }}
          >
            {/* Hanging String from Canopy Branch */}
            <div
              className={`mx-auto w-[1.5px] origin-top transition-opacity duration-300 ${
                isDetached ? 'opacity-30' : 'opacity-100'
              }`}
              style={{
                height: `${env.stringHeight}px`,
                background: isLanded
                  ? 'linear-gradient(to bottom, #1E4620, #D97706)'
                  : 'linear-gradient(to bottom, #1E4620, #0A7D3E)',
              }}
            />

            {/* Interactive Envelope — fades out while detached & flying in center reader */}
            <motion.button
              type="button"
              onClick={() => onSelectEnvelope(env)}
              whileHover={{ scale: isDetached ? 1 : 1.15, y: isDetached ? 0 : -3 }}
              whileTap={{ scale: isDetached ? 1 : 0.92 }}
              aria-label={`Unaccepted paper from ${env.fromName} (${isLanded ? 'unopened' : 'opened'})`}
              className={`group relative flex flex-col items-center focus:outline-none transition-all duration-300 ${
                isDetached ? 'opacity-0 pointer-events-none scale-90' : 'opacity-100 scale-100'
              }`}
            >
              {/* Pulsing Glow Ring for Unopened Envelopes */}
              {isLanded && !isDetached && (
                <span
                  className="pointer-events-none absolute rounded-full opacity-60 animate-ping"
                  style={{
                    width: envelopeWidth + 12,
                    height: envelopeHeight + 12,
                    top: -6,
                    left: -6,
                    background: 'radial-gradient(ellipse, rgba(255,216,107,0.5) 0%, transparent 70%)',
                  }}
                />
              )}

              {/* Hover Glow */}
              {!isDetached && (
                <span
                  className="pointer-events-none absolute rounded-lg opacity-0 blur-[6px] transition-opacity duration-300 group-hover:opacity-80"
                  style={{
                    inset: -4,
                    backgroundColor: isLanded ? 'rgba(255, 216, 107, 0.5)' : 'rgba(10, 125, 62, 0.3)',
                  }}
                />
              )}

              {/* The Envelope SVG */}
              <Image
                src="/assets/envelope.svg"
                alt="Paper envelope"
                width={envelopeWidth}
                height={envelopeHeight}
                className={`relative drop-shadow-md transition-all ${
                  !isLanded ? 'brightness-95 saturate-[0.85]' : ''
                }`}
              />

              {/* Author Name Label — tucked underneath the envelope */}
              <span
                className={`relative -mt-0.5 max-w-[70px] truncate rounded-full bg-white/95 px-2 py-0.5 text-center font-extrabold text-ink shadow-sm backdrop-blur-sm ${
                  isDense ? 'text-[8px]' : isCrowded ? 'text-[9px]' : 'text-[10px]'
                }`}
              >
                {env.fromName}
              </span>

              {/* Status Badge */}
              {isLanded && !isDetached && (
                <span className="absolute -right-1.5 -top-1 flex h-4 min-w-[26px] items-center justify-center rounded-full bg-coral px-1 text-[8px] font-bold tracking-wider text-white shadow-sm">
                  NEW
                </span>
              )}
            </motion.button>
          </motion.div>
        );
      })}
    </div>
  );
}
