/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import SiteMainMode from "@/components/SiteMainMode";
import Providers from "./providers";
import { I18nProvider } from "@/lib/i18n/I18nProvider";
import "./globals.css";
import "./ui-overrides.css"; // 데스크톱 레이아웃/표지 선반/설정 2단 — globals.css 다음에 로드되어야 함
import "./reference-ui.css"; // 레퍼런스 UI(리포트/교환/도감/일기장/상세 리더) — ui-overrides.css 다음에 로드되어야 함
import "./mobile-optimize.css"; // 모바일 웹 UI 최적화 — reference-ui.css 다음에 로드 (max-width: 767px만 적용)

export const metadata: Metadata = {
  title: "참 잘했어요",
  description: "꾸준한 기록을 돕는 일기장",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" },
    ],
    shortcut: ["/favicon.ico?v=2"],
    apple: [{ url: "/icons/icon-192.png?v=2", sizes: "192x192", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "참 잘했어요",
  },
  openGraph: {
    title: "참 잘했어요 — 그때 그 시절, 일기장",
    description: "내 하루를 읽은 존재가 짧은 답글을 남겨요.",
    type: "website",
    locale: "ko_KR",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: "#FDF8F0",
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <meta name="google-site-verification" content="rBHuSGZx9ban_d2wBQs5KkahAg8WMAvwndqcqQ28bak" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          href="https://cdn.jsdelivr.net/gh/projectnoonnu/2507-1@1.0/KyoboHandwriting2024psw.woff2"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" href="/icons/icon-192.png?v=2" type="image/png" sizes="192x192" />
        <link rel="apple-touch-icon" href="/icons/icon-192.png?v=2" />
      </head>
      <body>
        <Providers>
          {/* 언어 컨텍스트: /api/settings의 language를 화면 전체에 적용 */}
          <I18nProvider>
            <SiteMainMode />
            <div className="site-layout">
              <Header />
              <main id="site-main" className="site-main">
                {children}
              </main>
              <Footer />
              <BottomNav />
            </div>
          </I18nProvider>
        </Providers>
      </body>
    </html>
  );
}
