'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { FeedPostCard } from './FeedPostCard';
import { FeedComposeModal } from './FeedComposeModal';
import { ProfilePreviewModal, type ProfilePreviewData } from './ProfilePreviewModal';
import { UniversityLogo } from './UniversityLogo';
import { findUniversity, normalizeUniText } from '@/lib/universities';
import {
  createFeedPost,
  deleteFeedPost,
  toggleFeedBookmark,
  toggleFeedLike,
  toggleFeedRepost,
} from '@/app/actions/feed';
import type { FeedAuthor, FeedPost, FeedScope, Profile } from '@/lib/types';

interface FeedClientProps {
  initialPosts: FeedPost[];
  profile: Profile;
}

export function FeedClient({ initialPosts, profile }: FeedClientProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<FeedPost[]>(initialPosts);
  const [scope, setScope] = useState<FeedScope>('all');
  const [composeOpen, setComposeOpen] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState<FeedPost | null>(null);
  const [hasNewPosts, setHasNewPosts] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [authorPreview, setAuthorPreview] = useState<ProfilePreviewData | null>(null);

  useEffect(() => {
    setPosts(initialPosts);
  }, [initialPosts]);

  // Realtime listener for new posts
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel('feed-posts-stream')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'feed_posts' },
        (payload) => {
          const row = payload.new as { author_id?: string; reply_to_id?: string | null };
          if (!row.reply_to_id && row.author_id !== profile.id) {
            setHasNewPosts(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile.id]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const userUni = profile.university;
  const userUniMeta = findUniversity(userUni);

  const visiblePosts = useMemo(() => {
    if (scope === 'bookmarks') {
      return posts.filter((p) => p.bookmarked_by_me);
    }
    if (scope === 'campus' && userUni) {
      const norm = normalizeUniText(userUni);
      return posts.filter((p) => {
        const uni = p.author.university || p.university;
        return uni ? normalizeUniText(uni) === norm : false;
      });
    }
    return posts;
  }, [posts, scope, userUni]);

  const handleCreatePost = async (body: string, quoteOfId?: string) => {
    const res = await createFeedPost({ body, quoteOfId });
    if (!res.error) {
      showToast('Posted!');
      router.refresh();
    }
    return res;
  };

  const handleLike = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              liked_by_me: !p.liked_by_me,
              likes_count: p.liked_by_me ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
            }
          : p
      )
    );
    await toggleFeedLike(postId);
  };

  const handleRepost = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              reposted_by_me: !p.reposted_by_me,
              reposts_count: p.reposted_by_me
                ? Math.max(0, p.reposts_count - 1)
                : p.reposts_count + 1,
            }
          : p
      )
    );
    const res = await toggleFeedRepost(postId);
    if (!res.error) {
      showToast(res.reposted ? 'Reposted' : 'Removed repost');
    }
  };

  const handleBookmark = async (postId: string) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, bookmarked_by_me: !p.bookmarked_by_me } : p
      )
    );
    const res = await toggleFeedBookmark(postId);
    if (!res.error) {
      showToast(res.bookmarked ? 'Saved to Bookmarks' : 'Removed from Bookmarks');
    }
  };

  const handleDelete = async (postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    const res = await deleteFeedPost(postId);
    if (res.error) {
      showToast(res.error);
      router.refresh();
    } else {
      showToast('Post deleted');
    }
  };

  const handleShare = async (post: FeedPost) => {
    const url = `${window.location.origin}/feed/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${post.author.display_name} on Gist Bird`, text: post.body, url });
        return;
      } catch {
        // fallback to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      showToast('Link copied');
    } catch {
      showToast('Could not copy link');
    }
  };

  const handleSelectAuthor = (author: FeedAuthor) => {
    setAuthorPreview({
      displayName: author.display_name,
      userTag: author.user_tag,
      avatar: author.avatar ?? '/avatars/avatar-01.svg',
      photoUrl: author.photo_url,
      scarf: author.scarf,
      university: author.university,
      interests: [],
      isOwnProfile: author.id === profile.id,
    });
  };

  return (
    <main className="min-h-[calc(100dvh-88px)] bg-bg pb-24">
      {/* Sticky Header + School Scope Tabs */}
      <header className="sticky top-0 z-30 border-b border-line bg-surface/95 px-4 pb-2.5 pt-[max(1rem,env(safe-area-inset-top))] backdrop-blur-md">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-[22px] font-bold text-ink">Feed</h1>
          <button
            type="button"
            onClick={() => {
              setQuoteTarget(null);
              setComposeOpen(true);
            }}
            className="rounded-full bg-primary px-3.5 py-1.5 text-[12.5px] font-bold text-on-primary shadow-xs transition active:scale-95"
          >
            + Dump thought
          </button>
        </div>

        {/* Scope Segmented Pills */}
        <div className="mt-2.5 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setScope('all')}
            className={`flex-1 rounded-full py-1.5 text-[12px] font-bold transition active:scale-95 ${
              scope === 'all'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-alt text-muted hover:text-ink'
            }`}
          >
            🌍 All Schools
          </button>
          <button
            type="button"
            onClick={() => setScope('campus')}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-full px-2 py-1.5 text-[12px] font-bold transition active:scale-95 ${
              scope === 'campus'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-alt text-muted hover:text-ink'
            }`}
          >
            {userUni && <UniversityLogo university={userUni} size={13} />}
            <span className="truncate">{userUniMeta?.shortName || 'My School'}</span>
          </button>
          <button
            type="button"
            onClick={() => setScope('bookmarks')}
            className={`rounded-full px-3 py-1.5 text-[12px] font-bold transition active:scale-95 ${
              scope === 'bookmarks'
                ? 'bg-primary text-on-primary shadow-xs'
                : 'bg-surface-alt text-muted hover:text-ink'
            }`}
          >
            🔖 Saved
          </button>
        </div>
      </header>

      {/* New Posts Floating Pill */}
      <AnimatePresence>
        {hasNewPosts && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="sticky top-28 z-30 flex justify-center pt-2"
          >
            <button
              type="button"
              onClick={() => {
                setHasNewPosts(false);
                window.scrollTo({ top: 0, behavior: 'smooth' });
                router.refresh();
              }}
              className="rounded-full bg-primary px-4 py-1.5 text-[12px] font-bold text-on-primary shadow-lg transition active:scale-95"
            >
              ↑ New posts available
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feed Stream */}
      {scope === 'campus' && !userUni ? (
        <div className="mx-5 mt-8 rounded-card border border-line bg-surface p-6 text-center">
          <p className="font-display text-[17px] font-bold text-ink">Set your campus first</p>
          <p className="mt-1 text-[13px] text-muted">
            Pick your university in your profile so we can filter posts from your school.
          </p>
          <Link
            href="/me/edit"
            className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-btn bg-primary px-5 text-[13px] font-bold text-on-primary"
          >
            Choose My University
          </Link>
        </div>
      ) : visiblePosts.length === 0 ? (
        <div className="mx-5 mt-8 rounded-card border border-line bg-surface p-6 text-center">
          <p className="text-3xl">💭</p>
          <p className="mt-2 font-display text-[17px] font-bold text-ink">
            {scope === 'bookmarks'
              ? 'No saved posts yet'
              : scope === 'campus'
              ? `No posts from ${userUniMeta?.shortName || 'your school'} yet`
              : 'Be the first to dump a thought'}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            {scope === 'bookmarks'
              ? 'Tap the bookmark icon on any post to save it here.'
              : 'Share what is happening on campus right now.'}
          </p>
          {scope !== 'bookmarks' && (
            <button
              type="button"
              onClick={() => {
                setQuoteTarget(null);
                setComposeOpen(true);
              }}
              className="mt-4 inline-flex min-h-[42px] items-center justify-center rounded-btn bg-primary px-5 text-[13px] font-bold text-on-primary active:scale-95 transition"
            >
              Write a post
            </button>
          )}
        </div>
      ) : (
        <div>
          {visiblePosts.map((post) => (
            <FeedPostCard
              key={post.id}
              post={post}
              me={profile.id}
              onLike={handleLike}
              onRepost={handleRepost}
              onQuote={(p) => {
                setQuoteTarget(p);
                setComposeOpen(true);
              }}
              onBookmark={handleBookmark}
              onDelete={handleDelete}
              onShare={handleShare}
              onSelectAuthor={handleSelectAuthor}
            />
          ))}
        </div>
      )}

      {/* Floating Compose FAB */}
      <button
        type="button"
        onClick={() => {
          setQuoteTarget(null);
          setComposeOpen(true);
        }}
        aria-label="New post"
        className="fixed bottom-24 right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-on-primary shadow-xl transition active:scale-90 sm:right-[calc(50%-224px)]"
      >
        +
      </button>

      {/* Compose / Quote Modal */}
      <FeedComposeModal
        open={composeOpen}
        profile={profile}
        quotePost={quoteTarget}
        onClose={() => {
          setComposeOpen(false);
          setQuoteTarget(null);
        }}
        onSubmit={handleCreatePost}
      />

      {/* Author Profile Preview */}
      {authorPreview && (
        <ProfilePreviewModal
          open={Boolean(authorPreview)}
          onClose={() => setAuthorPreview(null)}
          data={authorPreview}
        />
      )}

      {/* Toast Pill */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-none fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
