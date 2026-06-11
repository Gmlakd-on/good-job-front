/* eslint-disable @next/next/no-page-custom-font */
import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import BottomNav from "@/components/BottomNav";
import SiteMainMode from "@/components/SiteMainMode";
import Providers from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "참 잘했어요 — 혼자 견디지 말자",
  description: "오늘의 일기를 읽고, 판단하지 않는 짧은 답글을 남기는 감정 일기장.",
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.ico" }],
    apple: [{ url: "/icons/icon-192.png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "참 잘했어요",
  },
  openGraph: {
    title: "참 잘했어요 — 감정 일기장",
    description: "어쭙잖은 위로 대신, 내 하루를 읽은 존재가 짧은 답글을 남겨요.",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Gaegu:wght@400;700&family=Noto+Sans+KR:wght@300;400;500;700&family=Noto+Serif+KR:wght@400;700&display=swap"
          rel="stylesheet"
        />
        <link rel="apple-touch-icon" href="/icons/icon-192.png" />
      </head>
      <body>
        <Providers>
          <SiteMainMode />
          <div className="site-layout">
            <Header />
            <main id="site-main" className="site-main">
              {children}
            </main>
            <Footer />
            <BottomNav />
          </div>
        </Providers>
      </body>
    </html>
  );
}
