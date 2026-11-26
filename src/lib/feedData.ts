import 'server-only';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { normalizeUniText } from '@/lib/universities';
import type { FeedAuthor, FeedPost, FeedQuotedPost, FeedScope, Scarf } from '@/lib/types';

interface RawPostRow {
  id: string;
  author_id: string;
  body: string;
  university: string | null;
  reply_to_id: string | null;
  quote_of_id: string | null;
  created_at: string;
}

async function hydratePosts(
  rows: RawPostRow[],
  currentUserId: string
): Promise<FeedPost[]> {
  if (rows.length === 0) return [];
  const admin = createAdminClient();

  const postIds = rows.map((r) => r.id);
  const quoteIds = Array.from(
    new Set(rows.map((r) => r.quote_of_id).filter((id): id is string => Boolean(id)))
  );
  const allPostIds = Array.from(new Set([...postIds, ...quoteIds]));

  const [
    { data: quotedRows },
    { data: likesRows },
    { data: repostsRows },
    { data: bookmarksRows },
    { data: repliesRows },
  ] = await Promise.all([
    quoteIds.length > 0
      ? admin
          .from('feed_posts')
          .select('id, author_id, body, university, reply_to_id, quote_of_id, created_at')
          .in('id', quoteIds)
      : Promise.resolve({ data: [] as RawPostRow[] }),
    admin.from('feed_likes').select('post_id, user_id').in('post_id', allPostIds),
    admin.from('feed_reposts').select('post_id, user_id').in('post_id', allPostIds),
    admin
      .from('feed_bookmarks')
      .select('post_id')
      .eq('user_id', currentUserId)
      .in('post_id', postIds),
    admin
      .from('feed_posts')
      .select('id, reply_to_id')
      .in('reply_to_id', postIds),
  ]);

  const quotedMap = new Map<string, RawPostRow>();
  for (const q of (quotedRows ?? []) as RawPostRow[]) {
    quotedMap.set(q.id, q);
  }

  const authorIds = Array.from(
    new Set([
      ...rows.map((r) => r.author_id),
      ...Array.from(quotedMap.values()).map((q) => q.author_id),
    ])
  );

  const [{ data: profilesData }, { data: authUsersData }] = await Promise.all([
    admin
      .from('profiles')
      .select('id, display_name, scarf, avatar')
      .in('id', authorIds),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const metaMap = new Map<string, Record<string, unknown>>();
  for (const u of authUsersData?.users ?? []) {
    if (authorIds.includes(u.id)) {
      metaMap.set(u.id, (u.user_metadata ?? {}) as Record<string, unknown>);
    }
  }

  const authorMap = new Map<string, FeedAuthor>();
  for (const p of profilesData ?? []) {
    const meta = metaMap.get(p.id) ?? {};
    authorMap.set(p.id, {
      id: p.id,
      display_name: p.display_name,
      scarf: p.scarf as Scarf,
      avatar: p.avatar,
      user_tag: typeof meta.user_tag === 'string' ? meta.user_tag : undefined,
      photo_url: typeof meta.photo_url === 'string' ? meta.photo_url : undefined,
      university: typeof meta.university === 'string' ? meta.university : undefined,
    });
  }

  const likesCountMap = new Map<string, number>();
  const likedByMeSet = new Set<string>();
  for (const l of likesRows ?? []) {
    likesCountMap.set(l.post_id, (likesCountMap.get(l.post_id) ?? 0) + 1);
    if (l.user_id === currentUserId) likedByMeSet.add(l.post_id);
  }

  const repostsCountMap = new Map<string, number>();
  const repostedByMeSet = new Set<string>();
  for (const r of repostsRows ?? []) {
    repostsCountMap.set(r.post_id, (repostsCountMap.get(r.post_id) ?? 0) + 1);
    if (r.user_id === currentUserId) repostedByMeSet.add(r.post_id);
  }

  const bookmarkedByMeSet = new Set<string>(
    (bookmarksRows ?? []).map((b) => b.post_id as string)
  );

  const repliesCountMap = new Map<string, number>();
  for (const rep of repliesRows ?? []) {
    if (rep.reply_to_id) {
      repliesCountMap.set(rep.reply_to_id, (repliesCountMap.get(rep.reply_to_id) ?? 0) + 1);
    }
  }

  const fallbackAuthor = (id: string): FeedAuthor => ({
    id,
    display_name: 'Campus Bird',
    scarf: 'green',
    avatar: '/avatars/avatar-01.svg',
  });

  return rows.map((r) => {
    let quoteOf: FeedQuotedPost | null = null;
    if (r.quote_of_id) {
      const q = quotedMap.get(r.quote_of_id);
      if (q) {
        quoteOf = {
          id: q.id,
          body: q.body,
          created_at: q.created_at,
          author: authorMap.get(q.author_id) ?? fallbackAuthor(q.author_id),
        };
      }
    }

    const author = authorMap.get(r.author_id) ?? fallbackAuthor(r.author_id);
    if (r.university && !author.university) {
      author.university = r.university;
    }

    return {
      ...r,
      author,
      quote_of: quoteOf,
      likes_count: likesCountMap.get(r.id) ?? 0,
      reposts_count: repostsCountMap.get(r.id) ?? 0,
      replies_count: repliesCountMap.get(r.id) ?? 0,
      liked_by_me: likedByMeSet.has(r.id),
      reposted_by_me: repostedByMeSet.has(r.id),
      bookmarked_by_me: bookmarkedByMeSet.has(r.id),
    };
  });
}

async function getBlockedUserIds(userId: string): Promise<Set<string>> {
  const admin = createAdminClient();
  const [{ data: blockedByMe }, { data: blockedMe }] = await Promise.all([
    admin.from('blocks').select('blocked_id').eq('blocker_id', userId),
    admin.from('blocks').select('blocker_id').eq('blocked_id', userId),
  ]);
  const set = new Set<string>();
  for (const b of blockedByMe ?? []) set.add(b.blocked_id as string);
  for (const b of blockedMe ?? []) set.add(b.blocker_id as string);
  return set;
}

export async function getFeedPosts(options: {
  scope?: FeedScope;
  userId?: string;
  userUniversity?: string;
  limit?: number;
}): Promise<FeedPost[]> {
  try {
    const supabase = createClient();
    let uid = options.userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      uid = user.id;
    }

    const admin = createAdminClient();
    const limit = options.limit ?? 50;
    const scope = options.scope ?? 'all';
    const blocked = await getBlockedUserIds(uid);

    if (scope === 'bookmarks') {
      const { data: bm } = await admin
        .from('feed_bookmarks')
        .select('post_id')
        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .limit(limit);
      const ids = (bm ?? []).map((b) => b.post_id as string);
      if (ids.length === 0) return [];

      const { data: posts, error } = await admin
        .from('feed_posts')
        .select('id, author_id, body, university, reply_to_id, quote_of_id, created_at')
        .in('id', ids)
        .order('created_at', { ascending: false });
      if (error || !posts) return [];
      const filtered = (posts as RawPostRow[]).filter((p) => !blocked.has(p.author_id));
      return hydratePosts(filtered, uid);
    }

    const { data: posts, error } = await admin
      .from('feed_posts')
      .select('id, author_id, body, university, reply_to_id, quote_of_id, created_at')
      .is('reply_to_id', null)
      .order('created_at', { ascending: false })
      .limit(scope === 'campus' ? 150 : limit);

    if (error || !posts) return [];

    let filtered = (posts as RawPostRow[]).filter((p) => !blocked.has(p.author_id));

    if (scope === 'campus' && options.userUniversity) {
      const userNorm = normalizeUniText(options.userUniversity);
      filtered = filtered.filter(
        (p) => p.university && normalizeUniText(p.university) === userNorm
      );
    }

    return hydratePosts(filtered.slice(0, limit), uid);
  } catch (err) {
    console.warn('getFeedPosts error:', err);
    return [];
  }
}

export async function getFeedPostThread(
  postId: string,
  userId?: string
): Promise<{ root: FeedPost | null; replies: FeedPost[] }> {
  try {
    const supabase = createClient();
    let uid = userId;
    if (!uid) {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { root: null, replies: [] };
      uid = user.id;
    }

    const admin = createAdminClient();
    const [{ data: rootRow }, { data: replyRows }, blocked] = await Promise.all([
      admin
        .from('feed_posts')
        .select('id, author_id, body, university, reply_to_id, quote_of_id, created_at')
        .eq('id', postId)
        .maybeSingle(),
      admin
        .from('feed_posts')
        .select('id, author_id, body, university, reply_to_id, quote_of_id, created_at')
        .eq('reply_to_id', postId)
        .order('created_at', { ascending: true })
        .limit(100),
      getBlockedUserIds(uid),
    ]);

    if (!rootRow || blocked.has((rootRow as RawPostRow).author_id)) {
      return { root: null, replies: [] };
    }

    const filteredReplies = ((replyRows ?? []) as RawPostRow[]).filter(
      (r) => !blocked.has(r.author_id)
    );

    const hydrated = await hydratePosts([rootRow as RawPostRow, ...filteredReplies], uid);
    return {
      root: hydrated[0] ?? null,
      replies: hydrated.slice(1),
    };
  } catch (err) {
    console.warn('getFeedPostThread error:', err);
    return { root: null, replies: [] };
  }
}
