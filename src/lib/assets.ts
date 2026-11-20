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

/**
 * 20 student profile avatar badges
 */
export const AVATAR_LIST = [
  { id: 'cool-grey', name: 'Cool Grey', file: '/avatars/avatar-01.png' },
  { id: 'happy-yellow', name: 'Happy Yellow', file: '/avatars/avatar-02.png' },
  { id: 'shocked-orange', name: 'Surprised Orange', file: '/avatars/avatar-03.png' },
  { id: 'thinking-green', name: 'Thinking Green', file: '/avatars/avatar-04.png' },
  { id: 'love-pink', name: 'Love Pink', file: '/avatars/avatar-05.png' },
  { id: 'winking-purple', name: 'Winking Purple', file: '/avatars/avatar-06.png' },
  { id: 'angry-red', name: 'Feisty Red', file: '/avatars/avatar-07.png' },
  { id: 'sleepy-violet', name: 'Sleepy Violet', file: '/avatars/avatar-08.png' },
  { id: 'dizzy-teal', name: 'Dizzy Teal', file: '/avatars/avatar-09.png' },
  { id: 'excited-coral', name: 'Excited Coral', file: '/avatars/avatar-10.png' },
  { id: 'grumpy-brown', name: 'Grumpy Brown', file: '/avatars/avatar-11.png' },
  { id: 'shy-blue', name: 'Shy Blue', file: '/avatars/avatar-12.png' },
  { id: 'star-pink', name: 'Starry Pink', file: '/avatars/avatar-13.png' },
  { id: 'scholar-green', name: 'Scholar Green', file: '/avatars/avatar-14.png' },
  { id: 'crying-blue', name: 'Crying Blue', file: '/avatars/avatar-15.png' },
  { id: 'chill-cyan', name: 'Chill Cyan', file: '/avatars/avatar-16.png' },
  { id: 'goofy-orange', name: 'Goofy Orange', file: '/avatars/avatar-17.png' },
  { id: 'scared-green', name: 'Scared Green', file: '/avatars/avatar-18.png' },
  { id: 'singing-white', name: 'Singing White', file: '/avatars/avatar-19.png' },
  { id: 'champion-gold', name: 'Champion Gold', file: '/avatars/avatar-20.png' },
] as const;

