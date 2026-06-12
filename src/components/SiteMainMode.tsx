"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const FULL_WIDTH_ROUTES = ["/", "/books", "/exchange", "/report", "/dex", "/support"] as const;

function isFullWidthRoute(pathname: string | null): boolean {
  if (!pathname) return false;

  return FULL_WIDTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));
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
