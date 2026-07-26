import type { NextConfig } from "next";

/**
 * 프론트엔드 설정.
 *
 * rewrites: 브라우저의 /api/* 요청을 백엔드 배포 도메인으로 서버사이드 프록시한다.
 * - 쿠키(Supabase 세션)가 그대로 전달되므로 CORS/토큰 전달 코드가 필요 없다.
 * - 로컬 개발: API_BASE_URL=http://localhost:3001
 * - 프로덕션: API_BASE_URL=https://your-backend.example.com
 */
const API_BASE_URL = process.env.API_BASE_URL ?? "http://localhost:3001";
const isProduction = process.env.NODE_ENV === "production";

const commonSecurityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin-allow-popups" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
  { key: "Origin-Agent-Cluster", value: "?1" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  ...(isProduction
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000",
        },
      ]
    : []),
];

const widgetContentSecurityPolicy = [
  "default-src 'none'",
  "script-src 'sha256-PJ/CF3djpaq7mMD+/ttw4SGhLs9Hh8oIEl9dHw8jMI8='",
  "style-src 'sha256-Oqh0A97a46obHQI+6v7LJ6UsHVLdk59x0V+MAQUKRaM='",
  "img-src data: blob:",
  "media-src 'self' data: blob:",
  "font-src data:",
  "connect-src 'none'",
  "worker-src 'none'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join("; ");

const nextConfig: NextConfig = {
  poweredByHeader: false,

  images: {
    remotePatterns: [],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 768, 1024, 1280, 1920],
    imageSizes: [46, 92, 128, 180, 256],
    minimumCacheTTL: 31536000,
  },

  compress: true,

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_BASE_URL}/api/:path*`,
      },
    ];
  },

  async headers() {
    return [
      {
        source: "/(.*)",
        headers: commonSecurityHeaders,
      },
      {
        source: "/widgets/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "no-referrer" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
          },
          { key: "Content-Security-Policy", value: widgetContentSecurityPolicy },
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
          { key: "CDN-Cache-Control", value: "no-store" },
          { key: "Vercel-CDN-Cache-Control", value: "no-store" },
        ],
      },
      {
        source: "/mascot/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/covers/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/icons/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/_next/image/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=86400, stale-while-revalidate=604800",
          },
        ],
      },
      {
        source: "/(.*)\\.woff2",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        source: "/cache-cleanup.txt",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, max-age=0, must-revalidate" },
          { key: "Clear-Site-Data", value: '"cache"' },
        ],
      },
      {
        source: "/manifest.json",
        headers: [
          { key: "Cache-Control", value: "public, max-age=0, must-revalidate" },
        ],
      },
      {
        source: "/sw.js",
        headers: [
          { key: "Cache-Control", value: "no-cache, no-store, max-age=0, must-revalidate" },
          { key: "Pragma", value: "no-cache" },
          { key: "Expires", value: "0" },
          { key: "Service-Worker-Allowed", value: "/" },
        ],
      },
    ];
  },
};

export default nextConfig;
