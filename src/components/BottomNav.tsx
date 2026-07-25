"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { getLastBookId } from "@/lib/lastBook";
import styles from "./NavigationShell.module.css";
import type { DictKey } from "@/lib/i18n/dictionary";

const NAV_ITEMS: {
  labelKey: DictKey;
  href: string;
  icon: (active: boolean) => React.ReactNode;
}[] = [
  {
    labelKey: "nav.home",
    href: "/",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.1" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5Z" />
        <path d="M9 21v-9h6v9" />
      </svg>
    ),
  },
  {
    labelKey: "nav.bookshelfShort",
    href: "/books",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.1" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z" />
      </svg>
    ),
  },
  {
    labelKey: "nav.exchange",
    href: "/exchange",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.1" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M4 7h13l-2.5-2.5M20 17H7l2.5 2.5" />
        <rect x="3" y="10" width="8" height="7" rx="1.5" />
        <rect x="13" y="7" width="8" height="7" rx="1.5" opacity="0.45" />
      </svg>
    ),
  },
  {
    labelKey: "nav.dex",
    href: "/dex",
    icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? "2.1" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="m12 4 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2L7.8 17l.8-4.7L5.2 9l4.7-.7L12 4Z" />
      </svg>
    ),
  },
];

const isActivePath = (pathname: string, href: string) => {
  if (href === "/") return pathname === "/";
  if (href === "/books") {
    return (
      pathname.startsWith("/books") ||
      pathname.startsWith("/diaries") ||
      pathname.startsWith("/diary")
    );
  }
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useI18n();
  const [authenticated, setAuthenticated] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setAuthenticated(Boolean(data.user));
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setAuthenticated(Boolean(session?.user));
      setAuthChecked(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const hiddenRoutes = ["/write", "/onboarding", "/auth"];
  const shouldShow =
    authChecked &&
    authenticated &&
    !hiddenRoutes.some((route) => pathname.startsWith(route));

  useEffect(() => {
    const className = "has-auth-bottom-nav";
    document.body.classList.toggle(className, shouldShow);

    return () => {
      document.body.classList.remove(className);
    };
  }, [shouldShow]);

  const goWrite = () => {
    const lastBookId = getLastBookId();
    router.push(lastBookId ? `/write?bookId=${lastBookId}` : "/books?action=write");
  };

  if (!shouldShow) return null;

  return (
    <nav className={styles.bottomNav} aria-label={t("nav.mainMenu")}>
      <BottomNavLink item={NAV_ITEMS[0]} pathname={pathname} label={t(NAV_ITEMS[0].labelKey)} />
      <BottomNavLink item={NAV_ITEMS[1]} pathname={pathname} label={t(NAV_ITEMS[1].labelKey)} />

      <button type="button" onClick={goWrite} className={styles.writeButton} aria-label={t("nav.write")}>
        <span className={styles.writeIcon}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </span>
        <span className={styles.bottomLabel}>{t("nav.write")}</span>
      </button>

      <BottomNavLink item={NAV_ITEMS[2]} pathname={pathname} label={t(NAV_ITEMS[2].labelKey)} />
      <BottomNavLink item={NAV_ITEMS[3]} pathname={pathname} label={t(NAV_ITEMS[3].labelKey)} />
    </nav>
  );
}

function BottomNavLink({
  item,
  pathname,
  label,
}: {
  item: (typeof NAV_ITEMS)[number];
  pathname: string;
  label: string;
}) {
  const active = isActivePath(pathname, item.href);

  return (
    <Link
      href={item.href}
      prefetch={false}
      className={`${styles.bottomItem} ${active ? styles.bottomItemActive : ""}`}
      aria-current={active ? "page" : undefined}
    >
      {item.icon(active)}
      <span className={styles.bottomLabel}>{label}</span>
    </Link>
  );
}
