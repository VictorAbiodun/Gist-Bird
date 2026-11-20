'use server';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';

export async function markNotificationsRead() {
  await createClient().rpc('mark_notifications_read');
  revalidatePath('/', 'layout');
}
