"use client";

import { useEffect } from "react";

const CACHE_VERSION = "v1.3.1";
const ACTIVE_CACHE_NAME = `good-job-${CACHE_VERSION}`;
const CACHE_CLEANUP_KEY = "good-job-cache-cleanup-20260626";
const CACHE_CLEANUP_MESSAGE = { type: "PURGE_UNUSED_CACHES", version: ACTIVE_CACHE_NAME };

async function requestBrowserCacheCleanup() {
  if (typeof window === "undefined") return;

  try {
    if (window.localStorage.getItem(CACHE_CLEANUP_KEY) === "done") return;
  } catch {
    // localStorage를 사용할 수 없는 환경에서도 캐시 정리는 시도한다.
  }

  try {
    await fetch(`/cache-cleanup.txt?${CACHE_CLEANUP_KEY}`, {
      cache: "no-store",
      credentials: "same-origin",
    });
  } catch {
    // Clear-Site-Data가 지원되지 않거나 네트워크가 잠시 실패해도 Cache Storage 정리는 계속한다.
  }

  try {
    window.localStorage.setItem(CACHE_CLEANUP_KEY, "done");
  } catch {
    // ignore
  }
}

async function purgeLegacyCacheStorage() {
  if (typeof window === "undefined" || !("caches" in window)) return;

  const cacheNames = await caches.keys();

  await Promise.all(
    cacheNames
      .filter((cacheName) => cacheName.startsWith("good-job-") && cacheName !== ACTIVE_CACHE_NAME)
      .map((cacheName) => caches.delete(cacheName)),
  );

  const activeCache = await caches.open(ACTIVE_CACHE_NAME);
  const requests = await activeCache.keys();

  await Promise.all(
    requests
      .filter((request) => {
        const url = new URL(request.url);
        return url.pathname.startsWith("/widgets/") || url.pathname.startsWith("/widget/");
      })
      .map((request) => activeCache.delete(request)),
  );
}

function requestServiceWorkerCleanup(registration: ServiceWorkerRegistration) {
  const sendCleanupMessage = () => {
    const worker = registration.active ?? navigator.serviceWorker.controller;
    worker?.postMessage(CACHE_CLEANUP_MESSAGE);
  };

  sendCleanupMessage();

  registration.update().catch(() => undefined);
  navigator.serviceWorker.ready.then((readyRegistration) => {
    const worker = readyRegistration.active ?? navigator.serviceWorker.controller;
    worker?.postMessage(CACHE_CLEANUP_MESSAGE);
  });
}

export function useServiceWorker() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      requestBrowserCacheCleanup()
        .then(purgeLegacyCacheStorage)
        .catch(() => undefined)
        .finally(() => {
          navigator.serviceWorker
            .register("/sw.js", { updateViaCache: "none" })
            .then(requestServiceWorkerCleanup)
            .catch((err) => console.info("SW registration failed:", err));
        });
    };

    if ("requestIdleCallback" in window) {
      const idleId = window.requestIdleCallback(register, { timeout: 4000 });
      return () => window.cancelIdleCallback(idleId);
    }

    const timeoutId = globalThis.setTimeout(register, 2000);
    return () => globalThis.clearTimeout(timeoutId);
  }, []);
}
