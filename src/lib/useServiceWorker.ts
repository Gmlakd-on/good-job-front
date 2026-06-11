"use client";

import { useEffect } from "react";

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.info("SW registration failed:", err));
    }
  }, []);
}
