/** Product copy in one place. Voice: short, warm, Naija-flavoured; "paper" not "letter"; rejection is never the word. */
export type PaperState = 'flying' | 'landed' | 'opened' | 'accepted' | 'returned';

export const SENT_STATUS: Record<PaperState, { label: string; tone: 'flying' | 'landed' | 'read' | 'hi' | 'back' }> = {
  flying: { label: 'Flying', tone: 'flying' },
  landed: { label: 'Landed', tone: 'landed' },
  opened: { label: 'Being read', tone: 'read' },
  accepted: { label: 'Someone said hi!', tone: 'hi' },
  returned: { label: 'Nobody picked it up yet', tone: 'back' },
};

export const PROMPTS = ['Harmattan don start…', 'One food you will never share', 'A song on repeat'];
export const INTERESTS = ['Football', 'Gospel', 'Jollof debates', 'Anime', 'Afrobeats', 'Coding', 'Fashion', 'Cooking', 'Movies', 'Poetry', 'Gaming', 'Business', 'Faith talks', 'Fitness', 'Art', 'NYSC gist'];
export const STARTERS = ["What's your jollof take?", 'Best gist this week?', 'What is your favourite spot like?'];
export const MAX_PAPER = 280;
export const MIN_PAPER = 20;

/** Must match app_config.contact_unlock_messages in the database. */
export const CONTACT_UNLOCK_MESSAGES = 10;
export const ALIAS_ADJ = ['Quiet', 'Sunny', 'Calm', 'Bold', 'Swift', 'Gentle', 'Bright', 'Lucky', 'Warm', 'Clever'];
export const ALIAS_NOUN = ['Weaver', 'Drummer', 'Lantern', 'Cowrie', 'Heron', 'Baobab', 'Kola', 'Harmattan', 'Sparrow', 'Potter'];
export const randomAlias = () => `${ALIAS_ADJ[Math.floor(Math.random() * ALIAS_ADJ.length)]} ${ALIAS_NOUN[Math.floor(Math.random() * ALIAS_NOUN.length)]}`;
