"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

const NAV_ITEMS = [
  {
    label: "홈",
    href: "/",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
  },
  {
    label: "책장",
    href: "/books",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 016.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" />
      </svg>
    ),
  },
  {
    label: "쓰기",
    href: "/write",
    isAction: true,
    icon: (_active: boolean) => (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 5v14M5 12h14" />
      </svg>
    ),
  },
  {
    label: "리포트",
    href: "/report",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 20V10M12 20V4M6 20v-6" />
      </svg>
    ),
  },
  {
    label: "설정",
    href: "/settings",
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "var(--ink-dark)" : "var(--ink-ghost)"} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  const hideOn = ["/write", "/onboarding", "/auth"];
  if (hideOn.some((p) => pathname.startsWith(p))) return null;

  return (
    <nav className="bottom-nav" aria-label="주요 메뉴">
      {NAV_ITEMS.map((item) => {
        const isActive = item.href === "/"
          ? pathname === "/"
          : pathname.startsWith(item.href);

        if (item.isAction) {
          return (
            <Link
              key={item.href}
              href="/books?action=write"
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
                {item.label}
              </span>
            </Link>
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
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
