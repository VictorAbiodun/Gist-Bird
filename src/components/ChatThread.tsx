'use client';

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { Avatar, Notice, LinkButton } from './ui';
import { STARTERS, CONTACT_UNLOCK_MESSAGES } from '@/lib/copy';
import { CONTACT_NOTICE, hasContactInfo } from '@/lib/contentFilter';
import {
  sendMessage,
  markChatRead,
  toggleMessageReaction,
  leaveChat,
  deleteMessageForMe,
  deleteMessageForEveryone,
  editChatMessage,
  toggleStarMessage,
  togglePinMessage,
  clearChatForMe,
  toggleMuteChat,
} from '@/app/actions/chat';
import { Icon } from './Icon';
import BirdTypingAnimation from './BirdTypingAnimation';
import { formatMessageTime, formatDateDivider } from '@/lib/date';
import { CHAT_EMOJIS, getEmoji } from '@/lib/emojis';
import { enqueueMessage, getQueuedMessages, removeQueuedMessage } from '@/lib/offlineQueue';
import { playSendSound, playReceiveSound, isSoundMuted, setSoundMuted } from '@/lib/sounds';
import { ProfilePreviewModal, type ProfilePreviewData } from './ProfilePreviewModal';
import {
  DeleteMessageModal,
  EditMessageModal,
  ForwardShareModal,
  MessageInfoModal,
  StarredMessagesDrawer,
  ClearChatModal,
} from './ChatModals';
import type { Message, Scarf, MessageReactionsMap, MessageRepliesMap, ChatMessageMeta, ChatRow } from '@/lib/types';

interface ChatThreadProps {
  chatId: string;
  me: string;
  initial: Message[];
  otherStarter: string | null;
  otherName: string;
  otherScarf?: Scarf;
  otherAvatar?: string | null;
  paperBody: string;
  blocked?: boolean;
  initialOtherLastReadAt?: string | null;
  initialReactions?: MessageReactionsMap;
  initialReplies?: MessageRepliesMap;
  initialMeta?: ChatMessageMeta;
  forwardTargets?: ChatRow[];
  otherProfilePreview?: ProfilePreviewData | null;
}

export function ChatThread({
  chatId,
  me,
  initial,
  otherStarter,
  otherName,
  otherScarf,
  otherAvatar,
  paperBody,
  blocked: isBlocked = false,
  initialOtherLastReadAt = null,
  initialReactions = {},
  initialReplies = {},
  initialMeta,
  forwardTargets = [],
  otherProfilePreview = null,
}: ChatThreadProps) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>(initial);
  const [text, setText] = useState('');
  const [error, setError] = useState<string>();
  const [showPaper, setShowPaper] = useState(false);
  const [viewportHeight, setViewportHeight] = useState<number | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherLastReadAt, setOtherLastReadAt] = useState<string | null>(initialOtherLastReadAt);
  const [reactions, setReactions] = useState<MessageReactionsMap>(initialReactions);
  const [activeReactionMenuMsgId, setActiveReactionMenuMsgId] = useState<number | null>(null);
  const [isOffline, setIsOffline] = useState(false);
  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const [soundMuted, setSoundMutedState] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);
  const [chatEnded, setChatEnded] = useState(false);
  const [showFriendProfile, setShowFriendProfile] = useState(false);
  const [replyMap, setReplyMap] = useState<MessageRepliesMap>(initialReplies);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [focusedThreadRootId, setFocusedThreadRootId] = useState<number | null>(null);
  const [deletedForMe, setDeletedForMe] = useState<number[]>(initialMeta?.deletedForMeIds ?? []);
  const [deletedForAll, setDeletedForAll] = useState<number[]>(initialMeta?.deletedForAllIds ?? []);
  const [editedIds, setEditedIds] = useState<number[]>(initialMeta?.editedIds ?? []);
  const [starredIds, setStarredIds] = useState<number[]>(initialMeta?.starredIds ?? []);
  const [pinnedMessageId, setPinnedMessageId] = useState<number | null>(initialMeta?.pinnedMessageId ?? null);
  const [clearedAt, setClearedAt] = useState<string | null>(initialMeta?.clearedAt ?? null);
  const [isMuted, setIsMuted] = useState<boolean>(initialMeta?.isMuted ?? false);
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchMatchIdx, setSearchMatchIdx] = useState(0);
  const [showStarredDrawer, setShowStarredDrawer] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteModalMsg, setDeleteModalMsg] = useState<Message | null>(null);
  const [editModalMsg, setEditModalMsg] = useState<Message | null>(null);
  const [forwardModalMsg, setForwardModalMsg] = useState<Message | null>(null);
  const [infoModalMsg, setInfoModalMsg] = useState<Message | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const bottom = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messageRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null);
  const lastTypingSentRef = useRef(0);
  const stopTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearOtherTypingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Synchronize height with window.visualViewport to keep input firmly above mobile keyboards
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const vv = window.visualViewport;
    if (!vv) return;

    const handleViewportChange = () => {
      setViewportHeight(vv.height);
      // Lock window scroll so header never disappears off top
      if (window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
    };

    setViewportHeight(vv.height);
    vv.addEventListener('resize', handleViewportChange);
    vv.addEventListener('scroll', handleViewportChange);

    return () => {
      vv.removeEventListener('resize', handleViewportChange);
      vv.removeEventListener('scroll', handleViewportChange);
    };
  }, []);

  const flushOfflineQueue = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const queued = getQueuedMessages(chatId);
    if (queued.length === 0) return;

    setIsSyncingQueue(true);
    for (const item of queued) {
      try {
        const r = await sendMessage({ chatId, body: item.body, replyToId: item.replyToId });
        if (!r.error) {
          removeQueuedMessage(item.tempId);
          if (item.replyToId && r.messageId) {
            const msgId = r.messageId;
            const rId = item.replyToId;
            setReplyMap((prev) => ({ ...prev, [msgId]: rId }));
            channelRef.current
              ?.send({ type: 'broadcast', event: 'reply_link', payload: { messageId: msgId, replyToId: rId } })
              .catch(() => {});
          }
          playSendSound();
        }
      } catch {
        // Stop flushing if network drops again
        break;
      }
    }

    try {
      const { data } = await createClient()
        .from('messages')
        .select('*')
        .eq('chat_id', chatId)
        .order('id')
        .limit(300);
      const remaining = getQueuedMessages(chatId).map((q) => ({
        id: q.tempId,
        chat_id: q.chatId,
        sender_id: me,
        body: q.body,
        created_at: q.createdAt,
      }));
      if (data) setMessages([...(data as Message[]), ...remaining]);
    } catch {
      // ignore
    } finally {
      setIsSyncingQueue(false);
    }
  }, [chatId, me]);

  // Initialize sound preference, queued offline messages, and online/offline listeners
  useEffect(() => {
    setSoundMutedState(isSoundMuted());
    setIsOffline(typeof navigator !== 'undefined' ? !navigator.onLine : false);

    const queued = getQueuedMessages(chatId);
    if (queued.length > 0) {
      setMessages((prev) => {
        const existingIds = new Set(prev.map((m) => m.id));
        const toAdd = queued
          .filter((q) => !existingIds.has(q.tempId))
          .map((q) => ({
            id: q.tempId,
            chat_id: q.chatId,
            sender_id: me,
            body: q.body,
            created_at: q.createdAt,
          }));
        return toAdd.length > 0 ? [...prev, ...toAdd] : prev;
      });
      if (typeof navigator !== 'undefined' && navigator.onLine) {
        flushOfflineQueue();
      }
    }

    const handleOnline = () => {
      setIsOffline(false);
      flushOfflineQueue();
    };
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [chatId, me, flushOfflineQueue]);

  // Real-time message subscription + live typing broadcast & read receipts
  useEffect(() => {
    const supabase = createClient();

    const dispatchRead = () => {
      markChatRead(chatId).catch(() => {});
      ch.send({
        type: 'broadcast',
        event: 'read_receipt',
        payload: { readerId: me, readAt: new Date().toISOString() },
      }).catch(() => {});
    };

    const ch = supabase
      .channel(`chat:${chatId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
        (p) => {
          const msg = p.new as Message;
          if (msg.sender_id !== me) {
            setOtherTyping(false);
            playReceiveSound();
            dispatchRead();
          }
          setMessages((m) => (m.some((x) => x.id === msg.id) ? m : [...m, msg]));
        }
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (!payload || payload.userId === me) return;
        const active = Boolean(payload.isTyping);
        setOtherTyping(active);
        if (clearOtherTypingTimerRef.current) clearTimeout(clearOtherTypingTimerRef.current);
        if (active) {
          clearOtherTypingTimerRef.current = setTimeout(() => setOtherTyping(false), 3500);
        }
      })
      .on('broadcast', { event: 'read_receipt' }, ({ payload }) => {
        if (!payload || payload.readerId === me || !payload.readAt) return;
        setOtherLastReadAt(payload.readAt);
      })
      .on('broadcast', { event: 'chat_ended' }, ({ payload }) => {
        if (!payload || payload.byUserId === me) return;
        setChatEnded(true);
      })
      .on('broadcast', { event: 'reply_link' }, ({ payload }) => {
        if (!payload || !payload.messageId || !payload.replyToId) return;
        setReplyMap((prev) => ({
          ...prev,
          [Number(payload.messageId)]: Number(payload.replyToId),
        }));
      })
      .on('broadcast', { event: 'msg_deleted_all' }, ({ payload }) => {
        const msgId = Number(payload?.messageId);
        if (msgId > 0) {
          setDeletedForAll((prev) => (prev.includes(msgId) ? prev : [...prev, msgId]));
        }
      })
      .on('broadcast', { event: 'msg_edited' }, ({ payload }) => {
        const msgId = Number(payload?.messageId);
        const newBody = typeof payload?.newBody === 'string' ? payload.newBody : '';
        if (msgId > 0 && newBody) {
          setMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, body: newBody } : m)));
          setEditedIds((prev) => (prev.includes(msgId) ? prev : [...prev, msgId]));
        }
      })
      .on('broadcast', { event: 'chat_pinned' }, ({ payload }) => {
        setPinnedMessageId(payload?.pinnedMessageId ? Number(payload.pinnedMessageId) : null);
      })
      .on('broadcast', { event: 'reaction_broadcast' }, ({ payload }) => {
        if (!payload || !payload.messageId || !payload.emoji || !payload.userId) return;
        const { messageId, emoji, userId, action } = payload;
        setReactions((prev) => {
          const list = (prev[messageId] ? [...prev[messageId]] : []).map((r) => ({
            ...r,
            users: [...r.users],
          }));

          if (action === 'remove') {
            const idx = list.findIndex((r) => r.emoji === emoji);
            if (idx >= 0) {
              list[idx].users = list[idx].users.filter((u) => u !== userId);
              if (list[idx].users.length === 0) list.splice(idx, 1);
            }
          } else {
            for (const r of list) {
              r.users = r.users.filter((u) => u !== userId);
            }
            const target = list.find((r) => r.emoji === emoji);
            if (target) {
              if (!target.users.includes(userId)) target.users.push(userId);
            } else {
              list.push({ emoji, users: [userId] });
            }
          }
          return { ...prev, [messageId]: list.filter((r) => r.users.length > 0) };
        });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          dispatchRead();
        }
      });

    channelRef.current = ch;
    return () => {
      channelRef.current = null;
      if (clearOtherTypingTimerRef.current) clearTimeout(clearOtherTypingTimerRef.current);
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
      supabase.removeChannel(ch);
    };
  }, [chatId, me]);

  // Auto-scroll to bottom when messages or typing indicator update
  useEffect(() => {
    bottom.current?.scrollIntoView({ block: 'end' });
  }, [messages.length, otherTyping]);

  const broadcastTyping = (isTyping: boolean) => {
    const ch = channelRef.current;
    if (!ch) return;
    ch.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: me, isTyping },
    }).catch(() => {});
  };

  const handleReactionSelect = (messageId: number, emojiKey: string) => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setActiveReactionMenuMsgId(null);

    setReactions((prev) => {
      const list = (prev[messageId] ? [...prev[messageId]] : []).map((r) => ({
        ...r,
        users: [...r.users],
      }));
      const alreadyReactedWithThis = list.some(
        (r) => r.emoji === emojiKey && r.users.includes(me)
      );

      let action: 'add' | 'remove' = 'add';
      if (alreadyReactedWithThis) {
        action = 'remove';
        const idx = list.findIndex((r) => r.emoji === emojiKey);
        if (idx >= 0) {
          list[idx].users = list[idx].users.filter((u) => u !== me);
          if (list[idx].users.length === 0) list.splice(idx, 1);
        }
      } else {
        action = 'add';
        for (const r of list) {
          r.users = r.users.filter((u) => u !== me);
        }
        const target = list.find((r) => r.emoji === emojiKey);
        if (target) {
          if (!target.users.includes(me)) target.users.push(me);
        } else {
          list.push({ emoji: emojiKey, users: [me] });
        }
      }

      channelRef.current
        ?.send({
          type: 'broadcast',
          event: 'reaction_broadcast',
          payload: { messageId, emoji: emojiKey, userId: me, action },
        })
        .catch(() => {});

      toggleMessageReaction({ chatId, messageId, emoji: emojiKey }).catch(() => {});

      return { ...prev, [messageId]: list.filter((r) => r.users.length > 0) };
    });
  };

  const handleTextChange = (val: string) => {
    setText(val);
    const now = Date.now();
    if (val.trim().length > 0) {
      if (now - lastTypingSentRef.current > 1100) {
        lastTypingSentRef.current = now;
        broadcastTyping(true);
      }
      if (stopTypingTimerRef.current) clearTimeout(stopTypingTimerRef.current);
      stopTypingTimerRef.current = setTimeout(() => {
        broadcastTyping(false);
      }, 2200);
    } else {
      broadcastTyping(false);
    }
  };

  const locked = messages.length < CONTACT_UNLOCK_MESSAGES;
  const hasContact = useMemo(() => locked && hasContactInfo(text), [locked, text]);
  const starters = otherStarter ? [otherStarter, ...STARTERS] : STARTERS;

  const messagesById = useMemo(() => {
    const map = new Map<number, Message>();
    for (const msg of messages) map.set(msg.id, msg);
    return map;
  }, [messages]);

  const repliesByParent = useMemo(() => {
    const map = new Map<number, Message[]>();
    for (const msg of messages) {
      const parentId = replyMap[msg.id];
      if (!parentId) continue;
      const list = map.get(parentId) ?? [];
      list.push(msg);
      map.set(parentId, list);
    }
    return map;
  }, [messages, replyMap]);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastMsg(null), 2400);
  }, []);

  const visibleMessages = useMemo(() => {
    const delSet = new Set(deletedForMe);
    const clearTime = clearedAt ? new Date(clearedAt).getTime() : 0;
    return messages.filter((m) => {
      if (delSet.has(m.id)) return false;
      if (clearTime && new Date(m.created_at).getTime() <= clearTime) return false;
      return true;
    });
  }, [messages, deletedForMe, clearedAt]);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    const delAllSet = new Set(deletedForAll);
    return visibleMessages
      .filter((m) => !delAllSet.has(m.id) && m.body.toLowerCase().includes(q))
      .map((m) => m.id);
  }, [visibleMessages, searchQuery, deletedForAll]);

  const starredMessages = useMemo(() => {
    const sSet = new Set(starredIds);
    const delAllSet = new Set(deletedForAll);
    return visibleMessages.filter((m) => sSet.has(m.id) && !delAllSet.has(m.id));
  }, [visibleMessages, starredIds, deletedForAll]);

  const scrollToMessage = useCallback((msgId: number) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  const startReply = (msg: Message) => {
    if (msg.id < 0 || deletedForAll.includes(msg.id)) return;
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setActiveReactionMenuMsgId(null);
    setReplyingTo(msg);
    setTimeout(() => inputRef.current?.focus(), 40);
  };

  const handleCopyMessage = async (msg: Message) => {
    setActiveReactionMenuMsgId(null);
    try {
      await navigator.clipboard.writeText(msg.body);
      showToast('Copied to clipboard');
    } catch {
      showToast('Could not copy');
    }
  };

  const handleToggleStar = async (msg: Message) => {
    setActiveReactionMenuMsgId(null);
    const wasStarred = starredIds.includes(msg.id);
    setStarredIds((prev) =>
      wasStarred ? prev.filter((id) => id !== msg.id) : [...prev, msg.id]
    );
    showToast(wasStarred ? 'Removed from Starred' : 'Message starred ⭐');
    await toggleStarMessage(chatId, msg.id).catch(() => {});
  };

  const handleTogglePin = async (msg: Message) => {
    setActiveReactionMenuMsgId(null);
    const nextPin = pinnedMessageId === msg.id ? null : msg.id;
    setPinnedMessageId(nextPin);
    channelRef.current
      ?.send({
        type: 'broadcast',
        event: 'chat_pinned',
        payload: { pinnedMessageId: nextPin },
      })
      .catch(() => {});
    showToast(nextPin ? 'Message pinned 📌' : 'Message unpinned');
    await togglePinMessage(chatId, nextPin).catch(() => {});
  };

  const handleDeleteForMe = async (msg: Message) => {
    setDeleteModalMsg(null);
    setDeletedForMe((prev) => (prev.includes(msg.id) ? prev : [...prev, msg.id]));
    showToast('Deleted for you');
    await deleteMessageForMe(chatId, msg.id).catch(() => {});
  };

  const handleDeleteForEveryone = async (msg: Message) => {
    setDeleteModalMsg(null);
    setDeletedForAll((prev) => (prev.includes(msg.id) ? prev : [...prev, msg.id]));
    if (pinnedMessageId === msg.id) setPinnedMessageId(null);
    channelRef.current
      ?.send({
        type: 'broadcast',
        event: 'msg_deleted_all',
        payload: { messageId: msg.id },
      })
      .catch(() => {});
    showToast('Deleted for everyone');
    await deleteMessageForEveryone(chatId, msg.id).catch(() => {});
  };

  const handleSaveEdit = async (msg: Message, newBody: string) => {
    if (locked && hasContactInfo(newBody)) {
      setError('Chat first before sharing contact info.');
      setEditModalMsg(null);
      return;
    }
    const res = await editChatMessage({ chatId, messageId: msg.id, body: newBody });
    if (res.error) {
      setError(res.error);
      setEditModalMsg(null);
      return;
    }
    setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, body: newBody } : m)));
    setEditedIds((prev) => (prev.includes(msg.id) ? prev : [...prev, msg.id]));
    setEditModalMsg(null);
    channelRef.current
      ?.send({
        type: 'broadcast',
        event: 'msg_edited',
        payload: { messageId: msg.id, newBody },
      })
      .catch(() => {});
    showToast('Message edited');
  };

  const handleForwardToChat = async (target: ChatRow, msg: Message) => {
    const r = await sendMessage({ chatId: target.id, body: msg.body });
    setForwardModalMsg(null);
    if (r.error) {
      showToast(r.error);
    } else {
      showToast(`Forwarded to ${target.other_name}`);
    }
  };

  const handleShareExternal = async (msg: Message) => {
    setForwardModalMsg(null);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({ text: msg.body });
        return;
      } catch {
        // User cancelled or share failed; fallback to copy
      }
    }
    await handleCopyMessage(msg);
  };

  const handleClearChat = async () => {
    const res = await clearChatForMe(chatId);
    setShowClearModal(false);
    if (res.clearedAt) {
      setClearedAt(res.clearedAt);
      setPinnedMessageId(null);
      showToast('Chat cleared for you');
    }
  };

  const handleToggleMuteChat = async () => {
    setShowHeaderMenu(false);
    const next = !isMuted;
    setIsMuted(next);
    showToast(next ? 'Chat notifications muted 🔕' : 'Chat notifications unmuted 🔔');
    await toggleMuteChat(chatId).catch(() => {});
  };

  function send(body = text) {
    const trimmed = body.trim();
    if (!trimmed || (locked && hasContactInfo(trimmed)) || chatEnded) return;
    setError(undefined);

    const tempId = -Date.now();
    const createdAt = new Date().toISOString();
    const replyToId = replyingTo && replyingTo.id > 0 ? replyingTo.id : undefined;
    const optimisticMsg: Message = {
      id: tempId,
      chat_id: chatId,
      sender_id: me,
      body: trimmed,
      created_at: createdAt,
    };

    // Optimistically show message & clear input immediately
    broadcastTyping(false);
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(12);
    }
    if (replyToId) {
      setReplyMap((prev) => ({ ...prev, [tempId]: replyToId }));
    }
    setMessages((m) => [...m, optimisticMsg]);
    if (body === text) setText('');
    setReplyingTo(null);
    setTimeout(() => bottom.current?.scrollIntoView({ behavior: 'smooth' }), 30);

    // If offline, store in local phone outbox queue for auto-send on reconnect
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      enqueueMessage({ tempId, chatId, body: trimmed, createdAt, replyToId });
      return;
    }

    start(async () => {
      try {
        const r = await sendMessage({ chatId, body: trimmed, replyToId });
        if (r.error) {
          setMessages((m) => m.filter((x) => x.id !== tempId));
          if (body === text) setText(trimmed);
          setError(r.error);
          return;
        }
        if (replyToId && r.messageId) {
          const confirmedId = r.messageId;
          setReplyMap((prev) => {
            const next = { ...prev, [confirmedId]: replyToId };
            delete next[tempId];
            return next;
          });
          channelRef.current
            ?.send({
              type: 'broadcast',
              event: 'reply_link',
              payload: { messageId: confirmedId, replyToId },
            })
            .catch(() => {});
        }
        playSendSound();
        const { data } = await createClient()
          .from('messages')
          .select('*')
          .eq('chat_id', chatId)
          .order('id')
          .limit(300);
        const remaining = getQueuedMessages(chatId).map((q) => ({
          id: q.tempId,
          chat_id: q.chatId,
          sender_id: me,
          body: q.body,
          created_at: q.createdAt,
        }));
        if (data) setMessages([...(data as Message[]), ...remaining]);
      } catch {
        // Network failure mid-flight: queue locally instead of dropping the message
        enqueueMessage({ tempId, chatId, body: trimmed, createdAt, replyToId });
      }
    });
  }

  const toggleMute = () => {
    const next = !soundMuted;
    setSoundMutedState(next);
    setSoundMuted(next);
    if (!next) {
      playSendSound();
    }
  };

  const handleLeaveChat = async () => {
    setIsLeaving(true);
    try {
      await channelRef.current
        ?.send({
          type: 'broadcast',
          event: 'chat_ended',
          payload: { byUserId: me },
        })
        .catch(() => {});

      const res = await leaveChat(chatId);
      if (res.error) {
        setError(res.error);
        setShowLeaveModal(false);
        setIsLeaving(false);
        return;
      }
      router.push('/chats');
      router.refresh();
    } catch {
      setError('Could not leave chat. Please try again.');
      setShowLeaveModal(false);
      setIsLeaving(false);
    }
  };

  const handleInputFocus = () => {
    // When virtual keyboard opens on iOS/Android, ensure viewport lock and scroll to bottom
    setTimeout(() => {
      if (typeof window !== 'undefined' && window.scrollY !== 0) {
        window.scrollTo(0, 0);
      }
      bottom.current?.scrollIntoView({ behavior: 'smooth' });
    }, 120);
  };

  return (
    <div
      className="fixed inset-x-0 top-0 mx-auto flex w-full max-w-[480px] flex-col overflow-hidden bg-bg shadow-sm"
      style={{ height: viewportHeight ? `${viewportHeight}px` : '100dvh' }}
    >
      {/* ── Sleek Official App Header ── */}
      <header className="flex h-[56px] shrink-0 items-center justify-between border-b border-line bg-surface/95 px-3 backdrop-blur-md">
        <div className="flex min-w-0 items-center gap-2.5">
          <Link
            href="/chats"
            aria-label="Back to chats"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-ink active:bg-surface-alt transition"
          >
            <Icon name="back" size={20} />
          </Link>
          <button
            type="button"
            onClick={() => otherProfilePreview && setShowFriendProfile(true)}
            disabled={!otherProfilePreview}
            aria-label={`View ${otherName}'s profile`}
            className="flex min-w-0 items-center gap-2.5 text-left transition active:opacity-75 disabled:cursor-default"
          >
            <Avatar name={otherName} scarf={otherScarf} avatar={otherAvatar} size={36} />
            <div className="min-w-0 flex-1">
              <h1 className="truncate font-display text-[15px] font-bold leading-5 text-ink">{otherName}</h1>
              <p className="flex items-center gap-1 text-[11px] font-semibold text-primary">
                <span className={`inline-block h-1.5 w-1.5 rounded-full bg-primary ${otherTyping ? 'animate-ping' : ''}`} />
                {otherTyping ? 'pecking a reply…' : 'Tap to view profile'}
              </p>
            </div>
          </button>
        </div>

        <div className="relative flex items-center gap-1.5">
          {isMuted && (
            <span title="Chat muted" className="text-[13px] text-muted" aria-label="Muted">
              🔕
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowPaper((prev) => !prev)}
            aria-label={showPaper ? 'Hide paper' : 'View paper'}
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] font-bold transition active:scale-95 ${
              showPaper
                ? 'border-primary bg-primary text-on-primary'
                : 'border-line bg-surface-alt text-ink hover:bg-line'
            }`}
          >
            <Icon name="paper" size={16} />
            <span>Paper</span>
          </button>
          <button
            type="button"
            onClick={() => setShowHeaderMenu((prev) => !prev)}
            aria-label="Chat options"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-ink hover:bg-surface-alt active:scale-95 transition"
          >
            <span className="text-[16px] font-bold leading-none">⋮</span>
          </button>

          <AnimatePresence>
            {showHeaderMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.92, y: -4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: -4 }}
                className="absolute right-0 top-10 z-50 w-52 rounded-2xl border border-line bg-surface p-1.5 shadow-xl"
              >
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowSearch((prev) => !prev);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-surface-alt"
                >
                  <span>🔍</span>
                  <span>Search in chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowStarredDrawer(true);
                  }}
                  className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-surface-alt"
                >
                  <span className="flex items-center gap-2.5">
                    <span>⭐</span>
                    <span>Starred messages</span>
                  </span>
                  {starredMessages.length > 0 && (
                    <span className="text-[11px] font-bold text-primary">{starredMessages.length}</span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleToggleMuteChat}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-surface-alt"
                >
                  <span>{isMuted ? '🔔' : '🔕'}</span>
                  <span>{isMuted ? 'Unmute notifications' : 'Mute notifications'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    toggleMute();
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-surface-alt"
                >
                  <span>{soundMuted ? '🔊' : '🔇'}</span>
                  <span>{soundMuted ? 'Unmute sounds' : 'Mute sounds'}</span>
                </button>
                <div className="my-1 h-[1px] bg-line/70" />
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowClearModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-ink hover:bg-surface-alt"
                >
                  <span>🧹</span>
                  <span>Clear chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowHeaderMenu(false);
                    setShowLeaveModal(true);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-danger hover:bg-danger/10"
                >
                  <span>🕊️</span>
                  <span>Fly away (Leave)</span>
                </button>
                <Link
                  href={`/report?chat=${chatId}`}
                  onClick={() => setShowHeaderMenu(false)}
                  className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-left text-[13px] font-semibold text-danger hover:bg-danger/10"
                >
                  <span>🚩</span>
                  <span>Report or block</span>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* ── Search in Chat Bar ── */}
      {showSearch && (
        <div className="flex shrink-0 items-center gap-2 border-b border-line bg-surface-alt px-3 py-2">
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setSearchMatchIdx(0);
            }}
            placeholder="Search messages…"
            autoFocus
            className="h-9 min-w-0 flex-1 rounded-full border border-line bg-surface px-3.5 text-[13px] text-ink focus:border-primary focus:outline-none"
          />
          {searchQuery.trim() && (
            <span className="shrink-0 text-[11px] font-bold text-muted">
              {searchMatches.length > 0 ? `${searchMatchIdx + 1}/${searchMatches.length}` : '0/0'}
            </span>
          )}
          <button
            type="button"
            disabled={searchMatches.length === 0}
            onClick={() => {
              const nextIdx = (searchMatchIdx - 1 + searchMatches.length) % searchMatches.length;
              setSearchMatchIdx(nextIdx);
              scrollToMessage(searchMatches[nextIdx]);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-[12px] font-bold disabled:opacity-40"
          >
            ↑
          </button>
          <button
            type="button"
            disabled={searchMatches.length === 0}
            onClick={() => {
              const nextIdx = (searchMatchIdx + 1) % searchMatches.length;
              setSearchMatchIdx(nextIdx);
              scrollToMessage(searchMatches[nextIdx]);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-full border border-line bg-surface text-[12px] font-bold disabled:opacity-40"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}
            className="px-1.5 text-[12px] font-bold text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Pinned Message Banner ── */}
      {pinnedMessageId && messagesById.get(pinnedMessageId) && !deletedForAll.includes(pinnedMessageId) && (
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line bg-primary/8 px-4 py-1.5">
          <button
            type="button"
            onClick={() => scrollToMessage(pinnedMessageId)}
            className="flex min-w-0 flex-1 items-center gap-2 text-left"
          >
            <span className="text-[13px]">📌</span>
            <p className="truncate text-[12.5px] font-semibold text-ink">
              {messagesById.get(pinnedMessageId)!.body}
            </p>
          </button>
          <button
            type="button"
            onClick={() => handleTogglePin(messagesById.get(pinnedMessageId)!)}
            aria-label="Unpin message"
            className="text-[11px] font-bold text-muted hover:text-ink"
          >
            ✕
          </button>
        </div>
      )}

      {/* ── Offline / Queue Sync Banner ── */}
      {(isOffline || isSyncingQueue) && (
        <div
          className={`shrink-0 px-4 py-1.5 text-center text-[11.5px] font-semibold ${
            isSyncingQueue ? 'bg-primary/15 text-primary' : 'bg-amber-100 text-amber-900'
          }`}
        >
          {isSyncingQueue
            ? 'Back online — sending queued messages…'
            : 'You are offline — messages will queue and send automatically when reconnected'}
        </div>
      )}

      {/* ── Collapsible Original Paper Drawer ── */}
      {showPaper && (
        <div className="shrink-0 border-b border-line bg-[#FAF7F0] px-4 py-3 shadow-inner transition">
          <div className="flex items-center justify-between pb-1">
            <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Original Paper</p>
            <button
              type="button"
              onClick={() => setShowPaper(false)}
              className="text-[12px] font-bold text-muted hover:text-ink"
            >
              Close ✕
            </button>
          </div>
          <p className="line-clamp-4 text-label leading-relaxed text-ink">{paperBody}</p>
        </div>
      )}

      {/* ── Blocked / Chat Ended Notice ── */}
      {isBlocked ? (
        <div className="flex-1 p-5">
          <Notice title="You blocked this person">Unblock them in Settings to keep chatting.</Notice>
        </div>
      ) : chatEnded ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
          <span className="text-4xl">🕊️</span>
          <div className="space-y-1">
            <h2 className="font-display text-[18px] font-bold text-ink">
              {otherName} flew away
            </h2>
            <p className="text-label text-muted">
              This conversation has ended and the chat has been closed.
            </p>
          </div>
          <LinkButton href="/chats" className="w-full max-w-[240px]">
            Back to Chats
          </LinkButton>
        </div>
      ) : (
        <>
          {/* ── Messages Stream ── */}
          <div
            ref={messagesContainerRef}
            onClick={() => {
              setActiveReactionMenuMsgId(null);
              setShowHeaderMenu(false);
            }}
            className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3 overscroll-y-contain"
            aria-live="polite"
          >
            {/* Context anchor at start of chat */}
            <div className="mx-auto max-w-[90%] rounded-card border border-line bg-surface-alt/40 p-3 text-center">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted">Started with this paper</p>
              <p className="mt-1 line-clamp-3 text-label italic text-ink">&ldquo;{paperBody}&rdquo;</p>
            </div>

            {visibleMessages.map((m, index) => {
              const isMine = m.sender_id === me;
              const prevDate = index > 0 ? formatDateDivider(visibleMessages[index - 1].created_at) : null;
              const currentDate = formatDateDivider(m.created_at);
              const showDateDivider = index === 0 || prevDate !== currentDate;
              const msgReactions = reactions[m.id] || [];
              const parentId = replyMap[m.id];
              const parentMsg = parentId ? messagesById.get(parentId) : undefined;
              const childReplies = repliesByParent.get(m.id) ?? [];
              const isReplyTarget = replyingTo?.id === m.id;
              const isDimmedByReplyFocus = Boolean(replyingTo) && !isReplyTarget;
              const isDeletedAll = deletedForAll.includes(m.id);
              const isEdited = editedIds.includes(m.id);
              const isStarred = starredIds.includes(m.id);
              const canEdit =
                isMine &&
                m.id > 0 &&
                !isDeletedAll &&
                Date.now() - new Date(m.created_at).getTime() <= 15 * 60 * 1000;
              const isSearchMatch = searchMatches[searchMatchIdx] === m.id;

              return (
                <div
                  key={m.id}
                  ref={(el) => {
                    messageRefs.current[m.id] = el;
                  }}
                  className={`space-y-2 transition-all duration-200 ${
                    isReplyTarget ? 'relative z-20' : ''
                  } ${isDimmedByReplyFocus ? 'opacity-40 blur-[1px]' : ''}`}
                >
                  {showDateDivider && currentDate && (
                    <div className="my-2.5 flex justify-center">
                      <span className="rounded-full border border-line/60 bg-surface/90 px-3 py-0.5 text-[11px] font-semibold text-muted shadow-2xs backdrop-blur-xs select-none">
                        {currentDate}
                      </span>
                    </div>
                  )}

                  <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`group relative flex flex-col ${
                        isMine ? 'items-end' : 'items-start'
                      } max-w-[84%]`}
                    >
                      {/* iMessage-style Parent Preview & Curved Thread Connector */}
                      {parentMsg && (
                        <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} mb-0.5`}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocusedThreadRootId(parentMsg.id);
                            }}
                            className={`max-w-[230px] rounded-[14px] border border-line/60 bg-surface-alt/85 px-2.5 py-1 text-left text-[12px] text-muted shadow-2xs transition active:scale-95 ${
                              isMine ? 'mr-3' : 'ml-3'
                            }`}
                          >
                            <span className="block text-[10px] font-bold text-primary">
                              {parentMsg.sender_id === me ? 'You' : otherName}
                            </span>
                            <span className="line-clamp-1 break-words">{parentMsg.body}</span>
                          </button>
                          <svg
                            width="24"
                            height="14"
                            viewBox="0 0 24 14"
                            fill="none"
                            aria-hidden="true"
                            className={`text-line ${isMine ? 'mr-2 -scale-x-100' : 'ml-2'}`}
                          >
                            <path
                              d="M4 0 C4 9, 10 12, 24 12"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                            />
                          </svg>
                        </div>
                      )}

                      {/* Floating Emoji & WhatsApp Options Bar */}
                      <AnimatePresence>
                        {activeReactionMenuMsgId === m.id && !isDeletedAll && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: -8 }}
                            exit={{ opacity: 0, scale: 0.8, y: -4 }}
                            transition={{ type: 'spring', damping: 22, stiffness: 350 }}
                            className={`absolute -top-20 z-30 flex flex-col gap-1.5 ${
                              isMine ? 'right-0 items-end' : 'left-0 items-start'
                            }`}
                            onClick={(e) => e.stopPropagation()}
                          >
                            {/* Emoji Row */}
                            <div className="flex items-center gap-1 rounded-full border border-line/80 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md">
                              {CHAT_EMOJIS.map((em) => {
                                const hasReacted = msgReactions.some(
                                  (r) => r.emoji === em.key && r.users.includes(me)
                                );
                                return (
                                  <button
                                    key={em.key}
                                    type="button"
                                    onClick={() => handleReactionSelect(m.id, em.key)}
                                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-transform active:scale-130 hover:scale-120 ${
                                      hasReacted
                                        ? 'bg-primary/20 ring-2 ring-primary'
                                        : 'hover:bg-black/5'
                                    }`}
                                    title={em.label}
                                  >
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                      src={em.file}
                                      alt={em.label}
                                      className="h-5 w-5 object-contain pointer-events-none"
                                    />
                                  </button>
                                );
                              })}
                              {m.id > 0 && (
                                <>
                                  <span className="mx-0.5 h-4 w-[1px] bg-line" aria-hidden />
                                  <button
                                    type="button"
                                    onClick={() => startReply(m)}
                                    aria-label="Reply to message"
                                    title="Reply"
                                    className="flex h-7 items-center gap-1 rounded-full px-2 text-[11px] font-bold text-primary transition hover:bg-primary/10 active:scale-95"
                                  >
                                    <span>↩</span>
                                    <span>Reply</span>
                                  </button>
                                </>
                              )}
                            </div>

                            {/* WhatsApp Message Action Pills */}
                            {m.id > 0 && (
                              <div className="flex flex-wrap items-center gap-1 rounded-2xl border border-line/80 bg-white/95 px-2 py-1 shadow-lg backdrop-blur-md text-[11px] font-bold text-ink">
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(m)}
                                  className="rounded-lg px-2 py-1 hover:bg-surface-alt active:scale-95"
                                >
                                  📋 Copy
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReactionMenuMsgId(null);
                                    setForwardModalMsg(m);
                                  }}
                                  className="rounded-lg px-2 py-1 hover:bg-surface-alt active:scale-95"
                                >
                                  ↗ Forward
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleToggleStar(m)}
                                  className="rounded-lg px-2 py-1 hover:bg-surface-alt active:scale-95"
                                >
                                  {isStarred ? '★ Unstar' : '⭐ Star'}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleTogglePin(m)}
                                  className="rounded-lg px-2 py-1 hover:bg-surface-alt active:scale-95"
                                >
                                  {pinnedMessageId === m.id ? '📌 Unpin' : '📌 Pin'}
                                </button>
                                {canEdit && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveReactionMenuMsgId(null);
                                      setEditModalMsg(m);
                                    }}
                                    className="rounded-lg px-2 py-1 hover:bg-surface-alt active:scale-95"
                                  >
                                    ✏️ Edit
                                  </button>
                                )}
                                {isMine && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveReactionMenuMsgId(null);
                                      setInfoModalMsg(m);
                                    }}
                                    className="rounded-lg px-2 py-1 hover:bg-surface-alt active:scale-95"
                                  >
                                    ℹ️ Info
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveReactionMenuMsgId(null);
                                    setDeleteModalMsg(m);
                                  }}
                                  className="rounded-lg px-2 py-1 text-danger hover:bg-danger/10 active:scale-95"
                                >
                                  🗑️ Delete
                                </button>
                              </div>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <motion.div
                        drag={m.id > 0 && !isDeletedAll ? 'x' : false}
                        dragConstraints={{ left: 0, right: 54 }}
                        dragElastic={0.2}
                        dragSnapToOrigin
                        onDragEnd={(_, info) => {
                          if (m.id > 0 && !isDeletedAll && info.offset.x > 38) {
                            startReply(m);
                          }
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!isDeletedAll) {
                            setActiveReactionMenuMsgId((curr) => (curr === m.id ? null : m.id));
                          }
                        }}
                        className={`relative w-full cursor-pointer rounded-[18px] px-3.5 pt-2 pb-1.5 text-[15px] leading-relaxed shadow-xs select-none active:scale-[0.99] transition-transform ${
                          isMine
                            ? 'rounded-br-[4px] bg-primary text-on-primary font-medium'
                            : 'rounded-bl-[4px] border border-line bg-surface text-ink'
                        } ${isReplyTarget || isSearchMatch ? 'ring-2 ring-amber-400 shadow-md' : ''}`}
                      >
                        {isDeletedAll ? (
                          <p className="italic opacity-75 text-[13.5px]">🚫 This message was deleted</p>
                        ) : (
                          <p className="whitespace-pre-wrap break-words">{m.body}</p>
                        )}
                        <div
                          className={`mt-0.5 flex items-center justify-end gap-1 text-[10.5px] leading-none select-none ${
                            isMine ? 'text-white/80' : 'text-muted'
                          }`}
                        >
                          {isStarred && !isDeletedAll && <span title="Starred">⭐</span>}
                          {isEdited && !isDeletedAll && <span className="italic opacity-80">edited</span>}
                          <span suppressHydrationWarning>{formatMessageTime(m.created_at)}</span>
                          {isMine &&
                            (m.id < 0 ? (
                              <svg
                                className="h-2.5 w-2.5 text-white/70 animate-pulse"
                                viewBox="0 0 16 16"
                                fill="currentColor"
                                aria-label="Sending"
                              >
                                <path d="M8 3.5a.5.5 0 0 0-1 0V8a.5.5 0 0 0 .252.434l3.5 2a.5.5 0 0 0 .496-.868L8 7.71V3.5z" />
                                <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm7-8A7 7 0 1 1 1 8a7 7 0 0 1 14 0z" />
                              </svg>
                            ) : (
                              (() => {
                                const isRead =
                                  Boolean(otherLastReadAt) &&
                                  new Date(m.created_at).getTime() <=
                                    new Date(otherLastReadAt!).getTime() + 1000;
                                return (
                                  <svg
                                    className={`h-3 w-3 ${
                                      isRead ? 'text-[#34B7F1]' : 'text-white/80'
                                    } transition-colors duration-300`}
                                    viewBox="0 0 16 15"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                    aria-label={isRead ? 'Read' : 'Delivered'}
                                  >
                                    <path
                                      d="M14.5 4L6.5 12L2 7.5"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M10.5 4L5.5 9"
                                      stroke="currentColor"
                                      strokeWidth="1.6"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                );
                              })()
                            ))}
                        </div>
                      </motion.div>

                      {/* iMessage "N Replies" Thread Link */}
                      {childReplies.length > 0 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setFocusedThreadRootId(m.id);
                          }}
                          className="mt-1 text-[11px] font-bold text-primary hover:underline active:opacity-75"
                        >
                          {childReplies.length === 1 ? '1 Reply' : `${childReplies.length} Replies`}
                        </button>
                      )}

                      {/* Docked Reactions */}
                      {msgReactions.length > 0 && (
                        <div
                          className={`mt-1 flex flex-wrap gap-1 ${
                            isMine ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          {msgReactions.map((r) => {
                            const em = getEmoji(r.emoji);
                            if (!em) return null;
                            const myReaction = r.users.includes(me);
                            return (
                              <button
                                key={r.emoji}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReactionSelect(m.id, r.emoji);
                                }}
                                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-bold shadow-2xs backdrop-blur-xs transition active:scale-95 ${
                                  myReaction
                                    ? 'border-primary/40 bg-primary/10 text-primary'
                                    : 'border-line/80 bg-surface text-ink'
                                }`}
                                title={
                                  myReaction
                                    ? 'Remove your reaction'
                                    : `React with ${em.label}`
                                }
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={em.file}
                                  alt=""
                                  className="h-3.5 w-3.5 object-contain"
                                />
                                {r.users.length > 1 && <span>{r.users.length}</span>}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* ── Bird-Eating-Seed Typing Indicator ── */}
            <AnimatePresence>
              {otherTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 8, scale: 0.94 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.94 }}
                  transition={{ duration: 0.2 }}
                  className="flex justify-start"
                  aria-label={`${otherName} is typing`}
                >
                  <div className="inline-flex items-center gap-2 rounded-[18px] rounded-bl-[4px] border border-line bg-surface px-3.5 py-2 shadow-xs">
                    <BirdTypingAnimation className="h-7 w-auto" />
                    <span className="text-[12px] font-semibold text-muted">typing…</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={bottom} />
          </div>

          {/* ── Bottom Input Section ── */}
          <div className="shrink-0 border-t border-line bg-surface px-3 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] shadow-xs">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-line bg-surface-alt/80 px-3 py-1.5">
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold text-primary">
                    Replying to {replyingTo.sender_id === me ? 'yourself' : otherName}
                  </p>
                  <p className="truncate text-[12px] text-muted">{replyingTo.body}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setReplyingTo(null)}
                  aria-label="Cancel reply"
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/80 text-[12px] font-bold text-muted hover:text-ink"
                >
                  ✕
                </button>
              </div>
            )}

            {messages.length === 0 && (
              <div className="mb-2 space-y-1.5">
                <p className="text-[12px] font-bold text-muted">Need a starter?</p>
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {starters.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="shrink-0 rounded-full border border-line bg-surface-alt px-3 py-1 text-[12px] font-semibold text-ink active:scale-95 transition"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {hasContact && (
              <div className="mb-2">
                <Notice tone="gentle" title={CONTACT_NOTICE.title}>
                  Chat first. Share contact details later, once you know each other.
                </Notice>
              </div>
            )}

            {error && !hasContact && (
              <div className="mb-2">
                <Notice tone="err" title="Message not sent">{error}</Notice>
              </div>
            )}

            <form
              className="flex items-center gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
            >
              <input
                ref={inputRef}
                value={text}
                onChange={(e) => handleTextChange(e.target.value)}
                onFocus={handleInputFocus}
                maxLength={1000}
                type="text"
                autoComplete="off"
                enterKeyHint="send"
                placeholder="Say something real…"
                aria-label="Message"
                className="h-[46px] min-w-0 flex-1 rounded-input border-[1.5px] border-line bg-bg px-4 text-[16px] text-ink placeholder:text-muted focus:border-primary focus:bg-surface focus:outline-none transition"
              />
              <button
                type="submit"
                aria-label="Send"
                disabled={pending || !text.trim() || hasContact}
                className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-full bg-primary text-on-primary active:scale-95 disabled:bg-line disabled:text-muted transition"
              >
                <Icon name="sent" size={20} />
              </button>
            </form>
          </div>
        </>
      )}

      {/* ── Fly Away (Leave Chat) Confirmation Modal ── */}
      <AnimatePresence>
        {showLeaveModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
            onClick={() => !isLeaving && setShowLeaveModal(false)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.92, opacity: 0 }}
              className="w-full max-w-[340px] rounded-2xl border border-line bg-surface p-5 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <span className="text-3xl">🕊️</span>
                <h3 className="mt-2 font-display text-[17px] font-bold text-ink">
                  Fly away from this chat?
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted">
                  This will close the conversation and remove its messages for both of you. You can always meet new birds on the tree.
                </p>
              </div>
              <div className="mt-5 flex flex-col gap-2">
                <button
                  type="button"
                  disabled={isLeaving}
                  onClick={handleLeaveChat}
                  className="inline-flex min-h-[44px] items-center justify-center rounded-btn bg-danger px-4 text-[13px] font-bold text-on-primary transition active:scale-95 disabled:opacity-60"
                >
                  {isLeaving ? 'Flying away…' : 'Yes, Fly Away'}
                </button>
                <button
                  type="button"
                  disabled={isLeaving}
                  onClick={() => setShowLeaveModal(false)}
                  className="inline-flex min-h-[40px] items-center justify-center rounded-btn border border-line bg-surface text-[13px] font-bold text-muted transition hover:text-ink disabled:opacity-60"
                >
                  Stay in Chat
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── iMessage Focused Reply Thread Overlay ── */}
      <AnimatePresence>
        {focusedThreadRootId && messagesById.get(focusedThreadRootId) && (() => {
          const root = messagesById.get(focusedThreadRootId)!;
          const threadReplies = repliesByParent.get(focusedThreadRootId) ?? [];
          const rootIsMine = root.sender_id === me;

          return (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setFocusedThreadRootId(null)}
              className="fixed inset-0 z-50 flex flex-col justify-between bg-bg/80 p-4 backdrop-blur-md"
            >
              <div className="mx-auto flex w-full max-w-[460px] items-center justify-between pt-2">
                <span className="text-[12px] font-bold uppercase tracking-wider text-muted">
                  Reply Thread
                </span>
                <button
                  type="button"
                  onClick={() => setFocusedThreadRootId(null)}
                  className="rounded-full bg-surface px-3.5 py-1.5 text-[12px] font-bold text-primary shadow-xs border border-line"
                >
                  Done
                </button>
              </div>

              <div
                onClick={(e) => e.stopPropagation()}
                className="mx-auto my-4 w-full max-w-[460px] flex-1 overflow-y-auto space-y-2 py-4"
              >
                {/* Root Message */}
                <div className={`flex ${rootIsMine ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[82%] rounded-[18px] px-3.5 py-2.5 text-[15px] leading-relaxed shadow-md ${
                      rootIsMine
                        ? 'rounded-br-[4px] bg-primary text-on-primary font-medium'
                        : 'rounded-bl-[4px] border border-line bg-surface text-ink'
                    }`}
                  >
                    <p className="text-[10px] font-bold opacity-75 mb-0.5">
                      {rootIsMine ? 'You' : otherName}
                    </p>
                    <p className="whitespace-pre-wrap break-words">{root.body}</p>
                    <p className="mt-1 text-right text-[10px] opacity-75">
                      {formatMessageTime(root.created_at)}
                    </p>
                  </div>
                </div>

                {/* Curved connector + Thread Replies */}
                {threadReplies.map((rep) => {
                  const repIsMine = rep.sender_id === me;
                  return (
                    <div key={rep.id} className="space-y-1">
                      <div className={`flex ${repIsMine ? 'justify-end pr-4' : 'justify-start pl-4'}`}>
                        <svg
                          width="24"
                          height="16"
                          viewBox="0 0 24 16"
                          fill="none"
                          aria-hidden="true"
                          className={`text-line ${repIsMine ? '-scale-x-100' : ''}`}
                        >
                          <path
                            d="M4 0 C4 10, 10 14, 24 14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </div>
                      <div className={`flex ${repIsMine ? 'justify-end' : 'justify-start'}`}>
                        <div
                          className={`max-w-[80%] rounded-[18px] px-3.5 py-2 text-[14.5px] leading-relaxed shadow-xs ${
                            repIsMine
                              ? 'rounded-br-[4px] bg-primary text-on-primary font-medium'
                              : 'rounded-bl-[4px] border border-line bg-surface text-ink'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{rep.body}</p>
                          <p className="mt-0.5 text-right text-[10px] opacity-75">
                            {formatMessageTime(rep.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mx-auto flex w-full max-w-[460px] justify-center pb-4">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setFocusedThreadRootId(null);
                    startReply(root);
                  }}
                  className="inline-flex min-h-[44px] items-center gap-2 rounded-full bg-primary px-6 text-[13px] font-bold text-on-primary shadow-md active:scale-95 transition"
                >
                  <span>↩</span>
                  <span>Reply in Thread</span>
                </button>
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Friend Profile Preview Modal ── */}
      {otherProfilePreview && (
        <ProfilePreviewModal
          open={showFriendProfile}
          onClose={() => setShowFriendProfile(false)}
          data={otherProfilePreview}
        />
      )}

      {/* ── WhatsApp Message & Chat Modals ── */}
      <DeleteMessageModal
        message={deleteModalMsg}
        isMine={deleteModalMsg?.sender_id === me}
        onClose={() => setDeleteModalMsg(null)}
        onDeleteForMe={handleDeleteForMe}
        onDeleteForEveryone={handleDeleteForEveryone}
      />
      <EditMessageModal
        message={editModalMsg}
        onClose={() => setEditModalMsg(null)}
        onSave={handleSaveEdit}
      />
      <ForwardShareModal
        message={forwardModalMsg}
        targets={forwardTargets}
        onClose={() => setForwardModalMsg(null)}
        onForwardToChat={handleForwardToChat}
        onShareExternal={handleShareExternal}
      />
      <MessageInfoModal
        message={infoModalMsg}
        otherLastReadAt={otherLastReadAt}
        onClose={() => setInfoModalMsg(null)}
      />
      <StarredMessagesDrawer
        open={showStarredDrawer}
        messages={starredMessages}
        me={me}
        otherName={otherName}
        onClose={() => setShowStarredDrawer(false)}
        onSelectMessage={scrollToMessage}
      />
      <ClearChatModal
        open={showClearModal}
        onClose={() => setShowClearModal(false)}
        onConfirm={handleClearChat}
      />

      {/* ── Toast Notification Pill ── */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            className="pointer-events-none fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-full bg-ink/90 px-4 py-2 text-[12px] font-bold text-white shadow-lg backdrop-blur-md"
          >
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
