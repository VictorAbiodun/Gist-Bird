/**
 * Mascot artwork — Chief Coo in various poses.
 * Source: Figma "Naija Paper Bird — Pilot Design (Redeemer's)"
 */
export const MASCOT = {
  wave: '/mascot/wave.jpg',
  cool: '/mascot/cool.jpg',
  curious: '/mascot/curious.jpg',
  fly: '/mascot/fly.jpg',
} as const;
export type Pose = keyof typeof MASCOT;
export const HOME_BIRD = '/images/home-bird.jpg';
