"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.info("SW registration failed:", err));
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(register, { timeout: 4000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(register, 2000);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);
}
