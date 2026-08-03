"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Non-fatal - the app works fine without the service worker,
        // it just won't be installable as a PWA.
      });
    }
  }, []);

  return null;
}
