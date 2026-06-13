"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getLastBookId } from "@/lib/lastBook";
import type { DictKey } from "@/lib/i18n/dictionary";

const NAV_ITEMS: {
  labelKey: DictKey;
  href: string;
  isAction?: boolean;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    labelKey: "nav.home",
    href: "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    labelKey: "nav.bookshelfShort",
    href: "/books",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.write",
    href: "/write",
    isAction: true,
    icon: (_active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    labelKey: "nav.exchange",
    href: "/exchange",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 6h-4a4 4 0 00-8 0H5a2 2 0 00-2 2v11a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2z" opacity="0" />
        <path d="M4 7h13l-2.5-2.5M20 17H7l2.5 2.5" />
        <rect x="3" y="10" width="8" height="7" rx="1.5" />
        <rect x="13" y="7" width="8" height="7" rx="1.5" opacity="0.45" />
      </svg>
    ),
  },
  {
    labelKey: "nav.dex",
    href: "/dex",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 4l2.1 4.3 4.7.7-3.4 3.3.8 4.7L12 14.8 7.8 17l.8-4.7-3.4-3.3 4.7-.7L12 4z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [navHidden, setNavHidden] = useState(false);

  useEffect(() => {
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;

      if (currentY < 24) {
        setNavHidden(false);
      } else if (currentY > lastY + 6) {
        setNavHidden(true);
      } else if (currentY < lastY - 6) {
        setNavHidden(false);
      }

      lastY = currentY;
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // "쓰기"는 마지막으로 쓰던 일기장으로 바로 진입 (없으면 기존 흐름)
  const goWrite = () => {
    const last = getLastBookId();
    router.push(last ? `/write?bookId=${last}` : "/books?action=write");
  };
  if (pathname === "/") return null;

  const hideOn = ["/write", "/onboarding", "/auth"];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className={`bottom-nav ${navHidden ? "bottom-nav--hidden" : ""}`} aria-label={t("nav.mainMenu")}>
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);

        if (item.isAction) {
          return (
            <button
              key={item.href}
              type="button"
              onClick={goWrite}
              aria-label="일기 쓰기"
              className="flex flex-col items-center justify-center -mt-3"
            >
              <div
                className="flex items-center justify-center transition-transform active:scale-90"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: "var(--radius-sm)",
                  background: "var(--ink-dark)",
                  boxShadow: "0 2px 8px rgba(42, 36, 32, 0.2)",
                }}
              >
                {item.icon(false)}
              </div>
              <span
                className="text-[10px] mt-1 font-medium"
                style={{ color: "var(--text-muted)" }}
              >
                {t(item.labelKey)}
              </span>
            </button>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex flex-col items-center justify-center gap-0.5 py-1 transition-colors"
          >
            {item.icon(isActive)}
            <span
              className="text-[10px] font-medium"
              style={{ color: isActive ? "var(--ink-dark)" : "var(--text-muted)" }}
            >
              {t(item.labelKey)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
