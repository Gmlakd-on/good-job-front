"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export default function SiteMainMode() {
  const pathname = usePathname();

  useEffect(() => {
    const main = document.getElementById("site-main");
    if (!main) return;

    main.classList.toggle("site-main--full", pathname === "/");

    return () => {
      main.classList.remove("site-main--full");
    };
  }, [pathname]);

  return null;
}
