"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { apiGetJson, invalidateApiCache } from "@/lib/apiCache";
import { EMOTIONS } from "@/types";
import MascotHero from "@/components/home/MascotHero";
import ChamiCareWidgetFrame from "@/components/character/ChamiCareWidgetFrame";
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

interface Profile {
  email?: string | null;
  nickname: string | null;
  profileImage?: string | null;
}

interface HomeDiaryRow {
  id: string;
  content?: string | null;
  title?: string | null;
  created_at: string;
  diary_emotions?: { emotion_code?: string | null; emotion_label?: string | null }[];
}

interface HomeDiariesResponse {
  diaries?: HomeDiaryRow[];
}

const SOFT_EMOTION_SCORES: Record<string, number> = {
  joy: 4.6,
  happiness: 4.8,
  calm: 4.2,
  gratitude: 4.4,
  excitement: 4.5,
  pride: 4.7,
  hope: 4.3,
  love: 4.8,
  satisfaction: 4.4,
  comfort: 4.1,
  sadness: 2.1,
  anxiety: 1.8,
  loneliness: 2.0,
  lethargy: 1.9,
  exhaustion: 1.7,
  anger: 2.0,
  irritation: 2.2,
  frustration: 2.0,
  regret: 2.1,
  fear: 1.8,
};

const formatShortDate = (value: string) => {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "오늘";
  }

  return `${date.getMonth() + 1}.${String(date.getDate()).padStart(2, "0")}`;
};

const getDiaryTitle = (diary: HomeDiaryRow) => {
  const raw = (diary.title || diary.content || "").replace(/\s+/g, " ").trim();

  if (!raw) {
    return "제목 없는 하루 기록";
  }

  return raw.length > 28 ? `${raw.slice(0, 28)}…` : raw;
};

const getEmotionMeta = (code?: string | null) =>
  EMOTIONS.find((emotion) => emotion.code === code) ?? { code: "calm", label: "평온", emoji: "🍃" };

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
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
  const [navHidden, setNavHidden] = useState(false);
  const [showScrollCue, setShowScrollCue] = useState(true);
  const [authNext, setAuthNext] = useState("/");
  const [nicknameModalOpen, setNicknameModalOpen] = useState(false);
  const [nicknameInput, setNicknameInput] = useState("");
  const [nicknameError, setNicknameError] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [dashboardProfile, setDashboardProfile] = useState<Profile | null>(null);
  const [homeDiaries, setHomeDiaries] = useState<HomeDiaryRow[]>([]);

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
    let lastY = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;

      if (currentY > 8) {
        setShowScrollCue(false);
      }

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
    // 오늘의 명언은 날짜가 바뀌면 즉시 새로 받아야 하므로
    // 브라우저/메모리 캐시에 남은 어제 응답을 재사용하지 않는다.
    apiGetJson<{ quote: Quote }>(`/api/quotes?language=${language}`, {
      ttlMs: 0,
      forceRefresh: true,
      cache: "no-store",
    })
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

  const openAuthModal = useCallback((mode: AuthMode, next = "/") => {
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

  const scrollToPreview = useCallback(() => {
    setShowScrollCue(false);
    window.scrollTo({
      top: Math.max(window.innerHeight * 0.86, 520),
      behavior: "smooth",
    });
  }, []);

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

  const loadDashboardData = useCallback(async () => {
    if (!user) return;

    try {
      const [profileResponse, diariesResponse] = await Promise.all([
        apiGetJson<{ profile?: Profile }>("/api/profile", { ttlMs: 30_000 }),
        fetch("/api/diaries", { cache: "no-store" })
          .then(async (response): Promise<HomeDiariesResponse> => {
            if (!response.ok) {
              return { diaries: [] };
            }

            return response.json();
          })
          .catch(() => ({ diaries: [] })),
      ]);

      const nextProfile = profileResponse.profile ?? { nickname: null };
      setDashboardProfile(nextProfile);
      setHomeDiaries(diariesResponse.diaries ?? []);
      const nickname = nextProfile.nickname?.trim() ?? "";
      if (!nickname) {
        setNicknameInput("");
        setNicknameModalOpen(true);
      }

    } catch {
      setDashboardProfile(null);
      setHomeDiaries([]);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      setDashboardProfile(null);
      setHomeDiaries([]);
      setNicknameModalOpen(false);
      return;
    }

    void loadDashboardData();
  }, [authChecked, loadDashboardData, user]);

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

        invalidateApiCache("/api/profile");
        setDashboardProfile(data.profile ?? { nickname });
        setNicknameModalOpen(false);
      } catch {
        setNicknameError("네트워크가 불안정해요. 잠시 후 다시 시도해주세요.");
      } finally {
        setNicknameSaving(false);
      }
    },
    [nicknameInput],
  );

  const quoteText = `“${localizedQuote.text}”`;
  const quoteAuthor = localizedQuote.author;
  const dashboardQuoteLines = quoteText.split(/\r?\n/);
  const displayName =
    dashboardProfile?.nickname?.trim() ||
    user?.user_metadata?.nickname?.trim?.() ||
    user?.user_metadata?.name?.trim?.() ||
    user?.email?.split("@")[0] ||
    "seori";

  const recentDiaries = useMemo(() =>
    [...homeDiaries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3),
  [homeDiaries]);

  const emotionTrend = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(now);
      date.setDate(now.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);
      const diariesForDay = homeDiaries.filter((diary) => {
        const diaryDate = new Date(diary.created_at);
        return !Number.isNaN(diaryDate.getTime()) && diaryDate.toISOString().slice(0, 10) === key;
      });
      const codes = diariesForDay.flatMap((diary) =>
        diary.diary_emotions?.map((emotion) => emotion.emotion_code).filter(Boolean) ?? [],
      ) as string[];
      const primaryCode = codes[0] ?? null;
      const score = codes.length
        ? codes.reduce((sum, code) => sum + (SOFT_EMOTION_SCORES[code] ?? 3), 0) / codes.length
        : 3;
      const y = 92 - ((score - 1) / 4) * 78;

      return {
        key,
        label: index === 6 ? "오늘" : `${date.getMonth() + 1}/${date.getDate()}`,
        x: 8 + index * 14,
        y,
        emotion: getEmotionMeta(primaryCode),
        hasData: codes.length > 0,
      };
    });
  }, [homeDiaries]);

  const trendPolyline = emotionTrend.map((point) => `${point.x},${point.y}`).join(" ");
  const latestEmotion = recentDiaries[0]?.diary_emotions?.[0]?.emotion_code;
  const latestEmotionMeta = getEmotionMeta(latestEmotion);
  const latestTrendMessage = homeDiaries.length
    ? `최근 감정이 ${latestEmotionMeta.label} 쪽으로 기록되고 있어요. 🌿 지금 이 마음을 잘 기억해두어요.`
    : "일기를 쓰면 최근 7일간의 감정 흐름이 이곳에 차분히 쌓여요.";

  if (authChecked && user) {
    return (
      <div className="chami-dashboard-page">
        <main className="chami-dashboard-layout">
          <section className="chami-dashboard-left" aria-label="홈 콘텐츠">
            <article className="chami-hero-card">
              <div className="chami-hero-card__copy">
                <p className="chami-hero-greeting">
                  안녕, <span>{displayName}</span>님! <span aria-hidden="true">👋</span>
                </p>
                <h1 className="chami-hero-title">오늘 하루는 어땠나요?</h1>
                <p className="chami-hero-desc">마음속 이야기를 들려주세요.</p>

                <div className="chami-hero-buttons" aria-label="홈 주요 행동">
                  <button type="button" className="chami-primary-button" onClick={goWrite}>
                    <span aria-hidden="true">✎</span>
                    오늘 일기 쓰기
                  </button>
                  <button type="button" className="chami-secondary-button" onClick={goBooks}>
                    <span aria-hidden="true">📖</span>
                    내 책장 보기
                  </button>
                </div>
              </div>

              <div className="chami-hero-window" aria-hidden="true">
                <span className="chami-hero-window__sun" />
                <span className="chami-hero-window__curtain" />
                <span className="chami-hero-window__plant" />
                <span className="chami-hero-window__cup" />
              </div>

              <figure className="chami-quote-card" aria-label="오늘의 명언">
                <figcaption className="chami-quote-card__label">
                  <span aria-hidden="true">“</span>
                  오늘의 명언
                </figcaption>
                <blockquote>
                  {dashboardQuoteLines.map((line, index) => (
                    <span key={`${line}-${index}`}>{line}</span>
                  ))}
                </blockquote>
                <p>— {quoteAuthor}</p>
              </figure>
            </article>

            <section className="chami-home-bottom-grid" aria-label="최근 기록과 감정 흐름">
              <article className="chami-dashboard-card chami-recent-card">
                <div className="chami-card-heading">
                  <h2><span aria-hidden="true">💚</span> 최근 일기</h2>
                  <button type="button" onClick={goBooks}>전체 보기 <span aria-hidden="true">›</span></button>
                </div>

                <div className="chami-recent-list">
                  {recentDiaries.length ? (
                    recentDiaries.map((diary) => {
                      const emotion = getEmotionMeta(diary.diary_emotions?.[0]?.emotion_code);

                      return (
                        <button
                          type="button"
                          key={diary.id}
                          className="chami-recent-item"
                          onClick={() => router.push(`/diary/${diary.id}`)}
                        >
                          <span className="chami-recent-item__emoji" aria-hidden="true">{emotion.emoji}</span>
                          <span className="chami-recent-item__copy">
                            <strong>{getDiaryTitle(diary)}</strong>
                            <small>{formatShortDate(diary.created_at)}</small>
                          </span>
                          <span className="chami-recent-item__arrow" aria-hidden="true">›</span>
                        </button>
                      );
                    })
                  ) : (
                    <div className="chami-empty-card">
                      <span aria-hidden="true">🌱</span>
                      <p>아직 작성한 일기가 없어요.</p>
                      <button type="button" onClick={goWrite}>첫 일기 쓰기</button>
                    </div>
                  )}
                </div>
              </article>

              <article className="chami-dashboard-card chami-emotion-card">
                <div className="chami-card-heading">
                  <h2><span aria-hidden="true">🪄</span> 감정 흐름</h2>
                  <button type="button" onClick={() => router.push("/report")}>더보기 <span aria-hidden="true">›</span></button>
                </div>

                <div className="chami-emotion-chart" aria-label="최근 7일간의 감정 추이 그래프">
                  <div className="chami-emotion-chart__axis" aria-hidden="true">
                    <span>😊</span>
                    <span>🙂</span>
                    <span>🥲</span>
                  </div>
                  <svg viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="최근 7일 감정 흐름">
                    <defs>
                      <linearGradient id="chamiTrendGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ff7c67" />
                        <stop offset="100%" stopColor="#ffb15e" />
                      </linearGradient>
                    </defs>
                    <polyline points={trendPolyline} fill="none" stroke="url(#chamiTrendGradient)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
                    {emotionTrend.map((point) => (
                      <circle key={point.key} cx={point.x} cy={point.y} r={point.hasData ? 3.2 : 2.4} className={point.hasData ? "is-filled" : ""} />
                    ))}
                  </svg>
                  <div className="chami-emotion-chart__labels" aria-hidden="true">
                    {emotionTrend.map((point) => (
                      <span key={point.key}>{point.label}</span>
                    ))}
                  </div>
                </div>

                <div className="chami-emotion-feedback">
                  <span aria-hidden="true">🌸</span>
                  <p>{latestTrendMessage}</p>
                </div>
              </article>
            </section>
          </section>

          <aside className="chami-pet-widget" aria-label="참이 케어 위젯">
            <ChamiCareWidgetFrame className="chami-pet-widget__frame" />
          </aside>
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
                      onClick={() => openAuthModal("login", "/")}
                    >
                      {t("home.login")}
                    </button>
                    <button
                      type="button"
                      className="home-nav__button home-nav__button--solid"
                      onClick={() => openAuthModal("signup", "/")}
                    >
                      {t("home.signup")}
                    </button>
                  </>
                ) : (
                  <Link href="/" className="home-nav__button home-nav__button--solid">
                    {t("nav.home")}
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

        {authChecked && !user && showScrollCue && (
          <button
            type="button"
            className="home-scroll-cue"
            onClick={scrollToPreview}
            aria-label="아래 콘텐츠로 스크롤"
          >
            <span className="home-scroll-cue__label">아래로 살짝 내려보세요</span>
            <span className="home-scroll-cue__arrow" aria-hidden="true">↷</span>
          </button>
        )}

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
