/**
 * Lightweight localStorage-backed offline message queue for patchy campus networks.
 */

export interface QueuedMessage {
  tempId: number;
  chatId: string;
  body: string;
  createdAt: string;
  replyToId?: number;
}

const STORAGE_KEY = 'gist_bird_outbox_v1';

function readAll(): QueuedMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as QueuedMessage[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: QueuedMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // Ignore storage quota errors
  }
}

export function getQueuedMessages(chatId: string): QueuedMessage[] {
  return readAll().filter((m) => m.chatId === chatId);
}

export function enqueueMessage(msg: QueuedMessage): QueuedMessage[] {
  const all = readAll();
  if (!all.some((m) => m.tempId === msg.tempId)) {
    all.push(msg);
    writeAll(all);
  }
  return all.filter((m) => m.chatId === msg.chatId);
}

export function removeQueuedMessage(tempId: number): void {
  const all = readAll().filter((m) => m.tempId !== tempId);
  writeAll(all);
}
