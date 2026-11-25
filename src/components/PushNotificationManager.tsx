'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { VAPID_PUBLIC_KEY, urlBase64ToUint8Array } from '@/lib/push';
import { Icon } from './Icon';

interface PushNotificationManagerProps {
  userId?: string;
}

export function PushNotificationManager({ userId }: PushNotificationManagerProps) {
  const [permission, setPermission] = useState<NotificationPermission | 'unsupported'>('default');
  const [showPermissionBanner, setShowPermissionBanner] = useState(false);
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);

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

  // Check initial notification support & permission
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission);

    if (Notification.permission === 'granted' && userId) {
      syncPushSubscription();
    }

    // If permission has not been asked yet, show banner after 3 seconds
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

  const triggerDeviceNotification = useCallback(
    async (title: string, body: string, url: string, tag: string) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;
      if (Notification.permission !== 'granted') return;

      // 1. Try Service Worker showNotification (works reliably in mobile PWAs, iOS 16.4+, and Android)
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.ready;
          if (reg && reg.showNotification) {
            await reg.showNotification(title, {
              body,
              icon: '/icons/icon.svg',
              badge: '/icons/icon.svg',
              tag,
              renotify: true,
              data: { url },
              vibrate: [200, 100, 200],
            } as unknown as NotificationOptions);
            return;
          }
        } catch (swErr) {
          console.warn('Service worker notification failed, using desktop fallback:', swErr);
        }
      }

      // 2. Standard Web Notification API fallback
      try {
        const notification = new Notification(title, {
          body,
          icon: '/icons/icon.svg',
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

  // Subscribe to real-time notification events for this user
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
            kind?: string;
            title?: string;
            body?: string | null;
            data?: {
              chat_id?: string;
              sender_name?: string;
              body?: string;
              paper_id?: string;
            };
          };

          if (note.kind === 'new_message') {
            const chatId = note.data?.chat_id;
            const targetUrl = chatId ? `/chat/${chatId}` : '/chats';

            // If the user is actively inside this exact chat in the foreground, don't spam a system banner
            if (
              pathnameRef.current === targetUrl &&
              typeof document !== 'undefined' &&
              document.visibilityState === 'visible'
            ) {
              return;
            }

            // Extract who texted them and what they said
            const senderName = note.data?.sender_name || note.title || 'Campus friend';
            const messageText = note.data?.body || note.body || 'Sent you a new message';

            triggerDeviceNotification(
              senderName,
              messageText,
              targetUrl,
              `chat-${chatId || 'msg'}-${Date.now()}`
            );
          } else if (note.kind === 'paper_landed') {
            triggerDeviceNotification(
              note.title || 'A paper landed for you',
              note.body || 'Chief Coo brought a new letter to your tree!',
              '/home',
              `paper-${note.data?.paper_id || 'landed'}`
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, triggerDeviceNotification]);

  const requestPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    try {
      const res = await Notification.requestPermission();
      setPermission(res);
      setShowPermissionBanner(false);

      if (res === 'granted') {
        await syncPushSubscription();
        // Send a celebratory test notification so the user sees it immediately on their device
        triggerDeviceNotification(
          'Gist Bird Notifications Active',
          "You will now see who texts you and what they said directly on your phone!",
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

  if (!showPermissionBanner || permission !== 'default') {
    return null;
  }

  return (
    <aside
      aria-label="Notification permissions"
      className="fixed top-4 left-1/2 z-50 w-[92%] max-w-[440px] -translate-x-1/2 rounded-[20px] border-[1.5px] border-line bg-surface/95 p-3.5 shadow-lg backdrop-blur-md transition-all animate-in fade-in slide-in-from-top-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lemon text-ink">
            <Icon name="bell" size={19} />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-[14px] font-bold text-ink leading-4 truncate">
              Turn on phone notifications
            </h2>
            <p className="text-[12px] text-muted leading-4 truncate">
              See who texted you & their message preview
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={requestPermission}
            className="rounded-full bg-primary px-3 py-1.5 text-[12px] font-bold text-on-primary shadow-xs active:scale-95 transition"
          >
            Enable
          </button>
          <button
            onClick={dismissBanner}
            aria-label="Close"
            className="text-muted hover:text-ink p-1 active:scale-90 transition"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
