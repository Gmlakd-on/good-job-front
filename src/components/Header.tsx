"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { User } from "@supabase/supabase-js";

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const fetchUnread = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) { const d = await res.json(); setUnreadCount(d.unreadCount || 0); }
    } catch { /* 무시 */ }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) fetchUnread();
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (s?.user) fetchUnread(); else setUnreadCount(0);
    });
    return () => subscription.unsubscribe();
  }, [fetchUnread]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => fetchUnread();
    const visChange = () => { if (document.visibilityState === "visible") fetchUnread(); };
    window.addEventListener("notifications:changed", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visChange);
    return () => {
      window.removeEventListener("notifications:changed", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visChange);
    };
  }, [fetchUnread, user]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMenuOpen(false);
    setUnreadCount(0);
    router.push("/");
    router.refresh();
  };

  // On the main page the header is part of the page component itself
  if (pathname === "/") return null;

  return (
    <header
      className="site-header"
      style={{
        background: scrolled ? "rgba(254,252,248,0.92)" : "transparent",
        backdropFilter: scrolled ? "blur(16px)" : "none",
        borderBottom: scrolled ? "1px solid var(--border-hairline)" : "1px solid transparent",
      }}
    >
      <div className="site-header__inner">
        <Link href="/" className="flex items-center gap-1.5" aria-label={t("nav.toHome")}>
          <span className="font-bold text-base" style={{ color: "var(--stamp-vermilion)", fontFamily: "Noto Serif KR, serif", letterSpacing: "-0.02em" }}>
            참 잘했어요
          </span>
          <span className="text-base">✨</span>
        </Link>

        {/* 로그인 상태 - 내비 링크 */}
        {user && (
          <nav className="site-header__nav">
            <NavLink href="/books" label={t("nav.bookshelf")} />
            <NavLink href="/exchange" label={t("nav.exchange")} />
            <NavLink href="/report" label={t("nav.report")} />
          </nav>
        )}

        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* 알림 아이콘 */}
              <Link href="/notifications" className="relative flex h-8 w-8 items-center justify-center rounded-md transition-all hover:bg-[rgba(74,52,40,0.04)]"
                aria-label={unreadCount > 0 ? t("nav.unread", { n: unreadCount }) : t("nav.notifications")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ color: "var(--text-secondary)" }}>
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-white"
                    style={{ background: "var(--stamp-vermilion)", fontSize: "9px", fontWeight: 600, lineHeight: 1 }}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              {/* 설정 아이콘 */}
              <Link href="/settings" className="flex h-8 w-8 items-center justify-center rounded-md transition-all hover:bg-[rgba(74,52,40,0.04)]" aria-label={t("nav.settings")}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" style={{ color: "var(--text-secondary)" }}>
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </Link>

              {/* 이메일 아바타 드롭다운 */}
              <div className="relative">
                <button type="button" onClick={() => setMenuOpen(!menuOpen)}
                  className="flex h-8 w-8 items-center justify-center rounded-md text-xs font-semibold transition-all"
                  style={{ background: "var(--paper-aged)", color: "var(--text-primary)" }} aria-label={t("nav.menu")}>
                  {user.email?.charAt(0).toUpperCase() || "?"}
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 top-11 z-20 min-w-[180px] overflow-hidden"
                      style={{ borderRadius: "var(--radius-sm)", background: "var(--paper-white)", border: "1px solid var(--border-subtle)", boxShadow: "var(--shadow-book)" }}>
                      <div className="p-3 pb-2">
                        <p className="truncate text-xs max-w-[156px]" style={{ color: "var(--text-muted)" }}>{user.email}</p>
                      </div>
                      <div className="mx-3 h-px" style={{ background: "var(--border-hairline)" }} />
                      <div className="p-1.5">
                        <MenuLink href="/books" label={t("nav.bookshelf")} onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/exchange" label={t("nav.exchange")} onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/notifications" label={unreadCount > 0 ? `${t("nav.notifications")} (${unreadCount})` : t("nav.notifications")} onClick={() => setMenuOpen(false)} />
                        <MenuLink href="/settings" label={t("nav.settings")} onClick={() => setMenuOpen(false)} />
                      </div>
                      <div className="mx-3 h-px" style={{ background: "var(--border-hairline)" }} />
                      <div className="p-1.5">
                        <button type="button" onClick={handleLogout}
                          className="w-full px-3 py-2.5 text-left text-sm transition-colors hover:bg-[rgba(74,52,40,0.03)]"
                          style={{ borderRadius: "var(--radius-xs)", color: "var(--stamp-vermilion)" }}>
                          {t("nav.logout")}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/auth" className="px-3 py-1.5 text-sm font-medium rounded-full transition-all"
                style={{ color: "var(--text-secondary)", border: "1px solid var(--border-subtle)" }}>
                {t("nav.login")}
              </Link>
              <Link href="/auth?mode=signup" className="px-3 py-1.5 text-sm font-medium rounded-full text-white transition-all"
                style={{ background: "var(--stamp-vermilion)" }}>
                {t("nav.signup")}
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

function NavLink({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="text-sm font-medium transition-colors hover:opacity-75" style={{ color: "var(--text-secondary)" }}>
      {label}
    </Link>
  );
}

function MenuLink({ href, label, onClick }: { href: string; label: string; onClick: () => void }) {
  return (
    <Link href={href} onClick={onClick}
      className="block px-3 py-2.5 text-sm transition-colors hover:bg-[rgba(74,52,40,0.03)]"
      style={{ borderRadius: "var(--radius-xs)", color: "var(--text-primary)" }}>
      {label}
    </Link>
  );
}
