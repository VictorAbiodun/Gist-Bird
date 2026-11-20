'use client';

import React from 'react';
import Image from 'next/image';
import { FallingLeaves } from './FallingLeaves';
import { AmbientClouds } from './AmbientClouds';
import { GoldenParticles } from './GoldenParticles';
import { BirdAmbient } from './BirdAmbient';

interface TreeSceneProps {
  children?: React.ReactNode;
  className?: string;
}

export function TreeScene({ children, className = '' }: TreeSceneProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[480px] overflow-hidden select-none rounded-[24px] bg-[#EAF7EE] shadow-sm ${className}`}
      style={{
        // Match the exact aspect ratio of the 1536 x 2752 illustration (0.558)
        aspectRatio: '1536 / 2752',
      }}
    >
      {/* Base Layer: The Original 3D Storybook Illustration */}
      <Image
        src="/assets/message-tree.jpg"
        alt="The Message Tree with Chief Coo sitting beneath"
        fill
        priority
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-cover pointer-events-none"
      />

      {/* Ambient Layer 1: Drifting Clouds across the sky */}
      <AmbientClouds />

      {/* Ambient Layer 2: Floating Golden Sunlight Particles / Canopy Motes */}
      <GoldenParticles />

      {/* Ambient Layer 3: Natural Falling Leaves from Canopy */}
      <FallingLeaves />

      {/* Ambient Layer 4: Subtle Character Life (Sunlight Glint on Sunglasses) */}
      <BirdAmbient />

      {/* Interactive / Future Envelope Overlay Layer (Phase 2+) */}
      {children && (
        <div className="absolute inset-0 z-10 pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
}
