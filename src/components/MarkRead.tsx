'use client';
import { useEffect } from 'react';
import { markNotificationsRead } from '@/app/actions/notifications';

export function MarkRead({ any }: { any: boolean }) {
  useEffect(() => { if (any) markNotificationsRead(); }, [any]);
  return null;
}
