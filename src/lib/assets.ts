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
 * 30 student profile avatar badges
 */
export const AVATAR_LIST = [
  { id: 'cool-grey', name: 'Cool Grey', file: '/avatars/avatar-01.svg' },
  { id: 'happy-yellow', name: 'Happy Yellow', file: '/avatars/avatar-02.svg' },
  { id: 'shocked-orange', name: 'Surprised Orange', file: '/avatars/avatar-03.svg' },
  { id: 'thinking-green', name: 'Thinking Green', file: '/avatars/avatar-04.svg' },
  { id: 'love-pink', name: 'Love Pink', file: '/avatars/avatar-05.svg' },
  { id: 'winking-purple', name: 'Winking Purple', file: '/avatars/avatar-06.svg' },
  { id: 'angry-red', name: 'Feisty Red', file: '/avatars/avatar-07.svg' },
  { id: 'sleepy-violet', name: 'Sleepy Violet', file: '/avatars/avatar-08.svg' },
  { id: 'dizzy-teal', name: 'Dizzy Teal', file: '/avatars/avatar-09.svg' },
  { id: 'excited-coral', name: 'Excited Coral', file: '/avatars/avatar-10.svg' },
  { id: 'grumpy-brown', name: 'Grumpy Brown', file: '/avatars/avatar-11.svg' },
  { id: 'shy-blue', name: 'Shy Blue', file: '/avatars/avatar-12.svg' },
  { id: 'star-pink', name: 'Starry Pink', file: '/avatars/avatar-13.svg' },
  { id: 'scholar-green', name: 'Scholar Green', file: '/avatars/avatar-14.svg' },
  { id: 'crying-blue', name: 'Crying Blue', file: '/avatars/avatar-15.svg' },
  { id: 'chill-cyan', name: 'Chill Cyan', file: '/avatars/avatar-16.svg' },
  { id: 'goofy-orange', name: 'Goofy Orange', file: '/avatars/avatar-17.svg' },
  { id: 'scared-green', name: 'Scared Green', file: '/avatars/avatar-18.svg' },
  { id: 'singing-white', name: 'Singing White', file: '/avatars/avatar-19.svg' },
  { id: 'champion-gold', name: 'Champion Gold', file: '/avatars/avatar-20.svg' },
  { id: 'adventurer-teal', name: 'Adventurer Teal', file: '/avatars/avatar-21.svg' },
  { id: 'cheeky-violet', name: 'Cheeky Violet', file: '/avatars/avatar-22.svg' },
  { id: 'wondering-blue', name: 'Wondering Blue', file: '/avatars/avatar-23.svg' },
  { id: 'party-lime', name: 'Party Lime', file: '/avatars/avatar-24.svg' },
  { id: 'dreamy-indigo', name: 'Dreamy Indigo', file: '/avatars/avatar-25.svg' },
  { id: 'grinning-magenta', name: 'Grinning Magenta', file: '/avatars/avatar-26.svg' },
  { id: 'radiant-amber', name: 'Radiant Amber', file: '/avatars/avatar-27.svg' },
  { id: 'serene-mint', name: 'Serene Mint', file: '/avatars/avatar-28.svg' },
  { id: 'joyful-sky', name: 'Joyful Sky', file: '/avatars/avatar-29.svg' },
  { id: 'royal-crown', name: 'Royal Crown', file: '/avatars/avatar-30.svg' },
] as const;
