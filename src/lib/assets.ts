/**
 * Mascot and home artwork. The files in /public are placeholders drawn in code.
 * Replace them with the exported Figma images (same names, update the extension here if you use PNG).
 */
export const MASCOT = {
  wave: '/mascot/wave.svg',
  cool: '/mascot/cool.svg',
  curious: '/mascot/curious.svg',
  fly: '/mascot/fly.svg',
} as const;
export type Pose = keyof typeof MASCOT;
export const HOME_BIRD = '/images/home-bird.svg';
