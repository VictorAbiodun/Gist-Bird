import type { PaperState } from './copy';

export interface InboxItem { id: string; state: 'landed' | 'opened'; landed_at: string; body: string | null; from_name: string; from_scarf: Scarf; interests: string[]; spot: string | null }
export interface SentItem { id: string; body: string; state: PaperState; sent_at: string; lands_at: string | null; origin: string; dest: string | null; chat_id: string | null }
export interface PaperView {
  role: 'author' | 'recipient'; id: string; state: PaperState; body: string | null;
  from_name: string | null; from_scarf: Scarf | null; interests: string[] | null; spot: string | null;
  origin: string; sent_at: string; lands_at: string | null; dest: string | null; chat_id: string | null;
}
export interface ChatRow { id: string; other_id: string; other_name: string; other_scarf: Scarf; last: string | null; last_at: string }
export interface ChatView { id: string; other_id: string; other_name: string; other_scarf: Scarf; other_interests: string[]; other_starter: string | null; paper_body: string; blocked: boolean; me: string }
export interface Message { id: number; chat_id: string; sender_id: string; body: string; created_at: string }
export interface Notice { id: string; kind: string; title: string; body: string | null; data: Record<string, string>; read_at: string | null; created_at: string }
export interface Profile { id: string; display_name: string; name_mode: 'real' | 'alias'; scarf: Scarf; interests: string[]; favourite_spot: string | null; starter_prompt: string | null; status: 'active' | 'paused'; paused_until: string | null }
export type Scarf = 'green' | 'lemon' | 'coral' | 'slate' | 'ink';
export const SCARF_HEX: Record<Scarf, string> = { green: '#0A7D3E', lemon: '#FFD23F', coral: '#FF6B57', slate: '#7F90A3', ink: '#0E2A1B' };
