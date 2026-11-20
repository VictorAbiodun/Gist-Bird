import { describe, expect, it } from 'vitest';
import { findContactInfo, hasContactInfo } from './contentFilter';

describe('contact info filter', () => {
  it.each([
    ['call me on 0803 000 0000', 'phone'],
    ['0803-000-0000', 'phone'],
    ['+234 803 000 0000', 'phone'],
    ['(0803) 000.0000', 'phone'],
    ['check https://example.com', 'link'],
    ['go to www.mysite.ng now', 'link'],
    ['mail me at kemi@school.edu.ng', 'domain'],
    ['find me on @kemi_o', 'handle'],
    ['add me on whatsapp', 'platform'],
    ['IG: Instagram', 'platform'],
  ])('flags %s', (text, kind) => expect(findContactInfo(text)).toBe(kind));

  it.each([
    'Harmattan don show face o. What is one food you will never share?',
    'I am 20 and in 400 level, born 2005, room 14.',
    'Meet me at Peace Park at 5 pm',
    'e.g. Jollof, i.e. the party kind.',
    'Score was 3 - 2 and I am still not over it',
    'My matric is not a number I will share',
  ])('allows %s', (text) => expect(hasContactInfo(text)).toBe(false));
});
