'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '@/lib/push';
import { Icon } from './Icon';

interface PushNotificationManagerProps {
  userId?: string;
}

interface InAppBanner {
  id: string;
  senderName: string;
  body: string;
  avatar: string;
  url: string;
}

export function PushNotificationManager({ userId }: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const [inAppBanner, setInAppBanner] = useState<InAppBanner | null>(null);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const bannerTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  const syncPushSubscription = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (Notification.permission !== 'granted') return;
    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
        });
      }
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON() }),
      });
    } catch (err) {
      console.warn('Web push subscription sync skipped:', err);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === 'granted' && userId) {
      syncPushSubscription();
    }

    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('gistbird_notifications_prompt_dismissed');
      if (!dismissed) {
        const timer = setTimeout(() => {
          setShowPermissionBanner(true);
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
  }, [userId, syncPushSubscription]);

  const showWhatsAppToast = useCallback((banner: InAppBanner) => {
    setInAppBanner(banner);
    if (bannerTimerRef.current) clearTimeout(bannerTimerRef.current);
    bannerTimerRef.current = setTimeout(() => {
      setInAppBanner(null);
    }, 4800);
  }, []);

  const triggerDeviceNotification = useCallback(
    async (title: string, body: string, url: string, tag: string, icon = '/icons/icon.svg') => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon,
              badge: '/icons/paper.png',
              tag,
              renotify: true,
              data: { url },
              vibrate: [180, 90, 180],
              actions: [
                { action: 'open', title: 'Reply' },
                { action: 'dismiss', title: 'Mark read' },
              ],
            } as unknown as NotificationOptions);
            return;
          }
        } catch (swErr) {
          console.warn('Service worker notification failed, using desktop fallback:', swErr);
        }
      }

      try {
        const notification = new Notification(title, {
          body,
          icon,
          tag,
          data: { url },
        });
        notification.onclick = () => {
          window.focus();
          window.location.href = url;
          notification.close();
        };
      } catch (err) {
        console.warn('Notification instantiation failed:', err);
      }
    },
    []
  );

  // Subscribe to real-time notifications for foreground WhatsApp-style toast + device push
  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    const channel = supabase
      .channel(`realtime-push:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const note = payload.new as {
            id?: string;
            kind?: string;
            title?: string;
            body?: string | null;
            data?: {
              chat_id?: string;
              sender_name?: string;
              sender_avatar?: string;
              body?: string;
              paper_id?: string;
            };
          };

          if (note.kind === 'new_message') {
            const chatId = note.data?.chat_id;
            const targetUrl = chatId ? `/chat/${chatId}` : '/chats';

            // Skip if user is already reading that exact chat in the foreground
            if (
              pathnameRef.current === targetUrl &&
              typeof document !== 'undefined' &&
              document.visibilityState === 'visible'
            ) {
              return;
            }

            const senderName = note.data?.sender_name || note.title || 'Campus friend';
            const messageText = note.data?.body || note.body || 'Sent you a new message';
            const avatar = note.data?.sender_avatar || '/icons/icon.svg';

            // Show WhatsApp-style heads-up banner inside app
            showWhatsAppToast({
              id: note.id || String(Date.now()),
              senderName,
              body: messageText,
              avatar,
              url: targetUrl,
            });

            // Also fire system notification if tab is backgrounded
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
              triggerDeviceNotification(
                senderName,
                messageText,
                targetUrl,
                `chat-${chatId || 'msg'}`,
                avatar.startsWith('/') ? avatar : '/icons/icon.svg'
              );
            }
          } else if (note.kind === 'paper_landed') {
            const title = note.title || 'A paper landed for you';
            const body = note.body || 'Chief Coo brought a new letter to your tree!';
            showWhatsAppToast({
              id: note.id || String(Date.now()),
              senderName: title,
              body,
              avatar: '/icons/paper.png',
              url: '/home',
            });
            if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
              triggerDeviceNotification(title, body, '/home', `paper-${note.data?.paper_id || 'landed'}`);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, triggerDeviceNotification, showWhatsAppToast]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      setShowPermissionBanner(false);

      if (res === 'granted') {
        await syncPushSubscription();
        triggerDeviceNotification(
          'Gist Bird',
          "Notifications enabled — you'll see messages just like WhatsApp!",
          '/home',
          'welcome-notification'
        );
      }
    } catch (err) {
      console.warn('Failed to request notification permission:', err);
      setShowPermissionBanner(false);
    }
  };

  const dismissBanner = () => {
    localStorage.setItem('gistbird_notifications_prompt_dismissed', 'true');
    setShowPermissionBanner(false);
  };

  return (
    <>
      {/* ── Live WhatsApp-Style Heads-Up Message Banner ── */}
      {inAppBanner && (
        <div className="fixed top-3 left-1/2 z-[60] w-[94%] max-w-[448px] -translate-x-1/2 animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-center gap-3 rounded-[20px] border border-line/80 bg-white/95 p-3 shadow-[0_10px_30px_rgba(14,42,27,0.16)] backdrop-blur-md">
            <Link
              href={inAppBanner.url}
              onClick={() => setInAppBanner(null)}
              className="flex min-w-0 flex-1 items-center gap-3"
            >
              <div className="relative h-11 w-11 shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={inAppBanner.avatar}
                  alt={inAppBanner.senderName}
                  className="h-11 w-11 rounded-full border border-line bg-surface-alt object-cover"
                />
                <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#25D366] ring-2 ring-white">
                  <Icon name="chat" size={10} className="text-white" />
                </span>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate font-display text-[15px] font-bold text-ink">
                    {inAppBanner.senderName}
                  </p>
                  <span className="shrink-0 text-[11px] font-semibold text-[#0A7D3E]">now</span>
                </div>
                <p className="line-clamp-2 text-[13px] leading-snug text-muted">
                  {inAppBanner.body}
                </p>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setInAppBanner(null)}
              aria-label="Dismiss notification"
              className="shrink-0 rounded-full p-1 text-muted hover:text-ink"
            >
              <Icon name="close" size={16} />
            </button>
          </div>
        </div>
      )}

      {/* ── WhatsApp-Style Notification Permission Prompt ── */}
      {showPermissionBanner && permission === 'default' && !inAppBanner && (
        <aside
          aria-label="Notification permissions"
          className="fixed top-3 left-1/2 z-50 w-[94%] max-w-[448px] -translate-x-1/2 rounded-[20px] border border-[#0A7D3E]/20 bg-white/95 p-3.5 shadow-[0_10px_28px_rgba(10,125,62,0.14)] backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-300"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white shadow-xs">
                <Icon name="bell" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display text-[14px] font-bold leading-4 text-ink">
                  Turn on message alerts
                </h2>
                <p className="mt-0.5 truncate text-[12px] leading-4 text-muted">
                  See who texted &amp; reply right from notifications
                </p>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <button
                onClick={requestPermission}
                className="rounded-full bg-[#0A7D3E] px-3.5 py-1.5 text-[12px] font-bold text-white shadow-xs transition active:scale-95"
              >
                Turn On
              </button>
              <button
                onClick={dismissBanner}
                aria-label="Close"
                className="p-1 text-muted transition hover:text-ink active:scale-90"
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          </div>
        </aside>
      )}
    </>
  );
}
