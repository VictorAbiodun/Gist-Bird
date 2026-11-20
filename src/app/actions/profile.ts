'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { friendlyError } from '@/lib/errors';
import { PICKABLE_SPOTS } from '@/lib/campus';

const schema = z.object({
  displayName: z.string().trim().min(2, 'Use at least 2 characters.').max(24, 'Keep it to 24 characters.'),
  nameMode: z.enum(['real', 'alias']),
  scarf: z.enum(['green', 'lemon', 'coral', 'slate', 'ink']),
  avatar: z.string().optional().default('/avatars/avatar-01.svg'),
  interests: z.array(z.string().max(30)).max(5),
  spot: z.string().nullable(),
  starter: z.string().trim().max(120).nullable(),
});
export type ProfileInput = z.infer<typeof schema>;

export async function saveProfile(input: ProfileInput): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.spot && !PICKABLE_SPOTS.some((s) => s.id === v.spot)) return { error: 'Pick a shared spot.' };
  const supabase = createClient();
  const { error } = await supabase.rpc('save_profile', {
    p_display_name: v.displayName, p_name_mode: v.nameMode, p_scarf: v.scarf,
    p_interests: v.interests, p_spot: v.spot, p_starter: v.starter,
    p_avatar: v.avatar || '/avatars/avatar-01.svg',
  });
  if (error) return { error: friendlyError(error) };
  revalidatePath('/', 'layout');
  return {};
}

export async function finishOnboarding(input: ProfileInput) {
  const r = await saveProfile(input);
  if (r.error) return r;
  redirect('/home');
}

export async function deleteAccount() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/welcome');
  await supabase.auth.signOut();
  await createAdminClient().auth.admin.deleteUser(user.id); // cascades to profile, papers, chats, messages
  redirect('/welcome');
}
