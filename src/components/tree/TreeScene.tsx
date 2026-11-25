'use client';

import React from 'react';
import Image from 'next/image';
import { FallingLeaves } from './FallingLeaves';
import { AmbientClouds } from './AmbientClouds';
import { GoldenParticles } from './GoldenParticles';
import { BirdAmbient } from './BirdAmbient';
import { TreeMessageLayer } from './TreeMessageLayer';
import type { InboxItem } from '@/lib/types';

interface TreeSceneProps {
  children?: React.ReactNode;
  className?: string;
  fullScreen?: boolean;
  interactiveMessages?: boolean;
  messageMode?: 'full' | 'compact';
  userDisplayName?: string;
  userAvatar?: string;
  userId?: string;
  userUniversity?: string;
  inboxPapers?: InboxItem[];
}

export function TreeScene({
  children,
  className = '',
  fullScreen = false,
  interactiveMessages = true,
  messageMode = 'compact',
  userDisplayName = 'You',
  userAvatar = '/avatars/avatar-01.svg',
  userId,
  userUniversity,
  inboxPapers,
}: TreeSceneProps) {
  return (
    <div
      className={`relative mx-auto w-full max-w-[480px] overflow-hidden select-none ${
        fullScreen ? 'min-h-[calc(100dvh-88px)]' : 'rounded-[24px] shadow-sm'
      } bg-[#EAF7EE] ${className}`}
      style={fullScreen ? undefined : { aspectRatio: '1536 / 2752' }}
    >
      {/* Base Layer 0: The Original Storybook Tree Illustration */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Image
          src="/assets/message-tree.jpg"
          alt="The Message Tree with Chief Coo sitting beneath"
          fill
          priority
          sizes="(max-width: 480px) 100vw, 480px"
          className="object-cover"
        />
      </div>

      {/* Ambient Layer 10: Drifting Clouds across the sky */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <AmbientClouds />
      </div>

      {/* Ambient Layer 10: Floating Golden Sunlight Particles / Canopy Motes */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <GoldenParticles />
      </div>

      {/* Ambient Layer 10: Natural Falling Leaves from Canopy */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <FallingLeaves />
      </div>

      {/* Ambient Layer 10: Subtle Character Life (Sunlight Glint on Sunglasses) */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <BirdAmbient />
      </div>

      {/*
        Interactive Layer 30: Dynamic Envelopes Hanging on Branches.
        Positioned ABOVE ambient layers and behind or with UI controls.
      */}
      {interactiveMessages && (
        <TreeMessageLayer
          mode={messageMode}
          userDisplayName={userDisplayName}
          userAvatar={userAvatar}
          userId={userId}
          userUniversity={userUniversity}
          initialInbox={inboxPapers}
        />
      )}

      {/*
        UI Overlay Layer 40: Header & Bottom CTAs.
        pointer-events-none on wrapper so clicks fall through to envelopes at z-30.
        Individual buttons and links are pointer-events-auto.
      */}
      {children && (
        <div className="relative z-40 flex min-h-[calc(100dvh-88px)] flex-col justify-between pointer-events-none">
          {children}
        </div>
      )}
    </div>
  );
}
