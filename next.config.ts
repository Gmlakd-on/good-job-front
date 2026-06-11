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
  images: {
    remotePatterns: [],
  },
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
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // 정적 자산 장기 캐싱 (Lighthouse 성능)
        source: "/mascot/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
      {
        source: "/covers/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
