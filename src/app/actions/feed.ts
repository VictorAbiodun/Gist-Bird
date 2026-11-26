'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { friendlyError } from '@/lib/errors';

const postSchema = z.object({
  body: z.string().trim().min(1, 'Write something first.').max(5000, 'Post is too long (max 5,000 characters).'),
  replyToId: z.string().uuid().optional(),
  quoteOfId: z.string().uuid().optional(),
});

export async function createFeedPost(input: {
  body: string;
  replyToId?: string;
  quoteOfId?: string;
}): Promise<{ id?: string; error?: string }> {
  const parsed = postSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || 'Invalid post.' };
  }

  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Not signed in.' };

    const admin = createAdminClient();
    const university =
      typeof user.user_metadata?.university === 'string'
        ? user.user_metadata.university
        : null;

    const { data, error } = await admin
      .from('feed_posts')
      .insert({
        author_id: user.id,
        body: parsed.data.body,
        university,
        reply_to_id: parsed.data.replyToId ?? null,
        quote_of_id: parsed.data.quoteOfId ?? null,
      })
      .select('id')
      .single();

    if (error || !data) {
      return { error: error ? friendlyError(error) : 'Could not publish post.' };
    }

    // Notify parent or quoted post author
    const targetPostId = parsed.data.replyToId ?? parsed.data.quoteOfId;
    if (targetPostId) {
      const [{ data: targetPost }, { data: myProfile }] = await Promise.all([
        admin.from('feed_posts').select('author_id').eq('id', targetPostId).maybeSingle(),
        admin.from('profiles').select('display_name').eq('id', user.id).maybeSingle(),
      ]);

      if (targetPost && targetPost.author_id !== user.id) {
        const senderName = myProfile?.display_name || 'Someone';
        await admin.from('notifications').insert({
          user_id: targetPost.author_id,
          kind: parsed.data.replyToId ? 'message_reply' : 'paper_accepted',
          title: parsed.data.replyToId
            ? `${senderName} replied to your post`
            : `${senderName} quoted your post`,
          body: parsed.data.body.slice(0, 120),
          data: {
            post_id: parsed.data.replyToId ?? data.id,
          },
        });
      }
    }

    revalidatePath('/feed');
    if (parsed.data.replyToId) {
      revalidatePath(`/feed/${parsed.data.replyToId}`);
    }
    return { id: data.id };
  } catch (err) {
    console.warn('createFeedPost error:', err);
    return { error: 'Could not publish post.' };
  }
}

export async function deleteFeedPost(postId: string): Promise<{ error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'Not signed in.' };

    const admin = createAdminClient();
    const { error } = await admin
      .from('feed_posts')
      .delete()
      .eq('id', postId)
      .eq('author_id', user.id);

    if (error) return { error: friendlyError(error) };
    revalidatePath('/feed');
    return {};
  } catch (err) {
    console.warn('deleteFeedPost error:', err);
    return { error: 'Could not delete post.' };
  }
}

export async function toggleFeedLike(postId: string): Promise<{ liked: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { liked: false, error: 'Not signed in.' };

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('feed_likes')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await admin.from('feed_likes').delete().eq('post_id', postId).eq('user_id', user.id);
      return { liked: false };
    }

    await admin.from('feed_likes').insert({ post_id: postId, user_id: user.id });
    return { liked: true };
  } catch (err) {
    console.warn('toggleFeedLike error:', err);
    return { liked: false, error: 'Failed to update like.' };
  }
}

export async function toggleFeedRepost(postId: string): Promise<{ reposted: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { reposted: false, error: 'Not signed in.' };

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('feed_reposts')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await admin.from('feed_reposts').delete().eq('post_id', postId).eq('user_id', user.id);
      return { reposted: false };
    }

    await admin.from('feed_reposts').insert({ post_id: postId, user_id: user.id });
    return { reposted: true };
  } catch (err) {
    console.warn('toggleFeedRepost error:', err);
    return { reposted: false, error: 'Failed to update repost.' };
  }
}

export async function toggleFeedBookmark(postId: string): Promise<{ bookmarked: boolean; error?: string }> {
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { bookmarked: false, error: 'Not signed in.' };

    const admin = createAdminClient();
    const { data: existing } = await admin
      .from('feed_bookmarks')
      .select('post_id')
      .eq('post_id', postId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (existing) {
      await admin.from('feed_bookmarks').delete().eq('post_id', postId).eq('user_id', user.id);
      return { bookmarked: false };
    }

    await admin.from('feed_bookmarks').insert({ post_id: postId, user_id: user.id });
    return { bookmarked: true };
  } catch (err) {
    console.warn('toggleFeedBookmark error:', err);
    return { bookmarked: false, error: 'Failed to update bookmark.' };
  }
}
