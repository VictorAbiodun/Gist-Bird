/** Maps database error codes (raised by the SQL functions) to plain-language messages. */
const MESSAGES: Record<string, string> = {
  contact_info: 'Numbers and links wait until later. Take it out and say hi with your words first.',
  too_short: 'Write a little more. Papers need at least 20 characters.',
  too_long: 'That is over 280 characters. Trim it a little.',
  no_papers_left: 'No papers left today. You get fresh ones tomorrow.',
  account_paused: 'Your account is paused right now.',
  invalid_spot: 'Pick a shared spot. Faculty buildings are pass-through only.',
  profile_required: 'Finish setting up your profile first.',
  not_found: 'That is no longer available.',
  school_email_required: 'That does not look like a school email. Use the one your school gave you.',
};

export function friendlyError(err: unknown, fallback = "That didn't work. Check your connection and try again."): string {
  const msg = typeof err === 'string' ? err : (err as { message?: string } | null)?.message ?? '';
  for (const code of Object.keys(MESSAGES)) if (msg.includes(code)) return MESSAGES[code];
  return fallback;
}

export function errorCode(err: unknown): string | null {
  const msg = typeof err === 'string' ? err : (err as { message?: string } | null)?.message ?? '';
  return Object.keys(MESSAGES).find((c) => msg.includes(c)) ?? null;
}
