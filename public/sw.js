const CACHE_NAME = "welldone-v1.1.0";
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // GET 요청만 캐싱 대상
  if (request.method !== "GET") return;

  // 민감 경로는 캐싱하지 않음
  if (NO_CACHE_PATHS.some((p) => url.pathname.startsWith(p))) return;

  // 정적 에셋만 캐싱 (covers, icons, fonts 등)
  const isStaticAsset = /\.(png|jpg|jpeg|svg|webp|woff2?|css|js|ico)$/i.test(url.pathname)
    || url.pathname.startsWith("/covers/")
    || url.pathname.startsWith("/icons/");

  if (!isStaticAsset && url.pathname !== "/") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok && isStaticAsset) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      })
      .catch(() => {
        return caches.match(request).then((cached) => {
          if (cached) return cached;
          if (request.mode === "navigate") {
            return caches.match("/");
          }
          return new Response("오프라인입니다.", { status: 503 });
        });
      })
  );
});
