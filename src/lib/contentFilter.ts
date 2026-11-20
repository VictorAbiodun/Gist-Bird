/**
 * Keeps phone numbers, links and social handles out of papers and early chats (scam safety).
 * Mirrors public.contains_contact_info in supabase/migrations/0001_init.sql. Keep both in sync.
 * The database check is the one that counts; this one gives instant feedback while typing.
 * Known gap: numbers spelled out in words ("zero eight zero…") are not detected. Reports cover that.
 */
export type ContactMatch = 'link' | 'domain' | 'handle' | 'phone' | 'platform';

const RULES: [ContactMatch, RegExp][] = [
  ['link', /(?:https?:\/\/|www\.)/i],
  ['domain', /\b[a-z0-9-]{2,}\.(?:com|ng|org|net|me|ly|io|co|app|link|gl)\b/i],
  ['handle', /(?:^|\s)@[a-z0-9_.]{3,}/i],
  ['phone', /(?:\d[\s.\-()]*){10,}/],
  ['platform', /\b(?:whatsapp|telegram|instagram|snapchat|tiktok|facebook)\b/i],
];

export function findContactInfo(text: string): ContactMatch | null {
  for (const [kind, re] of RULES) if (re.test(text)) return kind;
  return null;
}
export const hasContactInfo = (text: string) => findContactInfo(text) !== null;

export const CONTACT_NOTICE = {
  title: 'Numbers and links wait until later',
  body: 'In early chats we keep them out so everyone is safe from scammers. Take it out and say hi with your words first.',
} as const;
