'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, timeAgo } from './ui';
import { Icon } from './Icon';
import { UniversityLogo } from './UniversityLogo';
import { findUniversity } from '@/lib/universities';
import type { FeedAuthor, FeedPost } from '@/lib/types';

interface FeedPostCardProps {
  post: FeedPost;
  me: string;
  onLike: (postId: string) => void;
  onRepost: (postId: string) => void;
  onQuote: (post: FeedPost) => void;
  onBookmark: (postId: string) => void;
  onDelete: (postId: string) => void;
  onShare: (post: FeedPost) => void;
  onSelectAuthor: (author: FeedAuthor) => void;
  isDetail?: boolean;
}

export function FeedPostCard({
  post,
  me,
  onLike,
  onRepost,
  onQuote,
  onBookmark,
  onDelete,
  onShare,
  onSelectAuthor,
  isDetail = false,
}: FeedPostCardProps) {
  const router = useRouter();
  const [showRepostMenu, setShowRepostMenu] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  const isMine = post.author_id === me;
  const uni = findUniversity(post.author.university || post.university || undefined);
  const handle = `@${(post.author.user_tag || post.author.display_name).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'bird'}`;
  const avatarSrc = post.author.photo_url || post.author.avatar;

  const openThread = () => {
    if (!isDetail) {
      router.push(`/feed/${post.id}`);
    }
  };

  return (
    <article className="relative border-b border-line/70 bg-surface px-4 py-3.5 transition-colors">
      <div className="flex items-start gap-3">
        {/* Tappable Author Avatar */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelectAuthor(post.author);
          }}
          aria-label={`View ${post.author.display_name}'s profile`}
          className="shrink-0 rounded-full transition active:scale-95"
        >
          <Avatar
            name={post.author.display_name}
            scarf={post.author.scarf}
            avatar={avatarSrc}
            size={42}
          />
        </button>

        <div className="min-w-0 flex-1">
          {/* Header Row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectAuthor(post.author);
                  }}
                  className="truncate font-display text-[15px] font-bold text-ink hover:underline"
                >
                  {post.author.display_name}
                </button>
                <span className="truncate text-[12px] text-muted">{handle}</span>
                <span className="text-[12px] text-muted">·</span>
                <span className="shrink-0 text-[12px] text-muted" suppressHydrationWarning>
                  {timeAgo(post.created_at)}
                </span>
              </div>

              {(uni || post.university) && (
                <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-primary">
                  <UniversityLogo university={post.author.university || post.university || ''} size={13} />
                  <span className="truncate">{uni?.shortName || post.university}</span>
                </div>
              )}
            </div>

            {/* More Menu (⋯) */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMoreMenu((v) => !v);
                  setShowRepostMenu(false);
                }}
                aria-label="Post options"
                className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-surface-alt hover:text-ink transition active:scale-90"
              >
                <Icon name="more" size={18} />
              </button>

              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.92, y: -4 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.92, y: -4 }}
                    transition={{ duration: 0.14 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 top-8 z-30 w-44 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-xl"
                  >
                    {isMine ? (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          onDelete(post.id);
                        }}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold text-danger hover:bg-danger/10"
                      >
                        <Icon name="trash" size={16} />
                        <span>Delete post</span>
                      </button>
                    ) : (
                      <Link
                        href="/report"
                        onClick={() => setShowMoreMenu(false)}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold text-danger hover:bg-danger/10"
                      >
                        <Icon name="flag" size={16} />
                        <span>Report user</span>
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Post Body */}
          <div
            onClick={openThread}
            className={`mt-1.5 ${isDetail ? '' : 'cursor-pointer'}`}
          >
            <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed text-ink">
              {post.body}
            </p>
          </div>

          {/* Embedded Quote Post */}
          {post.quote_of && (
            <Link
              href={`/feed/${post.quote_of.id}`}
              onClick={(e) => e.stopPropagation()}
              className="mt-2.5 block rounded-2xl border border-line bg-bg/60 p-3 transition hover:bg-surface-alt/50 active:scale-[0.99]"
            >
              <div className="flex items-center gap-1.5">
                <Avatar
                  name={post.quote_of.author.display_name}
                  scarf={post.quote_of.author.scarf}
                  avatar={post.quote_of.author.photo_url || post.quote_of.author.avatar}
                  size={20}
                />
                <span className="truncate font-display text-[13px] font-bold text-ink">
                  {post.quote_of.author.display_name}
                </span>
                <span className="truncate text-[11px] text-muted">
                  @{((post.quote_of.author.user_tag || post.quote_of.author.display_name).toLowerCase().replace(/[^a-z0-9_]/g, '') || 'bird')}
                </span>
                <span className="text-[11px] text-muted">· {timeAgo(post.quote_of.created_at)}</span>
              </div>
              <p className="mt-1 line-clamp-3 whitespace-pre-wrap break-words text-[13.5px] leading-snug text-ink/90">
                {post.quote_of.body}
              </p>
            </Link>
          )}

          {/* X-Style Action Bar */}
          <div className="mt-2.5 flex items-center justify-between pr-2 text-muted">
            {/* Reply */}
            <Link
              href={`/feed/${post.id}`}
              onClick={(e) => e.stopPropagation()}
              aria-label="Reply"
              className="group flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold transition hover:bg-primary/10 hover:text-primary active:scale-90"
            >
              <Icon name="chat" size={17} />
              <span>{post.replies_count > 0 ? post.replies_count : ''}</span>
            </Link>

            {/* Repost / Quote */}
            <div className="relative">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowRepostMenu((v) => !v);
                  setShowMoreMenu(false);
                }}
                aria-label="Repost or Quote"
                className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold transition active:scale-90 ${
                  post.reposted_by_me
                    ? 'text-primary'
                    : 'hover:bg-primary/10 hover:text-primary'
                }`}
              >
                <Icon name="repost" size={17} />
                <span>{post.reposts_count > 0 ? post.reposts_count : ''}</span>
              </button>

              <AnimatePresence>
                {showRepostMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 6 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9, y: 6 }}
                    transition={{ duration: 0.14 }}
                    onClick={(e) => e.stopPropagation()}
                    className="absolute bottom-9 left-0 z-30 w-40 overflow-hidden rounded-2xl border border-line bg-surface p-1 shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={() => {
                        setShowRepostMenu(false);
                        onRepost(post.id);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold text-ink hover:bg-surface-alt"
                    >
                      <Icon name="repost" size={15} className="text-primary" />
                      <span>{post.reposted_by_me ? 'Undo repost' : 'Repost'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowRepostMenu(false);
                        onQuote(post);
                      }}
                      className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[13px] font-bold text-ink hover:bg-surface-alt"
                    >
                      <Icon name="pen" size={15} className="text-primary" />
                      <span>Quote post</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Like */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onLike(post.id);
              }}
              aria-label={post.liked_by_me ? 'Unlike' : 'Like'}
              className={`flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] font-semibold transition ${
                post.liked_by_me
                  ? 'text-coral'
                  : 'hover:bg-coral/10 hover:text-coral'
              }`}
            >
              <svg
                width={17}
                height={17}
                viewBox="0 0 24 24"
                fill={post.liked_by_me ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M12 21s-8-5-8-11a4.5 4.5 0 018-2.5A4.5 4.5 0 0120 10c0 6-8 11-8 11z" />
              </svg>
              <span>{post.likes_count > 0 ? post.likes_count : ''}</span>
            </motion.button>

            {/* Bookmark */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                onBookmark(post.id);
              }}
              aria-label={post.bookmarked_by_me ? 'Remove bookmark' : 'Bookmark'}
              className={`flex items-center rounded-full p-1.5 transition ${
                post.bookmarked_by_me
                  ? 'text-primary'
                  : 'hover:bg-primary/10 hover:text-primary'
              }`}
            >
              <svg
                width={16}
                height={16}
                viewBox="0 0 24 24"
                fill={post.bookmarked_by_me ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z" />
              </svg>
            </motion.button>

            {/* Share */}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onShare(post);
              }}
              aria-label="Share post"
              className="flex items-center rounded-full p-1.5 transition hover:bg-primary/10 hover:text-primary active:scale-90"
            >
              <Icon name="share" size={16} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
