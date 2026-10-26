'use client';

import { useEffect } from 'react';

/** Registers /sw.js in production so the app shell and history work offline. */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  }, []);

  return null;
}
