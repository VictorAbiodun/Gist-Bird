'use client';
import { useEffect, useState } from 'react';

export function OfflineBanner() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener('online', update); window.addEventListener('offline', update);
    return () => { window.removeEventListener('online', update); window.removeEventListener('offline', update); };
  }, []);
  if (!offline) return null;
  return (
    <div role="status" className="sticky top-0 z-50 bg-ink px-4 py-3 text-center text-label font-semibold text-white">
      You are offline. We will pick up where you left off when you are back.
    </div>
  );
}
