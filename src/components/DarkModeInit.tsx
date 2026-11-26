'use client';

import { useEffect } from 'react';

export function DarkModeInit() {
  useEffect(() => {
    const saved = localStorage.getItem('gistbird_dark_mode');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const isDark = saved ? saved === '1' : prefersDark;
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  return null;
}
