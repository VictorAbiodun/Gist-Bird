import { describe, it, expect } from 'vitest';
import { CHAT_EMOJIS, getEmoji } from '../lib/emojis';

describe('chat emojis', () => {
  it('contains exactly the 7 uploaded custom emojis', () => {
    expect(CHAT_EMOJIS).toHaveLength(7);
    const keys = CHAT_EMOJIS.map((e) => e.key);
    expect(keys).toEqual(['heart', 'laugh', 'shock', 'cry', 'shy', 'side-eye', 'moon']);
  });

  it('retrieves emojis by key correctly', () => {
    const moon = getEmoji('moon');
    expect(moon).toBeDefined();
    expect(moon?.file).toBe('/emojis/moon.svg');

    const heart = getEmoji('heart');
    expect(heart).toBeDefined();
    expect(heart?.file).toBe('/emojis/heart.svg');

    expect(getEmoji('unknown-key')).toBeUndefined();
  });
});
