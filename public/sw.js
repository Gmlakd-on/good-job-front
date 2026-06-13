const CACHE_NAME = "welldone-v1.2.0";
const STATIC_ASSETS = ["/", "/onboarding"];

// 캐시하면 안 되는 민감 경로
const NO_CACHE_PATHS = [
  "/diary/",
  "/diaries",
  "/settings",
  "/admin",
  "/auth",
  "/write",
  "/books/",
  "/report",
  "/notifications",
  "/exchange",
  "/api/",
];

const STATIC_ASSET_PREFIXES = [
  "/covers/",
  "/icons/",
  "/home-icons/",
  "/mascot/",
  "/personas/",
];

function isStaticAsset(url) {
  return (
    /\.(png|jpg|jpeg|svg|webp|woff2?|css|js|ico)$/i.test(url.pathname) ||
    STATIC_ASSET_PREFIXES.some((prefix) => url.pathname.startsWith(prefix))
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
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== "GET") return;
  if (NO_CACHE_PATHS.some((path) => url.pathname.startsWith(path))) return;

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request));
    return;
  }

  if (url.pathname === "/") {
    event.respondWith(networkFirst(request));
  }
});
