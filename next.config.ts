import type { NextConfig } from "next";

/**
 * 프론트엔드 설정.
 *
 * rewrites: 브라우저의 /api/* 요청을 백엔드 배포 도메인으로 서버사이드 프록시한다.
 * - 쿠키(Supabase 세션)가 그대로 전달되므로 CORS/토큰 전달 코드가 필요 없다.
 * - 로컬 개발: API_BASE_URL=http://localhost:3001
 * - 프로덕션:  API_BASE_URL=https://good-job-backend.vercel.app (예시)
 */
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  // ── 이미지 최적화 ──────────────────────────────
  images: {
    remotePatterns: [],
    // WebP/AVIF 자동 변환 (Lighthouse 이미지 점수)
    formats: ["image/avif", "image/webp"],
    // 디바이스 폭 hint (LCP 개선)
    deviceSizes: [390, 768, 1024, 1280, 1920],
    imageSizes: [46, 92, 128, 180, 256],
    // 이미지 캐시 TTL 1년
    minimumCacheTTL: 31536000,
  },

  // ── 압축 ──────────────────────────────────────
  compress: true,

  // ── API 프록시 ─────────────────────────────────
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },

  // ── 보안 & 캐시 헤더 ───────────────────────────
  async headers() {
    return [
      // ─ 보안 헤더 (전체 페이지)
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          // CSP: 기본값 (script-src는 Next.js inline script 허용)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js 및 Supabase SDK
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              // 스타일
              "style-src 'self' 'unsafe-inline'",
              // 폰트
              "font-src 'self' data:",
              // 이미지 (Supabase storage, kakao profile)
              "img-src 'self' data: blob: https://*.supabase.co https://k.kakaocdn.net https://lh3.googleusercontent.com",
              // API 연결
              "connect-src 'self' https://*.supabase.co https://supabase.io",
              // frame
              "frame-ancestors 'none'",
            ].join("; "),
          },
        ],
      },

      // ─ 위젯 HTML: 홈 화면 내부 iframe에서 같은 도메인 위젯을 표시할 수 있게 허용
      // 전체 사이트의 frame 차단 정책은 유지하고, /widgets/* 정적 위젯만 예외 처리한다.
      {
        source: "/widgets/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self' blob: data:",
              "script-src 'self' blob: 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data: blob:",
              "img-src 'self' data: blob:",
              "connect-src 'self' blob: data:",
              "frame-ancestors 'self'",
            ].join("; "),
          },
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },

      // ─ 정적 자산: 1년 캐시 (immutable)
      {
        source: "/mascot/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/covers/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/icons/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },

      // ─ _next/static: Next.js가 내용 hash를 파일명에 포함하므로 immutable 가능
      {
        source: "/_next/static/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },

      // ─ _next/image: 변환된 이미지 캐싱
      {
        source: "/_next/image/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" }],
      },

      // ─ 폰트: 1년 캐시
      {
        source: "/(.*)\\.woff2",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },

      // ─ cache cleanup marker: 이전 브라우저/Service Worker 캐시를 한 번 정리한다.
      {
        source: "/cache-cleanup.txt",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, max-age=0, must-revalidate" },
          { key: "Clear-Site-Data", value: '"cache"' },
        ],
      },

      // ─ manifest & service worker: 재검증 필요
      {
        source: "/manifest.json",
        headers: [{ key: "Cache-Control", value: "public, max-age=0, must-revalidate" }],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
        ],
      },
    ];
  },
};

export default nextConfig;
