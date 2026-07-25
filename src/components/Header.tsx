"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { apiGetJson, invalidateApiCache } from "@/lib/apiCache";
import AuthModal from "@/components/auth/AuthModal";
import BrandLogo from "@/components/BrandLogo";
import styles from "./NavigationShell.module.css";
import type { User } from "@supabase/supabase-js";

type AuthMode = "login" | "signup";
type NavIconType = "home" | "journal" | "exchange" | "report" | "dex";

interface Profile {
  email?: string | null;
  nickname?: string | null;
  profileImage?: string | null;
}

const PRIMARY_NAV_ITEMS: { href: string; label: string; icon: NavIconType }[] = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/books", label: "일기장", icon: "journal" },
  { href: "/exchange", label: "교환일기", icon: "exchange" },
  { href: "/report", label: "감정 리포트", icon: "report" },
  { href: "/dex", label: "나의 도감", icon: "dex" },
];

const isNavActive = (pathname: string, href: string) => {
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

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t, language, setLanguage } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [logoutPending, setLogoutPending] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");

  const fetchUnread = useCallback(async () => {
    try {
      const data = await apiGetJson<{ unreadCount?: number }>("/api/notifications", {
        ttlMs: 5_000,
      });
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // 알림 수 조회 실패는 내비게이션 사용을 막지 않습니다.
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiGetJson<{ profile?: Profile }>("/api/profile", {
        ttlMs: 30_000,
      });
      setProfile(data.profile ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    void supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      setAuthChecked(true);
      if (data.user) {
        void fetchUnread();
        void fetchProfile();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;

      const nextUser = session?.user ?? null;
      setUser(nextUser);
      setAuthChecked(true);
      setMenuOpen(false);

      if (nextUser) {
        void fetchUnread();
        void fetchProfile();
      } else {
        invalidateApiCache();
        setUnreadCount(0);
        setProfile(null);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchUnread]);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!user) return;

    const refresh = () => void fetchUnread();
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void fetchUnread();
    };

    window.addEventListener("notifications:changed", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refreshWhenVisible);

    return () => {
      window.removeEventListener("notifications:changed", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [fetchUnread, user]);

  const profileImage = useMemo(() => {
    const metadataAvatar = user?.user_metadata?.avatar_url;
    if (typeof metadataAvatar === "string" && metadataAvatar.trim()) return metadataAvatar;
    if (profile?.profileImage?.trim()) return profile.profileImage;
    return null;
  }, [profile?.profileImage, user?.user_metadata]);

  const displayName = useMemo(() => {
    const nickname = profile?.nickname?.trim();
    if (nickname) return nickname;

    const metadataName = user?.user_metadata?.name || user?.user_metadata?.full_name;
    if (typeof metadataName === "string" && metadataName.trim()) return metadataName.trim();

    const emailName = user?.email?.split("@")[0]?.trim();
    return emailName || "내 계정";
  }, [profile?.nickname, user?.email, user?.user_metadata]);

  const openAuthModal = (mode: AuthMode) => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleLogout = async () => {
    if (logoutPending) return;

    setLogoutPending(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      invalidateApiCache();
      setMenuOpen(false);
      setUnreadCount(0);
      router.replace("/");
      router.refresh();
    } finally {
      setLogoutPending(false);
    }
  };

  if (pathname === "/" && (!authChecked || !user)) return null;

  return (
    <>
      <header className={styles.header} aria-label="상단 메뉴">
        <div className={styles.headerInner}>
          <Link
            href="/"
            className={styles.logo}
            prefetch={false}
            aria-label={t("home.logoAria")}
          >
            <BrandLogo language={language} priority />
          </Link>

          {user && (
            <nav className={styles.desktopNav} aria-label={t("nav.mainMenu")}>
              {PRIMARY_NAV_ITEMS.map((item) => {
                const active = isNavActive(pathname, item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    prefetch={false}
                    aria-current={active ? "page" : undefined}
                    className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
                  >
                    <DashboardNavIcon type={item.icon} />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          )}

          <div className={styles.actions}>
            {!authChecked ? (
              <span className={styles.loadingSlot} aria-hidden="true" />
            ) : user ? (
              <>
                <Link
                  href="/notifications"
                  prefetch={false}
                  className={styles.iconButton}
                  aria-label={
                    unreadCount > 0
                      ? t("nav.unread", { n: unreadCount })
                      : t("nav.notifications")
                  }
                >
                  <BellIcon />
                  {unreadCount > 0 && (
                    <span className={styles.badge}>{unreadCount > 9 ? "9+" : unreadCount}</span>
                  )}
                </Link>

                <Link
                  href="/support"
                  prefetch={false}
                  className={`${styles.iconButton} ${styles.supportButton}`}
                  aria-label="도움말"
                >
                  <HelpIcon />
                </Link>

                <div className={styles.profileMenu}>
                  <button
                    type="button"
                    onClick={() => setMenuOpen((open) => !open)}
                    className={styles.profileButton}
                    aria-expanded={menuOpen}
                    aria-controls="global-account-menu"
                    aria-label={`${displayName} 계정 메뉴`}
                  >
                    <span className={styles.avatar}>
                      <Image
                        src={profileImage || "/mascot/mascot-idle.png"}
                        alt=""
                        width={42}
                        height={42}
                        unoptimized
                      />
                    </span>
                    <span className={styles.profileName}>{displayName}님</span>
                    <span className={styles.profileChevron}>
                      <ChevronDownIcon />
                    </span>
                  </button>

                  {menuOpen && (
                    <>
                      <button
                        type="button"
                        className={styles.backdrop}
                        onClick={() => setMenuOpen(false)}
                        aria-label="계정 메뉴 닫기"
                      />
                      <div id="global-account-menu" className={styles.menuPanel} role="menu">
                        <strong className={styles.menuHeading}>{displayName}님의 계정</strong>

                        <div className={styles.languageGroup} role="group" aria-label="Language / 언어">
                          <button
                            type="button"
                            className={`${styles.languageButton} ${
                              language === "ko" ? styles.languageButtonActive : ""
                            }`}
                            aria-pressed={language === "ko"}
                            lang="ko"
                            onClick={() => void setLanguage("ko")}
                          >
                            한국어
                          </button>
                          <button
                            type="button"
                            className={`${styles.languageButton} ${
                              language === "en" ? styles.languageButtonActive : ""
                            }`}
                            aria-pressed={language === "en"}
                            lang="en"
                            onClick={() => void setLanguage("en")}
                          >
                            EN
                          </button>
                        </div>

                        <Link
                          href="/settings"
                          prefetch={false}
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <SettingsIcon />
                          <span>{t("nav.settings")}</span>
                        </Link>
                        <Link
                          href="/support"
                          prefetch={false}
                          className={styles.menuItem}
                          role="menuitem"
                          onClick={() => setMenuOpen(false)}
                        >
                          <HelpIcon />
                          <span>도움말</span>
                        </Link>
                        <button
                          type="button"
                          className={`${styles.menuItem} ${styles.logoutItem}`}
                          role="menuitem"
                          onClick={handleLogout}
                          disabled={logoutPending}
                        >
                          <LogoutIcon />
                          <span>{logoutPending ? "로그아웃 중…" : t("nav.logout")}</span>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </>
            ) : (
              <>
                <button
                  type="button"
                  className={styles.authButton}
                  onClick={() => openAuthModal("login")}
                >
                  {t("nav.login")}
                </button>
                <button
                  type="button"
                  className={`${styles.authButton} ${styles.authButtonSolid}`}
                  onClick={() => openAuthModal("signup")}
                >
                  {t("nav.signup")}
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <AuthModal
        open={authModalOpen}
        mode={authModalMode}
        next="/"
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthModalMode}
      />
    </>
  );
}

function DashboardNavIcon({ type }: { type: NavIconType }) {
  const commonProps = {
    width: 19,
    height: 19,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };

  if (type === "home") {
    return (
      <svg {...commonProps}>
        <path d="M3 10.5 12 3l9 7.5" />
        <path d="M5 10v10h14V10" />
        <path d="M9.5 20v-6h5v6" />
      </svg>
    );
  }

  if (type === "journal") {
    return (
      <svg {...commonProps}>
        <path d="M7 4h10a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
        <path d="M9 8h6M9 12h5" />
      </svg>
    );
  }

  if (type === "exchange") {
    return (
      <svg {...commonProps}>
        <path d="M7 7h11l-2.2-2.2" />
        <path d="M17 17H6l2.2 2.2" />
        <rect x="4" y="9" width="7" height="6" rx="1.4" />
        <rect x="13" y="9" width="7" height="6" rx="1.4" />
      </svg>
    );
  }

  if (type === "report") {
    return (
      <svg {...commonProps}>
        <path d="M5 19V5" />
        <path d="M9 19v-7" />
        <path d="M13 19V8" />
        <path d="M17 19v-4" />
        <path d="M4 19h16" />
      </svg>
    );
  }

  return (
    <svg {...commonProps}>
      <path d="M12 4 14.1 8.4 19 9.1 15.5 12.5 16.3 17.4 12 15.1 7.7 17.4 8.5 12.5 5 9.1 9.9 8.4 12 4Z" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.85 1.9c-.84.58-1.32 1.07-1.32 2.1" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21h-4v-.1A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3v-4h.1A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3h4v.1A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 9c.25.36.46.75.6 1 .14.33.35.7.9.4h.1v4h-.1c-.55-.3-.76.07-.9.4-.14.25-.35.64-.6 1Z" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M10 17l5-5-5-5" />
      <path d="M15 12H3" />
      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
