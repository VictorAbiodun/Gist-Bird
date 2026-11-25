import { describe, it, expect, beforeEach } from 'vitest';
import {
  enqueueMessage,
  getQueuedMessages,
  removeQueuedMessage,
} from '../lib/offlineQueue';

describe('offlineQueue', () => {
  beforeEach(() => {
    const store: Record<string, string> = {};
    // Minimal window/localStorage mock for Node vitest environment
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: (k: string) => store[k] ?? null,
        setItem: (k: string, v: string) => {
          store[k] = v;
        },
        removeItem: (k: string) => {
          delete store[k];
        },
      },
    };
  });

  it('queues, retrieves by chatId, and removes messages', () => {
    enqueueMessage({
      tempId: -101,
      chatId: 'chat-a',
      body: 'Hey, campus wifi dropped',
      createdAt: '2026-11-25T10:00:00Z',
    });
    enqueueMessage({
      tempId: -102,
      chatId: 'chat-b',
      body: 'Different chat',
      createdAt: '2026-11-25T10:01:00Z',
    });

    expect(getQueuedMessages('chat-a')).toHaveLength(1);
    expect(getQueuedMessages('chat-a')[0].body).toBe('Hey, campus wifi dropped');
    expect(getQueuedMessages('chat-b')).toHaveLength(1);

    removeQueuedMessage(-101);
    expect(getQueuedMessages('chat-a')).toHaveLength(0);
    expect(getQueuedMessages('chat-b')).toHaveLength(1);
  });

  it('prevents duplicate tempId entries', () => {
    const item = {
      tempId: -200,
      chatId: 'chat-a',
      body: 'First',
      createdAt: '2026-11-25T10:00:00Z',
    };
    enqueueMessage(item);
    enqueueMessage(item);
    expect(getQueuedMessages('chat-a')).toHaveLength(1);
  });
});
