import type { Scarf } from '@/lib/types';
export * from './treeEnvelope';

export interface TreeMessage {
  id: string;
  authorName: string;
  authorAvatar: string;
  authorScarf: Scarf;
  spot: string;
  body: string;
  category: 'campus' | 'wholesome' | 'gist';
  createdAt: string;
  reactions: {
    hearts: number;
    flutters: number;
  };
  x: number;
  y: number;
  colorTheme: string;
  paperId?: string;
  isDeliveredPaper?: boolean;
  state?: 'landed' | 'opened';
}
