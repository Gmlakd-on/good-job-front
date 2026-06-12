"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AuthModal from "@/components/auth/AuthModal";
import type { User } from "@supabase/supabase-js";

type AuthMode = "login" | "signup";
type MascotState = "idle" | "happy" | "sad";

interface Profile {
  email?: string | null;
  nickname: string | null;
  profileImage?: string | null;
}

interface DailyAffirmation {
  id: string | null;
  userId: string;
  date: string;
  text: string;
  completed: boolean;
  feedStartedAt: string | null;
  createdAt: string | null;
}

const DEFAULT_AFFIRMATION = "나는 지금의 나로도 충분해요.";
const QUOTE_TEXT = "지금 이 순간이\n당신이 가진 전부입니다.";
const QUOTE_AUTHOR = "에크하르트 톨레";

const NAV_ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/diaries", label: "일기장", icon: "journal" },
  { href: "/exchange", label: "교환일기", icon: "exchange" },
  { href: "/report", label: "감정 리포트", icon: "report" },
  { href: "/dex", label: "나의 도감", icon: "dex" },
] as const;

export default function HomePage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [dailyAffirmation, setDailyAffirmation] = useState<DailyAffirmation | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [affirmationDraft, setAffirmationDraft] = useState(DEFAULT_AFFIRMATION);
  const [affirmationEditing, setAffirmationEditing] = useState(false);
  const [affirmationSaving, setAffirmationSaving] = useState(false);
  const [affirmationError, setAffirmationError] = useState("");
  const [feedStarted, setFeedStarted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const [authNext, setAuthNext] = useState("/");

  const openAuthModal = useCallback((mode: AuthMode, next = "/") => {
    setAuthModalMode(mode);
    setAuthNext(next);
    setAuthModalOpen(true);
  }, []);

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setAuthChecked(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const displayNickname = useMemo(() => {
    const nickname = profile?.nickname?.trim();
    return nickname || null;
  }, [profile?.nickname]);

  const profileImage = useMemo(() => {
    const metadataAvatar = user?.user_metadata?.avatar_url;
    if (typeof metadataAvatar === "string" && metadataAvatar.trim()) return metadataAvatar;
    if (profile?.profileImage) return profile.profileImage;
    return null;
  }, [profile?.profileImage, user?.user_metadata]);

  const loadHomeData = useCallback(async () => {
    if (!user) return;

    setProfileLoading(true);
    try {
      const [profileResponse, affirmationResponse] = await Promise.all([
        fetch("/api/profile", { cache: "no-store" }),
        fetch("/api/daily-affirmation", { cache: "no-store" }),
      ]);

      if (profileResponse.ok) {
        const data = (await profileResponse.json()) as { profile?: Profile };
        const nextProfile = data.profile ?? { nickname: null };
        setProfile(nextProfile);
        const nickname = nextProfile.nickname?.trim() ?? "";
        if (!nickname) {
          setNicknameInput("");
          setNicknameModalOpen(true);
        }
      }

      if (affirmationResponse.ok) {
        const data = (await affirmationResponse.json()) as {
          dailyAffirmation?: DailyAffirmation;
          streakCount?: number;
        };
        if (data.dailyAffirmation) {
          setDailyAffirmation(data.dailyAffirmation);
          setAffirmationDraft(data.dailyAffirmation.text || DEFAULT_AFFIRMATION);
          setFeedStarted(Boolean(data.dailyAffirmation.feedStartedAt && !data.dailyAffirmation.completed));
        }
        setStreakCount(data.streakCount ?? 0);
      }
    } finally {
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      setProfile(null);
      setDailyAffirmation(null);
      setStreakCount(0);
      setFeedStarted(false);
      setAffirmationEditing(false);
      setNicknameModalOpen(false);
      return;
    }

    void loadHomeData();
  }, [authChecked, loadHomeData, user]);

  const isAffirmationCompleted = Boolean(dailyAffirmation?.completed);
  const hasStartedButNotCompleted = !isAffirmationCompleted && (feedStarted || Boolean(dailyAffirmation?.feedStartedAt));

  const mascotState: MascotState = isAffirmationCompleted
    ? "happy"
    : hasStartedButNotCompleted
      ? "sad"
      : "idle";

  const mascotImage =
    mascotState === "happy"
      ? "/mascot/mascot-happy.png"
      : mascotState === "sad"
        ? "/mascot/mascot-sad.png"
        : "/mascot/mascot-idle.png";

  const mascotMessage = isAffirmationCompleted
    ? "참이가 확언을 맛있게 먹었어요!"
    : "참이는 오늘의 긍정 확언을 기다리고 있어요.";

  const mascotHelper = isAffirmationCompleted
    ? "오늘 확언 완료"
    : hasStartedButNotCompleted
      ? "아직 오늘의 확언을 먹지 못했어요."
      : "확언을 먹이면 참이가 더 힘을 내요!";

  const currentAffirmationText = dailyAffirmation?.text || DEFAULT_AFFIRMATION;

  const guardAuth = useCallback(
    (next: string, mode: AuthMode = "login") => {
      if (!user) {
        openAuthModal(mode, next);
        return false;
      }
      return true;
    },
    [openAuthModal, user],
  );

  const goWrite = useCallback(() => {
    if (!guardAuth("/write", "signup")) return;
    router.push("/write");
  }, [guardAuth, router]);

  const goBooks = useCallback(() => {
    if (!guardAuth("/books")) return;
    router.push("/books");
  }, [guardAuth, router]);

  const startAffirmationFeed = useCallback(async () => {
    if (!guardAuth("/")) return;
    if (isAffirmationCompleted) return;

    setAffirmationError("");
    setFeedStarted(true);
    setAffirmationEditing(true);
    setAffirmationDraft(currentAffirmationText || DEFAULT_AFFIRMATION);

    try {
      const response = await fetch("/api/daily-affirmation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });

      if (response.ok) {
        const data = (await response.json()) as {
          dailyAffirmation?: DailyAffirmation;
          streakCount?: number;
        };
        if (data.dailyAffirmation) setDailyAffirmation(data.dailyAffirmation);
        if (typeof data.streakCount === "number") setStreakCount(data.streakCount);
      }
    } catch {
      setAffirmationError("입력 모드는 열었지만 서버 준비에 실패했어요. 다시 시도해주세요.");
    }
  }, [currentAffirmationText, guardAuth, isAffirmationCompleted]);

  const completeAffirmationFeed = useCallback(async () => {
    if (!guardAuth("/")) return;

    const text = affirmationDraft.trim();
    if (!text) {
      setAffirmationError("확언을 한 문장 이상 입력해주세요.");
      return;
    }

    setAffirmationSaving(true);
    setAffirmationError("");

    try {
      const response = await fetch("/api/daily-affirmation", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "complete", text }),
      });
      const data = (await response.json().catch(() => ({}))) as {
        dailyAffirmation?: DailyAffirmation;
        streakCount?: number;
        error?: string;
      };

      if (!response.ok) {
        setAffirmationError(data.error || "오늘의 확언 저장에 실패했어요.");
        return;
      }

      if (data.dailyAffirmation) {
        setDailyAffirmation(data.dailyAffirmation);
        setAffirmationDraft(data.dailyAffirmation.text);
      }
      if (typeof data.streakCount === "number") setStreakCount(data.streakCount);
      setAffirmationEditing(false);
      setFeedStarted(false);
    } catch {
      setAffirmationError("네트워크가 불안정해요. 잠시 후 다시 시도해주세요.");
    } finally {
      setAffirmationSaving(false);
    }
  }, [affirmationDraft, guardAuth]);

  const saveNickname = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const nickname = nicknameInput.trim();

      if (!nickname) {
        setNicknameError("닉네임은 필수 입력이에요.");
        return;
      }
      if (nickname.length < 2) {
        setNicknameError("닉네임은 2자 이상으로 입력해주세요.");
        return;
      }
      if (nickname.length > 10) {
        setNicknameError("닉네임은 10자 이내로 입력해주세요.");
        return;
      }

      setNicknameSaving(true);
      setNicknameError("");

      try {
        const response = await fetch("/api/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nickname }),
        });
        const data = (await response.json().catch(() => ({}))) as { profile?: Profile; error?: string };

        if (!response.ok) {
          setNicknameError(data.error || "닉네임 저장에 실패했어요.");
          return;
        }

        setProfile((prev) => ({ ...(prev ?? {}), ...(data.profile ?? {}), nickname }));
        setNicknameModalOpen(false);
      } catch {
        setNicknameError("네트워크가 불안정해요. 잠시 후 다시 시도해주세요.");
      } finally {
        setNicknameSaving(false);
      }
    },
    [nicknameInput],
  );

  const handleLogout = useCallback(async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setProfileMenuOpen(false);
    router.refresh();
  }, [router]);

  return (
    <div className="chami-home">
      <header className="chami-home-nav" aria-label="홈 상단 메뉴">
        <div className="chami-home-nav__inner">
          <Link href="/" className="chami-home-nav__logo" aria-label="참 잘했어요 홈">
            참 잘했어요
          </Link>

          <nav className="chami-home-nav__links" aria-label="주요 메뉴">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`chami-home-nav__link ${pathname === item.href ? "chami-home-nav__link--active" : ""}`}
              >
                <NavIcon type={item.icon} />
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          <div className="chami-home-nav__actions">
            {authChecked && user ? (
              <>
                <Link href="/notifications" className="chami-home-nav__icon" aria-label="알림">
                  <BellIcon />
                </Link>
                <Link href="/support" className="chami-home-nav__icon" aria-label="도움말">
                  <HelpIcon />
                </Link>
                <div className="chami-profile-menu">
                  <button
                    type="button"
                    className="chami-profile-menu__button"
                    onClick={() => setProfileMenuOpen((open) => !open)}
                    aria-expanded={profileMenuOpen}
                    aria-label="프로필 메뉴 열기"
                  >
                    <span className="chami-profile-menu__avatar">
                      {profileImage ? (
                        <img src={profileImage} alt="" />
                      ) : (
                        <img src="/mascot/mascot-idle.png" alt="" />
                      )}
                    </span>
                    <span className="chami-profile-menu__name">
                      {profileLoading ? "불러오는 중" : `${displayNickname ?? "이름 설정"}님`}
                    </span>
                    <ChevronDownIcon />
                  </button>
                  {profileMenuOpen && (
                    <div className="chami-profile-menu__panel">
                      <Link href="/settings" onClick={() => setProfileMenuOpen(false)}>
                        마이페이지
                      </Link>
                      <Link href="/books" onClick={() => setProfileMenuOpen(false)}>
                        내 책장
                      </Link>
                      <button type="button" onClick={handleLogout}>
                        로그아웃
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : authChecked ? (
              <>
                <button type="button" className="chami-home-nav__auth chami-home-nav__auth--ghost" onClick={() => openAuthModal("login", "/")}>로그인</button>
                <button type="button" className="chami-home-nav__auth chami-home-nav__auth--solid" onClick={() => openAuthModal("signup", "/")}>시작하기</button>
              </>
            ) : null}
          </div>
        </div>
      </header>

      <main className="chami-home-main">
        <section className="chami-home-grid" aria-label="오늘의 홈 대시보드">
          <article className="chami-note-card chami-card">
            <div className="chami-note-card__label">
              <span aria-hidden="true">❝</span>
              <strong>오늘의 명언</strong>
              <span aria-hidden="true">❞</span>
            </div>
            <blockquote className="chami-note-card__quote">
              {QUOTE_TEXT.split("\n").map((line) => (
                <span key={line}>{line}</span>
              ))}
            </blockquote>
            <p className="chami-note-card__author">- {QUOTE_AUTHOR}</p>

            <div className={`chami-affirmation-box ${affirmationEditing ? "chami-affirmation-box--editing" : ""}`}>
              <span className="chami-affirmation-box__heart" aria-hidden="true">💗</span>
              <div className="chami-affirmation-box__content">
                <p className="chami-affirmation-box__eyebrow">오늘의 확언</p>
                {affirmationEditing && !isAffirmationCompleted ? (
                  <div className="chami-affirmation-editor">
                    <textarea
                      value={affirmationDraft}
                      onChange={(event) => setAffirmationDraft(event.target.value)}
                      placeholder={DEFAULT_AFFIRMATION}
                      maxLength={120}
                      aria-label="오늘의 확언 입력"
                    />
                    <button
                      type="button"
                      className="chami-spoon-button"
                      onClick={completeAffirmationFeed}
                      disabled={affirmationSaving}
                    >
                      <span aria-hidden="true">🥄</span>
                      {affirmationSaving ? "먹이는 중" : "참이에게 주기"}
                    </button>
                  </div>
                ) : (
                  <p className="chami-affirmation-box__text">{currentAffirmationText}</p>
                )}
                {affirmationError && <p className="chami-form-error">{affirmationError}</p>}
              </div>
            </div>

            <div className="chami-note-card__buttons">
              <button type="button" className="chami-button chami-button--coral" onClick={goWrite}>
                <span aria-hidden="true">✎</span>
                오늘 일기 쓰기
              </button>
              <button type="button" className="chami-button chami-button--ghost" onClick={goBooks}>
                <span aria-hidden="true">📖</span>
                내 책장 보기
              </button>
            </div>
          </article>

          <article className={`chami-mascot-card chami-card chami-mascot-card--${mascotState}`}>
            <div className="chami-mascot-card__copy">
              <p>{mascotMessage}</p>
              <span className="chami-streak-pill">🔥 연속 {streakCount}일째</span>
            </div>
            <div className="chami-mascot-stage" aria-hidden="true">
              <span className="chami-sparkle chami-sparkle--left">✦</span>
              <span className="chami-sparkle chami-sparkle--right">✧</span>
              <img src={mascotImage} alt="" className="chami-mascot-stage__image" />
            </div>
            <button
              type="button"
              className="chami-feed-button"
              onClick={startAffirmationFeed}
              disabled={isAffirmationCompleted}
            >
              <span aria-hidden="true">🍃</span>
              {isAffirmationCompleted ? "오늘 확언 완료" : "확언 먹이 주기"}
            </button>
            <p className="chami-mascot-card__helper">{mascotHelper}</p>
          </article>
        </section>

        <section className="chami-lower-grid" aria-label="홈 하단 바로가기">
          <article className="chami-mini-card chami-card chami-mini-card--exchange">
            <div className="chami-mini-card__visual" aria-hidden="true">💌</div>
            <div>
              <h2>교환일기</h2>
              <p className="chami-mini-card__strong">{displayNickname ?? "친구"}님과 12일째</p>
              <p>매일의 기록이, 우리의 관계까지 만들어 줍니다.</p>
            </div>
            <button type="button" onClick={() => (guardAuth("/exchange") ? router.push("/exchange") : undefined)}>
              교환일기 쓰기 <span aria-hidden="true">›</span>
            </button>
          </article>

          <article className="chami-mini-card chami-card">
            <div className="chami-mini-card__visual" aria-hidden="true">🍃</div>
            <div>
              <h2>환기 카드</h2>
              <p>오늘의 감정에 맞는 작은 추천이 도착했어요.</p>
            </div>
            <button type="button" onClick={() => (guardAuth("/report") ? router.push("/report") : undefined)}>
              열어보기 <span aria-hidden="true">›</span>
            </button>
          </article>

          <article className="chami-ad-card chami-card">
            <div className="chami-ad-card__label">
              <span>광고 · 오늘의 추천</span>
              <em>AD</em>
            </div>
            <div className="chami-ad-card__body">
              <div className="chami-ad-card__image" aria-hidden="true">🌼<br />🫖</div>
              <div>
                <h2>나를 안아주는 시간, 한 잔의 위로</h2>
                <p>따뜻한 문장과 향긋한 차 한 잔으로 오늘의 나를 돌보세요.</p>
                <button type="button">자세히 보기 <span aria-hidden="true">›</span></button>
              </div>
            </div>
          </article>
        </section>

        <section className="chami-habit-bar chami-card" aria-label="기록 습관">
          <span aria-hidden="true">🗓️</span>
          <p>매일의 작은 기록이 쌓여, 더 단단한 나를 만듭니다.</p>
          <button type="button" onClick={() => (guardAuth("/report") ? router.push("/report") : undefined)}>
            나의 기록 습관 보기 <span aria-hidden="true">›</span>
          </button>
        </section>
      </main>

      {nicknameModalOpen && user && (
        <div className="nickname-modal" role="dialog" aria-modal="true" aria-labelledby="nickname-modal-title">
          <form className="nickname-modal__card" onSubmit={saveNickname}>
            <div className="nickname-modal__mascot" aria-hidden="true">
              <img src="/mascot/mascot-idle.png" alt="" />
            </div>
            <h2 id="nickname-modal-title">닉네임을 설정해주세요</h2>
            <p>
              참잘했어요에서 사용할 이름을 알려주세요.<br />
              나중에 마이페이지에서 변경할 수 있어요.
            </p>
            <input
              value={nicknameInput}
              onChange={(event) => setNicknameInput(event.target.value)}
              placeholder="예: 지은"
              maxLength={10}
              autoFocus
            />
            <p className="nickname-modal__hint">공백 없이 2자 이상, 10자 이내로 입력해주세요.</p>
            {nicknameError && <p className="chami-form-error">{nicknameError}</p>}
            <button type="submit" disabled={nicknameSaving}>
              {nicknameSaving ? "저장 중" : "시작하기"}
            </button>
          </form>
        </div>
      )}

      <AuthModal
        open={authModalOpen}
        mode={authModalMode}
        next={authNext}
        onClose={() => setAuthModalOpen(false)}
        onModeChange={setAuthModalMode}
      />
    </div>
  );
}

function NavIcon({ type }: { type: (typeof NAV_ITEMS)[number]["icon"] }) {
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
