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
  birdName: z.string().trim().min(2, 'Bird name must have at least 2 characters.').max(24, 'Keep bird name to 24 characters.').optional().default('Chief Coo'),
  interests: z.array(z.string().max(30)).max(5),
  spot: z.string().nullable(),
  starter: z.string().trim().max(120).nullable(),
  userTag: z.string().trim().max(30).optional(),
  university: z.string().trim().max(80).optional(),
  country: z.string().trim().max(50).optional(),
  age: z.string().trim().max(30).optional(),
  gender: z.string().trim().max(30).optional(),
  photoUrl: z.string().max(120000).optional(),
});
export type ProfileInput = z.infer<typeof schema>;

export async function saveProfile(input: ProfileInput): Promise<{ error?: string }> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const v = parsed.data;
  if (v.spot && !PICKABLE_SPOTS.some((s) => s.id === v.spot)) return { error: 'Pick a shared spot.' };
  
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'You are not signed in.' };

  const { error } = await supabase.rpc('save_profile', {
    p_display_name: v.displayName,
    p_name_mode: v.nameMode,
    p_scarf: v.scarf,
    p_interests: v.interests,
    p_spot: v.spot,
    p_starter: v.starter,
    p_avatar: v.avatar || '/avatars/avatar-01.svg',
  });
  if (error) return { error: friendlyError(error) };

  // Persist bird name & extended profile metadata via admin client
  const admin = createAdminClient();
  if (v.birdName) {
    await admin
      .from('profiles')
      .update({ bird_name: v.birdName.trim() })
      .eq('id', user.id);
  }

  const metaUpdates: Record<string, string> = {};
  if (v.userTag !== undefined) metaUpdates.user_tag = v.userTag.replace(/^@+/, '');
  if (v.university !== undefined) metaUpdates.university = v.university;
  if (v.country !== undefined) metaUpdates.country = v.country;
  if (v.age !== undefined) metaUpdates.age = v.age;
  if (v.gender !== undefined) metaUpdates.gender = v.gender;
  if (v.photoUrl !== undefined) metaUpdates.photo_url = v.photoUrl;

  if (Object.keys(metaUpdates).length > 0) {
    await admin.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...(user.user_metadata ?? {}),
        ...metaUpdates,
      },
    });
  }

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
