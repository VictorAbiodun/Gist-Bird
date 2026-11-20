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
  fullScreen?: boolean;
}

export function TreeScene({ children, className = '', fullScreen = false }: TreeSceneProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[480px] overflow-hidden select-none ${
        fullScreen ? 'min-h-[calc(100dvh-88px)]' : 'rounded-[24px] shadow-sm'
      } bg-[#EAF7EE] ${className}`}
      style={fullScreen ? undefined : { aspectRatio: '1536 / 2752' }}
    >
      {/* Base Layer: The Original 3D Storybook Illustration */}
      <Image
        src="/assets/message-tree.jpg"
        alt="The Message Tree with Chief Coo sitting beneath"
        fill
        priority
        sizes="(max-width: 480px) 100vw, 480px"
        className="object-cover pointer-events-none -z-0"
      />

      {/* Ambient Layer 1: Drifting Clouds across the sky */}
      <AmbientClouds />

      {/* Ambient Layer 2: Floating Golden Sunlight Particles / Canopy Motes */}
      <GoldenParticles />

      {/* Ambient Layer 3: Natural Falling Leaves from Canopy */}
      <FallingLeaves />

      {/* Ambient Layer 4: Subtle Character Life (Sunlight Glint on Sunglasses) */}
      <BirdAmbient />

      {/* Interactive / UI Overlay Layer */}
      {children && (
        <div className="relative z-10 flex min-h-[calc(100dvh-88px)] flex-col justify-between pointer-events-auto">
          {children}
        </div>
      )}
    </div>
  );
}
