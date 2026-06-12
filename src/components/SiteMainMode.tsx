"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const FULL_WIDTH_PREFIXES = ["/", "/books", "/diaries", "/diary", "/exchange", "/report", "/dex"] as const;

function shouldUseFullWidthMain(pathname: string) {
  if (pathname === "/") return true;
  return FULL_WIDTH_PREFIXES.some((prefix) => prefix !== "/" && (pathname === prefix || pathname.startsWith(`${prefix}/`)));
}

export default function SiteMainMode() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    const main = document.getElementById("site-main");
    if (!main) return;

    main.classList.toggle("site-main--full", shouldUseFullWidthMain(pathname));

    return () => {
      main.classList.remove("site-main--full");
    };
  }, [pathname]);

  return null;
}
