"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import MascotHero from "@/components/home/MascotHero";
import TryItDemo from "@/components/home/TryItDemo";
import AuthModal from "@/components/auth/AuthModal";
import type { User } from "@supabase/supabase-js";

interface Quote {
  id: string;
  quote_text: string;
  author: string;
  quote_text_ko?: string | null;
  quote_text_en?: string | null;
  author_ko?: string | null;
  author_en?: string | null;
  language?: "ko" | "en";
}

type AuthMode = "login" | "signup";

type LanguageOption = "ko" | "en";

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

const AFFIRMATION_SUGGESTIONS = [
  "나는 내 모습 그대로 충분히 가치 있는 사람이다.",
  "나는 내 인생을 스스로 선택하고 책임질 힘이 있다.",
  "오늘의 나는 어제보다 더 성장하고 단단해졌다.",
  "나는 나를 사랑하며, 나에게 친절하게 대한다.",
  "나의 잠재력은 무한하며, 나는 무엇이든 해낼 수 있다.",
  "나는 떨리지만, 도전을 즐긴다.",
  "나의 노력은 매일 조금씩 긍정적 결실을 맺고 있다.",
  "나는 집중하고 몰입하며, 내가 원하는 목표에 다가가고 있다.",
  "나는 문제를 해결할 충분한 지혜와 능력을 갖추고 있다.",
  "나는 나만의 속도로 묵묵히 나의 길을 걷고 있다.",
  "나는 지금 이 순간, 충분히 평온하고 안전하다.",
  "나는 부정적인 생각을 흘려보내고 긍정적인 에너지로 나를 채운다.",
  "오늘 하루 내게 일어나는 모든 일은 나를 좋은 방향으로 이끈다.",
  "나는 내 감정을 소중히 여기며, 그것을 건강하게 표현한다.",
  "마음의 짐을 내려놓고, 가벼운 마음으로 오늘을 맞이한다.",
  "나는 내 삶에 이미 존재하는 수많은 감사함에 집중한다.",
  "나는 사랑스러운 존재이다.",
  "좋은 일들이 자연스럽게 내 삶 속으로 흘러들어온다.",
  "나는 매일 새로운 가능성을 마주하는 행운을 누린다.",
  "나는 나의 현재와 미래를 깊이 신뢰한다.",
] as const;

const getRandomAffirmationSuggestion = () =>
  AFFIRMATION_SUGGESTIONS[Math.floor(Math.random() * AFFIRMATION_SUGGESTIONS.length)];

const DASHBOARD_QUOTE_TEXT = "지금 이 순간이\n당신이 가진 전부입니다.";
const DASHBOARD_QUOTE_AUTHOR = "에크하르트 톨레";

const DASHBOARD_NAV_ITEMS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/diaries", label: "일기장", icon: "journal" },
  { href: "/exchange", label: "교환일기", icon: "exchange" },
  { href: "/report", label: "감정 리포트", icon: "report" },
  { href: "/dex", label: "나의 도감", icon: "dex" },
] as const;

const LANGUAGE_OPTIONS: { value: LanguageOption; label: string }[] = [
  { value: "ko", label: "KO" },
  { value: "en", label: "EN" },
];

const KNOWN_QUOTE_TRANSLATIONS: Record<string, { quote: string; author: string }> = {
  "오늘 하루도 수고했어요.": {
    quote: "You did well today, too.",
    author: "Cham Jalhaesseoyo",
  },
  "오늘의 책임을 피함으로써 내일의 책임을 피할 수는 없다.": {
    quote: "You cannot escape the responsibility of tomorrow by evading it today.",
    author: "Abraham Lincoln",
  },
  "당신이 할 수 있다고 믿든, 할 수 없다고 믿든, 당신은 옳다.": {
    quote: "Whether you think you can, or you think you cannot, you are right.",
    author: "Henry Ford",
  },
  "시작이 반이다.": {
    quote: "Well begun is half done.",
    author: "Aristotle",
  },
  "오늘 하루를 잘 살아낸 것만으로도 충분히 잘 한 거예요.": {
    quote: "Simply making it through today is already enough.",
    author: "Cham Jalhaesseoyo",
  },
  "작은 일을 하면서도 최선을 다하는 것이 위대한 일을 이루는 비결이다.": {
    quote: "The secret of achieving great things is to do small things with great care.",
    author: "Albert Schweitzer",
  },
  "천 리 길도 한 걸음부터.": {
    quote: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu",
  },
  "지금 이 순간이 당신이 가진 전부입니다.": {
    quote: "The present moment is all you ever have.",
    author: "Eckhart Tolle",
  },
  "실수를 두려워하지 말라. 실수는 배움의 어머니다.": {
    quote: "Do not fear mistakes. Mistakes are the mother of learning.",
    author: "Thomas Edison",
  },
};

export default function HomePage() {
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const [navHidden, setNavHidden] = useState(false);
  const [authNext, setAuthNext] = useState("/books");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [dailyAffirmation, setDailyAffirmation] = useState<DailyAffirmation | null>(null);
  const [streakCount, setStreakCount] = useState(0);
  const [affirmationDraft, setAffirmationDraft] = useState("");
  const [affirmationSuggestion, setAffirmationSuggestion] = useState<string>(AFFIRMATION_SUGGESTIONS[0]);
  const [affirmationEditing, setAffirmationEditing] = useState(false);
  const [affirmationSaving, setAffirmationSaving] = useState(false);
  const [affirmationError, setAffirmationError] = useState("");
  const [feedStarted, setFeedStarted] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

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

  useEffect(() => {
    setAffirmationSuggestion(getRandomAffirmationSuggestion());
  }, []);

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

  useEffect(() => {
    fetch(`/api/quotes?language=${language}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setQuote(data.quote))
      .catch(() =>
        setQuote({
          id: "default",
          quote_text: t("home.quoteDefault"),
          author: t("home.quoteDefaultAuthor"),
          language,
        }),
      );
  }, [language, t]);

  const openAuthModal = useCallback((mode: AuthMode, next = "/books") => {
    setAuthModalMode(mode);
    setAuthNext(next);
    setAuthModalOpen(true);
  }, []);

  const enterBooks = useCallback(() => {
    if (user) {
      router.push("/books");
      return;
    }

    openAuthModal("login", "/books");
  }, [openAuthModal, router, user]);

  const enterWrite = useCallback(() => {
    if (user) {
      router.push("/write");
      return;
    }

    openAuthModal("signup", "/write");
  }, [openAuthModal, router, user]);

  const localizedQuote = useMemo(() => {
    if (!quote) {
      return {
        text: t("home.quoteLoading"),
        author: t("home.quoteDefaultAuthor"),
      };
    }

    if (language === "en") {
      const translated = quote.quote_text_en?.trim()
        ? { quote: quote.quote_text_en.trim(), author: quote.author_en?.trim() || quote.author.trim() }
        : KNOWN_QUOTE_TRANSLATIONS[quote.quote_text.trim()];

      if (translated) {
        return {
          text: translated.quote,
          author: translated.author,
        };
      }
    }

    return {
      text: quote.quote_text_ko?.trim() || quote.quote_text.trim() || t("home.quoteDefault"),
      author: quote.author_ko?.trim() || quote.author?.trim() || t("home.quoteDefaultAuthor"),
    };
  }, [language, quote, t]);

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

  const loadDashboardData = useCallback(async () => {
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
          setAffirmationDraft(data.dailyAffirmation.completed ? data.dailyAffirmation.text : "");
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

    void loadDashboardData();
  }, [authChecked, loadDashboardData, user]);

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
    ? "참이가 긍정을 먹었어요!"
    : "참이는 오늘의 긍정 확언을 기다리고 있어요.";

  const mascotHelper = isAffirmationCompleted
    ? "오늘 확언 완료"
    : hasStartedButNotCompleted
      ? "아직 오늘의 확언을 먹지 못했어요."
      : "확언을 먹이면 참이가 더 힘을 내요!";

  const currentAffirmationText = isAffirmationCompleted ? dailyAffirmation?.text?.trim() ?? "" : "";

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
    setAffirmationSuggestion(getRandomAffirmationSuggestion());
    setAffirmationDraft("");

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
  }, [guardAuth, isAffirmationCompleted]);

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

  const quoteText = `“${localizedQuote.text}”`;
  const quoteAuthor = localizedQuote.author;

  if (authChecked && user) {
    return (
      <div className="chami-home">
        <header className="chami-home-nav" aria-label="홈 상단 메뉴">
          <div className="chami-home-nav__inner">
            <Link href="/" className="chami-home-nav__logo" aria-label="참 잘했어요 홈">
              참 잘했어요
            </Link>

            <nav className="chami-home-nav__links" aria-label="주요 메뉴">
              {DASHBOARD_NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`chami-home-nav__link ${pathname === item.href ? "chami-home-nav__link--active" : ""}`}
                >
                  <DashboardNavIcon type={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="chami-home-nav__actions">
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
                    <Image src={profileImage || "/mascot/mascot-idle.png"} alt="" width={40} height={40} unoptimized />
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
                {DASHBOARD_QUOTE_TEXT.split("\n").map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </blockquote>
              <p className="chami-note-card__author">- {DASHBOARD_QUOTE_AUTHOR}</p>

              <div className={`chami-affirmation-box ${affirmationEditing ? "chami-affirmation-box--editing" : ""}`}>
                <span className="chami-affirmation-box__heart" aria-hidden="true">💗</span>
                <div className="chami-affirmation-box__content">
                  <p className="chami-affirmation-box__eyebrow">오늘의 확언</p>
                  {affirmationEditing && !isAffirmationCompleted ? (
                    <div className="chami-affirmation-editor">
                      <textarea
                        value={affirmationDraft}
                        onChange={(event) => setAffirmationDraft(event.target.value)}
                        placeholder={affirmationSuggestion}
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
                  ) : isAffirmationCompleted ? (
                    <p className="chami-affirmation-box__text">{currentAffirmationText}</p>
                  ) : (
                    <div className="chami-affirmation-box__empty">
                      <p>확언 먹이 주기를 누르고, 오늘의 긍정확언을 직접 적어주세요.</p>
                      <span>입력창에는 랜덤 예시가 힌트로 보여요.</span>
                    </div>
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
                <Image src={mascotImage} alt="" width={360} height={360} className="chami-mascot-stage__image" priority />
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

            <article className="chami-mini-card chami-card chami-mini-card--refresh">
              <div className="chami-mini-card__visual" aria-hidden="true">🍃</div>
              <div>
                <h2>환기 카드</h2>
                <p>오늘의 감정에 맞는 작은 추천이 도착했어요.</p>
              </div>
              <button type="button" onClick={() => (guardAuth("/report") ? router.push("/report") : undefined)}>
                열어보기 <span aria-hidden="true">›</span>
              </button>
            </article>

            <article className="chami-mini-card chami-card chami-mini-card--report">
              <div className="chami-mini-card__visual" aria-hidden="true">🧭</div>
              <div>
                <h2>감정 리포트</h2>
                <p>이번 주 마음의 흐름을 조용히 돌아봐요.</p>
              </div>
              <button type="button" onClick={() => (guardAuth("/report") ? router.push("/report") : undefined)}>
                보러가기 <span aria-hidden="true">›</span>
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

        </main>

        {nicknameModalOpen && (
          <div className="nickname-modal" role="dialog" aria-modal="true" aria-labelledby="nickname-modal-title">
            <form className="nickname-modal__card" onSubmit={saveNickname}>
              <div className="nickname-modal__mascot" aria-hidden="true">
                <Image src="/mascot/mascot-idle.png" alt="" width={96} height={96} />
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

  return (
    <div className="home-shell">
      <header className={`home-nav ${navHidden ? "home-nav--hidden" : ""}`}>
        <div className="home-nav__inner main-container">
          <Link href="/" className="home-nav__logo" aria-label={t("home.logoAria")}>
            참 잘했어요
          </Link>

          <div className="home-nav__right">
            <div className="home-nav__language" aria-label={t("home.languageToggle")} role="group">
              {LANGUAGE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={`home-nav__lang-button ${language === option.value ? "home-nav__lang-button--active" : ""}`}
                  aria-pressed={language === option.value}
                  onClick={() => void setLanguage(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {authChecked && (
              <div className="home-nav__actions">
                {!user ? (
                  <>
                    <button
                      type="button"
                      className="home-nav__button home-nav__button--ghost"
                      onClick={() => openAuthModal("login", "/books")}
                    >
                      {t("home.login")}
                    </button>
                    <button
                      type="button"
                      className="home-nav__button home-nav__button--solid"
                      onClick={() => openAuthModal("signup", "/books")}
                    >
                      {t("home.signup")}
                    </button>
                  </>
                ) : (
                  <Link href="/books" className="home-nav__button home-nav__button--solid">
                    {t("home.myShelf")}
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      <main>
        <section className="home-hero" aria-label={t("home.quoteLabel")}>
          <div className="main-container home-hero__inner hero-inner">
            <div className="home-hero__quote-zone">
              <figure
                className="home-quote-card hero-quote-card"
                tabIndex={0}
                aria-label={`${t("home.quoteLabel")}. ${quoteText} — ${quoteAuthor}`}
              >
                <blockquote className="home-quote-card__quote">
                  <p className="home-quote-card__text hero-quote">{quoteText}</p>
                </blockquote>
                <figcaption className="home-quote-card__author">— {quoteAuthor}</figcaption>
                <div className="home-quote-card__meta hero-label" aria-hidden="true">
                  <span>{t("home.quoteLabel")}</span>
                </div>
              </figure>

              <div className="home-hero__ctas" aria-label={t("home.quickNav")}>
                <button type="button" className="home-hero__cta home-hero__cta--primary primary-button" onClick={enterWrite}>
                  {t("home.ctaWrite")}
                </button>
                <button type="button" className="home-hero__cta home-hero__cta--secondary secondary-button" onClick={enterBooks}>
                  {t("home.ctaShelf")}
                </button>
              </div>
            </div>

            <div className="home-hero__mascot-zone">
              <div className="home-hero__glow" aria-hidden="true" />
              <MascotHero />
            </div>
          </div>
        </section>

        {authChecked && !user && <TryItDemo />}

        <section className="home-feature-section section" aria-label={t("home.featuresAria")}>
          <div className="main-container home-feature-grid feature-grid">
            <FeatureCard
              icon="📮"
              title={t("home.feat.xch.title")}
              description={t("home.feat.xch.desc")}
              badges={[t("home.feat.xch.b1"), t("home.feat.xch.b2")]}
              onClick={() => user ? router.push("/exchange") : openAuthModal("login", "/exchange")}
            />
            <FeatureCard
              icon="📔"
              title={t("home.feat.books.title")}
              description={t("home.feat.books.desc")}
              badges={[t("home.feat.books.b1"), t("home.feat.books.b2")]}
              onClick={enterBooks}
            />
            <FeatureCard
              icon="🧭"
              title={t("home.feat.report.title")}
              description={t("home.feat.report.desc")}
              badges={[t("home.feat.report.b1"), t("home.feat.report.b2")]}
              onClick={() => user ? router.push("/report") : openAuthModal("login", "/report")}
            />
            <FeatureCard
              icon="📒"
              title={t("home.feat.dex.title")}
              description={t("home.feat.dex.desc")}
              badges={[t("home.feat.dex.b1"), t("home.feat.dex.b2")]}
              onClick={() => router.push("/dex")}
            />
          </div>
        </section>
      </main>
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

function FeatureCard({
  icon,
  title,
  description,
  badges,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  badges: string[];
  onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick} className="home-feature-card feature-card">
      <div className="home-feature-card__top">
        <span className="home-feature-card__icon">{icon}</span>
        <span className="home-feature-card__arrow">→</span>
      </div>
      <h3 className="home-feature-card__title feature-card-title">{title}</h3>
      <p className="home-feature-card__description feature-card-description">{description}</p>
      <div className="home-feature-card__badges">
        {badges.map((badge) => (
          <span key={badge} className="home-feature-card__badge">
            {badge}
          </span>
        ))}
      </div>
    </button>
  );
}

function DashboardNavIcon({ type }: { type: (typeof DASHBOARD_NAV_ITEMS)[number]["icon"] }) {
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

