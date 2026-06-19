"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { apiGetJson, invalidateApiCache } from "@/lib/apiCache";
import AuthModal from "@/components/auth/AuthModal";
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
  if (href === "/books") return pathname.startsWith("/books") || pathname.startsWith("/diaries") || pathname.startsWith("/diary");
  return pathname === href || pathname.startsWith(`${href}/`);
};

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const { t } = useI18n();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");

  const fetchUnread = useCallback(async () => {
    try {
      const data = await apiGetJson<{ unreadCount?: number }>("/api/notifications", { ttlMs: 5_000 });
      setUnreadCount(data.unreadCount || 0);
    } catch {
      // 읽지 않은 알림 수는 보조 정보라 실패해도 화면은 유지합니다.
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      const data = await apiGetJson<{ profile?: Profile }>("/api/profile", { ttlMs: 30_000 });
      setProfile(data.profile ?? null);
    } catch {
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      if (data.user) {
        void fetchUnread();
        void fetchProfile();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setMenuOpen(false);
      if (session?.user) {
        void fetchUnread();
        void fetchProfile();
      } else {
        invalidateApiCache();
        setUnreadCount(0);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, fetchUnread]);

  useEffect(() => {
    if (!user) return;
    const refresh = () => fetchUnread();
    const visibilityRefresh = () => {
      if (document.visibilityState === "visible") void fetchUnread();
    };

    window.addEventListener("notifications:changed", refresh);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", visibilityRefresh);

    return () => {
      window.removeEventListener("notifications:changed", refresh);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", visibilityRefresh);
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
    const supabase = createClient();
    await supabase.auth.signOut();
    invalidateApiCache();
    setMenuOpen(false);
    setUnreadCount(0);
    router.push("/");
    router.refresh();
  };

  if (pathname === "/" && !user) return null;

  return (
    <header className="chami-home-nav chami-global-nav" aria-label="상단 메뉴">
      <div className="chami-home-nav__inner">
        <Link href="/" className="chami-home-nav__logo" aria-label={t("nav.toHome")}>
          참 잘했어요
        </Link>

        {user && (
          <nav className="chami-home-nav__links" aria-label={t("nav.mainMenu")}>
            {PRIMARY_NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isNavActive(pathname, item.href) ? "page" : undefined}
                className={`chami-home-nav__link ${isNavActive(pathname, item.href) ? "chami-home-nav__link--active" : ""}`}
              >
                <DashboardNavIcon type={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        )}

        <div className="chami-home-nav__actions">
          {user ? (
            <>
              <Link
                href="/notifications"
                className="chami-home-nav__icon chami-home-nav__icon--notifications"
                style={{ position: "relative" }}
                aria-label={unreadCount > 0 ? t("nav.unread", { n: unreadCount }) : t("nav.notifications")}
              >
                <BellIcon />
                {unreadCount > 0 && <span className="chami-home-nav__badge">{unreadCount > 9 ? "9+" : unreadCount}</span>}
              </Link>
              <Link href="/support" className="chami-home-nav__icon chami-home-nav__icon--support" aria-label="도움말">
                <HelpIcon />
              </Link>

              <div className="chami-profile-menu">
                <button
                  type="button"
                  onClick={() => setMenuOpen((open) => !open)}
                  className="chami-profile-menu__button"
                  aria-expanded={menuOpen}
                  aria-label={t("nav.menu")}
                >
                  <span className="chami-profile-menu__avatar">
                    <Image src={profileImage || "/mascot/mascot-idle.png"} alt="" width={42} height={42} unoptimized />
                  </span>
                  <span className="chami-profile-menu__name">{displayName}님</span>
                  <ChevronDownIcon />
                </button>

                {menuOpen && (
                  <>
                    <div className="chami-profile-menu__backdrop" onClick={() => setMenuOpen(false)} />
                    <div className="chami-profile-menu__panel">
                      <Link href="/settings" onClick={() => setMenuOpen(false)}>
                        {t("nav.settings")}
                      </Link>
                      <button type="button" onClick={handleLogout}>
                        {t("nav.logout")}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </>
          ) : (
            <>
              <button type="button" className="chami-home-nav__auth-button" onClick={() => openAuthModal("login")}>
                {t("nav.login")}
              </button>
              <button
                type="button"
                className="chami-home-nav__auth-button chami-home-nav__auth-button--solid"
                onClick={() => openAuthModal("signup")}
              >
                {t("nav.signup")}
              </button>
            </>
          )}
        </div>
      </div>

      <AuthModal
        open={authModalOpen}
        mode={authModalMode}
        next="/"
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthModalMode}
      />
    </header>
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
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function HelpIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.8 9a2.4 2.4 0 1 1 3.85 1.9c-.84.58-1.32 1.07-1.32 2.1" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
