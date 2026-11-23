'use client';
import { useEffect } from 'react';

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          // If a new worker is waiting, activate it immediately
          if (reg.waiting) {
            reg.waiting.postMessage({ type: 'SKIP_WAITING' });
          }
        })
        .catch((err) => {
          console.warn('SW registration skipped:', err);
        });
    }
  }, []);

  return null;
}
