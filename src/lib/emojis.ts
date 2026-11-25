/**
 * The 7 official Gist Bird chat reaction emojis.
 */

export interface ChatEmoji {
  key: string;
  label: string;
  file: string;
}

export const CHAT_EMOJIS: ChatEmoji[] = [
  { key: 'heart', label: 'Heart', file: '/emojis/heart.svg' },
  { key: 'laugh', label: 'Laugh', file: '/emojis/laugh.svg' },
  { key: 'shock', label: 'Shocked', file: '/emojis/shock.svg' },
  { key: 'cry', label: 'Crying', file: '/emojis/cry.svg' },
  { key: 'shy', label: 'Shy', file: '/emojis/shy.svg' },
  { key: 'side-eye', label: 'Side-eye', file: '/emojis/side-eye.svg' },
  { key: 'moon', label: 'Shy Moon', file: '/emojis/moon.svg' },
];

export function getEmoji(key: string): ChatEmoji | undefined {
  return CHAT_EMOJIS.find((e) => e.key === key);
}
