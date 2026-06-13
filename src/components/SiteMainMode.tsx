"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * 풀폭 레이아웃을 써야 하는 페이지를 제어한다.
 *
 * 주의:
 * /books/new 는 일기장 생성 폼이라 일반 중앙 정렬 레이아웃이어야 한다.
 * 기존처럼 /books 하위 전체를 full 로 처리하면 생성 화면이 너무 넓게 퍼진다.
 */
const FULL_WIDTH_ROUTES = ["/", "/books", "/exchange", "/report", "/dex", "/support"] as const;

const NORMAL_WIDTH_ROUTES = ["/books/new"] as const;

function isNormalWidthRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  return NORMAL_WIDTH_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );
}

function isFullWidthRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  if (isNormalWidthRoute(pathname)) {
    return false;
  }

  return FULL_WIDTH_ROUTES.some((route) => {
    if (route === "/") {
      return pathname === "/";
    }

    return pathname === route || pathname.startsWith(`${route}/`);
  });
}

export default function SiteMainMode() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const main = document.getElementById("site-main");
    if (!main) return;

    main.classList.toggle("site-main--full", isFullWidthRoute(pathname));

    return () => {
      main.classList.remove("site-main--full");
    };
  }, [pathname]);

  return null;
}