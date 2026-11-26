'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Icon } from './Icon';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check if already in standalone PWA mode
    const isStandalone =
      (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    if (isStandalone) {
      return;
    }

    // Check if dismissed recently (within 48 hours)
    const dismissedAt = localStorage.getItem('gistbird_install_dismissed_at');
    if (dismissedAt) {
      const elapsed = Date.now() - parseInt(dismissedAt, 10);
      if (elapsed < 48 * 60 * 60 * 1000) {
        return;
      }
    }

    const ua = navigator.userAgent.toLowerCase();
    const isAppleDevice =
      /iphone|ipad|ipod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isAndroidDevice = /android/.test(ua);

    setIsIOS(isAppleDevice);

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // If on iOS or mobile, delay display slightly for a smooth non-intrusive entrance
    const timer = setTimeout(() => {
      if (isAppleDevice || isAndroidDevice) {
        setShowPrompt(true);
      }
    }, 2000);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      clearTimeout(timer);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem('gistbird_install_dismissed_at', Date.now().toString());
    setShowPrompt(false);
  };

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else {
      // Fallback instruction if browser handled or beforeinstallprompt hasn't resolved
      alert(
        "To install on Android: Tap the three dots (⋮) in your browser toolbar, then tap 'Install app' or 'Add to Home screen'."
      );
    }
  };

  if (!showPrompt) return null;

  return (
    <aside
      aria-label="Install Gist Bird"
      className="fixed bottom-20 left-1/2 z-50 w-[92%] max-w-[440px] -translate-x-1/2 rounded-[22px] border-[1.5px] border-line bg-surface p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-surface-alt p-1.5 shadow-sm border border-line">
            <Image
              src="/icons/icon.svg"
              alt="Gist Bird"
              width={34}
              height={34}
              className="rounded-[10px]"
            />
          </div>
          <div>
            <h2 className="font-display text-[15px] font-bold leading-5 text-ink">
              {isIOS ? 'Add Gist Bird to Home Screen' : 'Install Gist Bird App'}
            </h2>
            <p className="text-[12px] leading-4 text-muted">
              {isIOS
                ? 'Get real-time message alerts on your iPhone'
                : 'Get phone notifications & full-screen chat'}
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-muted hover:text-ink active:scale-90 transition p-1"
        >
          <Icon name="close" size={18} />
        </button>
      </div>

      {isIOS ? (
        /* ── Apple iOS Safari Instruction Steps ── */
        <div className="mt-3.5 space-y-2 rounded-[16px] bg-surface-alt/70 p-3 text-[13px] leading-relaxed text-ink border border-line/60">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              1
            </span>
            <span>
              Tap the Safari <strong>Share</strong> button{' '}
              <span className="inline-flex items-center justify-center rounded border border-line bg-surface px-1.5 py-0.5 text-xs font-bold text-primary">
                ⎋
              </span>{' '}
              in the bottom toolbar.
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
              2
            </span>
            <span>
              Scroll down and tap <strong>Add to Home Screen</strong>{' '}
              <span className="inline-flex items-center justify-center rounded border border-line bg-surface px-1.5 py-0.5 text-xs font-bold text-ink">
                +
              </span>
              .
            </span>
          </div>
          <div className="pt-1 text-right">
            <button
              onClick={handleDismiss}
              className="text-[12px] font-bold text-primary underline"
            >
              Got it
            </button>
          </div>
        </div>
      ) : (
        /* ── Android Native Install Action ── */
        <div className="mt-3.5 flex items-center gap-2">
          <button
            onClick={handleInstallClick}
            className="flex-1 rounded-btn bg-primary py-2.5 text-center text-label font-bold text-on-primary shadow-sm active:scale-95 transition"
          >
            Install App
          </button>
          <button
            onClick={handleDismiss}
            className="rounded-btn border border-line bg-surface px-4 py-2.5 text-label font-semibold text-muted active:scale-95 transition"
          >
            Not now
          </button>
        </div>
      )}
    </aside>
  );
}
