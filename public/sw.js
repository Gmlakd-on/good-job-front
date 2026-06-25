const CACHE_VERSION = "v1.3.1";
const CACHE_NAME = `good-job-${CACHE_VERSION}`;
const STATIC_ASSETS = ["/", "/onboarding"];

// 캐시하면 안 되는 민감 경로
const NO_CACHE_PATHS = [
  "/diary/",
  "/diaries",
  "/settings",
  "/admin",
  "/auth",
  "/oauth",
  "/write",
  "/books/",
  "/report",
  "/notifications",
  "/exchange",
  "/api/",
];

// 위젯은 HTML/이미지/스크립트 모두 네트워크에서 최신 파일을 받는다.
// 이전 Canvas.dc/support.js 번들 캐시가 남아 있으면 React CDN 에러가 재발할 수 있어서
// Service Worker Cache Storage에는 절대 보관하지 않는다.
const WIDGET_PATH_PREFIXES = ["/widgets/", "/widget/"];
const STALE_WIDGET_CACHE_PATTERNS = [
  "/widgets/chami-widget.html",
  "/widgets/chami-widget-standalone.html",
  "/widgets/support.js",
  "/widgets/Canvas.dc.html",
  "/widget/chami-widget.html",
  "/support.js",
  "/Canvas.dc.html",
  "unpkg.com/react",
  "unpkg.com/react-dom",
  "react.production.min.js",
  "react-dom.production.min.js",
  "[bundle]",
  "__bundler",
];

const STATIC_ASSET_PREFIXES = [
  "/covers/",
  "/icons/",
  "/home-icons/",
  "/mascot/",
  "/personas/",
];

function isWidgetPath(url) {
  return url.origin === self.location.origin && WIDGET_PATH_PREFIXES.some((prefix) => url.pathname.startsWith(prefix));
}

function isNoCachePath(url) {
  return NO_CACHE_PATHS.some((path) => url.pathname.startsWith(path)) || isWidgetPath(url);
}

function isStaticAsset(url) {
  if (isWidgetPath(url)) return false;

  return (
    /\.(png|jpg|jpeg|svg|webp|woff2?|css|js|ico)$/i.test(url.pathname) ||
    STATIC_ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
  );
}

function isStaleWidgetRequest(request) {
  const url = new URL(request.url);
  const normalized = `${url.origin}${url.pathname}${url.search}`;

  return (
    isWidgetPath(url) ||
    STALE_WIDGET_CACHE_PATTERNS.some((pattern) => normalized.includes(pattern) || request.url.includes(pattern))
  );
}

async function deleteMatchingRequests(cacheName, predicate) {
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();

  await Promise.all(
    requests
      .filter((request) => {
        try {
          return predicate(request);
        } catch {
          return false;
        }
      })
      .map((request) => cache.delete(request)),
  );
}

async function cleanupUnusedCaches() {
  const keys = await caches.keys();

  await Promise.all(
    keys.map(async (key) => {
      // good-job의 이전 버전 캐시는 통째로 제거한다.
      if (key !== CACHE_NAME) {
        await caches.delete(key);
        return;
      }

      // 현재 캐시 안에 남아 있는 위젯/번들러 관련 요청만 제거한다.
      await deleteMatchingRequests(key, isStaleWidgetRequest);
    }),
  );
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  const response = await fetch(request);
  if (response.ok) {
    const clone = response.clone();
    const cache = await caches.open(CACHE_NAME);
    await cache.put(request, clone);
  }
  return response;
}

async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const clone = response.clone();
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, clone);
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") return caches.match("/");
    return new Response("오프라인입니다.", { status: 503 });
  }
}

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(cleanupUnusedCaches().then(() => self.clients.claim()));
});

self.addEventListener("message", (event) => {
  if (event.data?.type !== "PURGE_UNUSED_CACHES") return;

  event.waitUntil(cleanupUnusedCaches());
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (url.origin !== self.location.origin) return;

  // 민감 페이지와 위젯은 Service Worker가 가로채지도, 캐시하지도 않는다.
  if (isNoCachePath(url)) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname === "/") {
    event.respondWith(networkFirst(request));
  }
});
