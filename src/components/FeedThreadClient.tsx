'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { FeedPostCard } from './FeedPostCard';
import { FeedComposeModal } from './FeedComposeModal';
import { ProfilePreviewModal, type ProfilePreviewData } from './ProfilePreviewModal';
import { Icon } from './Icon';
import { Avatar } from './ui';
import {
  createFeedPost,
  deleteFeedPost,
  toggleFeedBookmark,
  toggleFeedLike,
  toggleFeedRepost,
} from '@/app/actions/feed';
import type { FeedAuthor, FeedPost, Profile } from '@/lib/types';

export function FeedThreadClient({
  initialRoot,
  initialReplies,
  profile,
}: {
  initialRoot: FeedPost;
  initialReplies: FeedPost[];
  profile: Profile;
}) {
  const router = useRouter();
  const [root, setRoot] = useState<FeedPost>(initialRoot);
  const [replies, setReplies] = useState<FeedPost[]>(initialReplies);
  const [replyText, setReplyText] = useState('');
  const [sending, setSending] = useState(false);
  const [quoteTarget, setQuoteTarget] = useState<FeedPost | null>(null);
  const [authorPreview, setAuthorPreview] = useState<ProfilePreviewData | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  };

  const updatePostInState = (postId: string, updater: (p: FeedPost) => FeedPost) => {
    if (root.id === postId) {
      setRoot((r) => updater(r));
    } else {
      setReplies((prev) => prev.map((p) => (p.id === postId ? updater(p) : p)));
    }
  };

  const handleLike = async (postId: string) => {
    updatePostInState(postId, (p) => ({
      ...p,
      liked_by_me: !p.liked_by_me,
      likes_count: p.liked_by_me ? Math.max(0, p.likes_count - 1) : p.likes_count + 1,
    }));
    await toggleFeedLike(postId);
  };

  const handleRepost = async (postId: string) => {
    updatePostInState(postId, (p) => ({
      ...p,
      reposted_by_me: !p.reposted_by_me,
      reposts_count: p.reposted_by_me ? Math.max(0, p.reposts_count - 1) : p.reposts_count + 1,
    }));
    const res = await toggleFeedRepost(postId);
    if (!res.error) showToast(res.reposted ? 'Reposted' : 'Removed repost');
  };

  const handleBookmark = async (postId: string) => {
    updatePostInState(postId, (p) => ({
      ...p,
      bookmarked_by_me: !p.bookmarked_by_me,
    }));
    const res = await toggleFeedBookmark(postId);
    if (!res.error) showToast(res.bookmarked ? 'Saved' : 'Removed from Saved');
  };

  const handleDelete = async (postId: string) => {
    const res = await deleteFeedPost(postId);
    if (res.error) {
      showToast(res.error);
      return;
    }
    if (postId === root.id) {
      router.push('/feed');
      router.refresh();
    } else {
      setReplies((prev) => prev.filter((p) => p.id !== postId));
      setRoot((r) => ({ ...r, replies_count: Math.max(0, r.replies_count - 1) }));
      showToast('Reply deleted');
    }
  };

  const handleShare = async (post: FeedPost) => {
    const url = `${window.location.origin}/feed/${post.id}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `${post.author.display_name} on Gist Bird`, text: post.body, url });
        return;
      } catch {
        // fallback
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

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = replyText.trim();
    if (!trimmed || sending) return;
    setSending(true);
    const res = await createFeedPost({ body: trimmed, replyToId: root.id });
    setSending(false);
    if (res.error) {
      showToast(res.error);
      return;
    }
    const optimisticReply: FeedPost = {
      id: res.id || `temp-${Date.now()}`,
      author_id: profile.id,
      body: trimmed,
      university: profile.university ?? null,
      reply_to_id: root.id,
      quote_of_id: null,
      created_at: new Date().toISOString(),
      author: {
        id: profile.id,
        display_name: profile.display_name,
        user_tag: profile.user_tag,
        avatar: profile.avatar,
        photo_url: profile.photo_url,
        scarf: profile.scarf,
        university: profile.university,
      },
      likes_count: 0,
      reposts_count: 0,
      replies_count: 0,
      liked_by_me: false,
      reposted_by_me: false,
      bookmarked_by_me: false,
    };
    setReplies((prev) => [...prev, optimisticReply]);
    setRoot((r) => ({ ...r, replies_count: r.replies_count + 1 }));
    setReplyText('');
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh flex-col bg-bg">
      {/* Header */}
      <header className="sticky top-0 z-30 flex h-[56px] items-center gap-3 border-b border-line bg-surface/95 px-3 backdrop-blur-md">
        <Link
          href="/feed"
          aria-label="Back to feed"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface text-ink active:scale-90 transition"
        >
          <Icon name="back" size={20} />
        </Link>
        <h1 className="font-display text-[18px] font-bold text-ink">Post</h1>
      </header>

      {/* Root Post + Replies */}
      <div className="flex-1 pb-24">
        <FeedPostCard
          post={root}
          me={profile.id}
          isDetail
          onLike={handleLike}
          onRepost={handleRepost}
          onQuote={(p) => setQuoteTarget(p)}
          onBookmark={handleBookmark}
          onDelete={handleDelete}
          onShare={handleShare}
          onSelectAuthor={handleSelectAuthor}
        />

        <div className="border-b border-line/60 bg-surface-alt/40 px-4 py-2 text-[12px] font-bold uppercase tracking-wider text-muted">
          Replies ({replies.length})
        </div>

        {replies.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-muted">
            No replies yet. Start the conversation below!
          </p>
        ) : (
          <div>
            {replies.map((rep) => (
              <FeedPostCard
                key={rep.id}
                post={rep}
                me={profile.id}
                onLike={handleLike}
                onRepost={handleRepost}
                onQuote={(p) => setQuoteTarget(p)}
                onBookmark={handleBookmark}
                onDelete={handleDelete}
                onShare={handleShare}
                onSelectAuthor={handleSelectAuthor}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Reply Bar */}
      <form
        onSubmit={handleSendReply}
        className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[480px] -translate-x-1/2 items-center gap-2.5 border-t border-line bg-surface px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))]"
      >
        <Avatar
          name={profile.display_name}
          scarf={profile.scarf}
          avatar={profile.photo_url || profile.avatar}
          size={34}
        />
        <input
          type="text"
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          maxLength={5000}
          placeholder="Post your reply…"
          className="h-10 min-w-0 flex-1 rounded-full border border-line bg-bg px-4 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none"
        />
        <button
          type="submit"
          disabled={!replyText.trim() || sending}
          className="rounded-full bg-primary px-4 py-2 text-[13px] font-bold text-on-primary transition active:scale-95 disabled:opacity-40"
        >
          {sending ? '…' : 'Reply'}
        </button>
      </form>

      <FeedComposeModal
        open={Boolean(quoteTarget)}
        profile={profile}
        quotePost={quoteTarget}
        onClose={() => setQuoteTarget(null)}
        onSubmit={async (body, quoteOfId) => {
          const res = await createFeedPost({ body, quoteOfId });
          if (!res.error) showToast('Quoted!');
          return res;
        }}
      />

      {authorPreview && (
        <ProfilePreviewModal
          open={Boolean(authorPreview)}
          onClose={() => setAuthorPreview(null)}
          data={authorPreview}
        />
      )}

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
