"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { apiGetJson, invalidateApiCache } from "@/lib/apiCache";
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

type ExchangeSessionStatus = "active_7day" | "extension_pending" | "extended" | "ended" | "terminated";

interface ExchangeSessionSummary {
  id: string;
  status: ExchangeSessionStatus | string;
  started_at: string;
  partner_display_name?: string | null;
}

interface ExchangeSessionsResponse {
  sessions?: ExchangeSessionSummary[];
}

const ACTIVE_EXCHANGE_STATUSES = new Set<string>(["active_7day", "extension_pending", "extended"]);

const getExchangeDayIndex = (startedAt: string) => {
  const startedAtMs = new Date(startedAt).getTime();

  if (!Number.isFinite(startedAtMs)) {
    return 1;
  }

  return Math.max(Math.floor((Date.now() - startedAtMs) / 86400000) + 1, 1);
};

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
  const [activeExchangeSession, setActiveExchangeSession] = useState<ExchangeSessionSummary | null>(null);

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
      const [profileResponse, exchangeResponse] = await Promise.all([
        apiGetJson<{ profile?: Profile }>("/api/profile", { ttlMs: 30_000 }),
        fetch("/api/exchange/sessions", { cache: "no-store" })
          .then(async (response): Promise<ExchangeSessionsResponse> => {
            if (!response.ok) {
              return { sessions: [] };
            }

            return response.json();
          })
          .catch(() => ({ sessions: [] })),
      ]);

      const nextProfile = profileResponse.profile ?? { nickname: null };
      const nickname = nextProfile.nickname?.trim() ?? "";
      if (!nickname) {
        setNicknameInput("");
        setNicknameModalOpen(true);
      }

      setActiveExchangeSession(
        exchangeResponse.sessions?.find((session) => ACTIVE_EXCHANGE_STATUSES.has(session.status)) ?? null,
      );
    } catch {
      setActiveExchangeSession(null);
    }
  }, [user]);

  useEffect(() => {
    if (!authChecked) return;

    if (!user) {
      setActiveExchangeSession(null);
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
  const adsenseClientId = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_CLIENT_ID ?? "";
  const adsenseHomeSlot = process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_HOME_SLOT ?? "";
  const canRenderAdsenseSlot = Boolean(adsenseClientId && adsenseHomeSlot);
  const activeExchangePartnerName = activeExchangeSession?.partner_display_name?.trim() || "상대";
  const exchangeMiniTitle = activeExchangeSession
    ? `${activeExchangePartnerName}님과 ${getExchangeDayIndex(activeExchangeSession.started_at)}일째`
    : "아직 교환일기를 시작하지 않았어요";
  const exchangeMiniDescription = activeExchangeSession
    ? "매일의 기록이 모여, 우리가 서로에게 가장 다정한 세계가 됩니다."
    : "친구 초대나 랜덤 교환으로 새로운 연결을 만들어보세요.";
  const exchangeMiniButtonLabel = activeExchangeSession ? "교환일기 쓰기" : "교환일기 시작하기";

  if (authChecked && user) {
    return (
      <div className="chami-home">
        <main className="chami-home-main">
          <section className="chami-home-grid" aria-label="오늘의 홈 대시보드">
            <article className="chami-note-card chami-card">
              <div className="chami-note-card__label">
                <span aria-hidden="true">❝</span>
                <strong>오늘의 명언</strong>
                <span aria-hidden="true">❞</span>
              </div>
              <blockquote className="chami-note-card__quote">
                {dashboardQuoteLines.map((line, index) => (
                  <span key={`${line}-${index}`}>{line}</span>
                ))}
              </blockquote>
              <p className="chami-note-card__author">- {quoteAuthor}</p>

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

            <article className="chami-mascot-card chami-mascot-card--widget-only chami-card" aria-label="참이 돌봄 게임 위젯">
              <div className="chami-mascot-stage chami-mascot-stage--widget">
                <ChamiCareWidgetFrame />
              </div>
            </article>
          </section>

          <section className="chami-lower-grid" aria-label="홈 하단 바로가기">
            <article className="chami-mini-card chami-card chami-mini-card--exchange">
              <div className="chami-mini-card__visual" aria-hidden="true"><Image src="/home-icons/exchange.png" alt="" width={72} height={72} /></div>
              <div>
                <h2>교환일기</h2>
                <p className="chami-mini-card__strong">{exchangeMiniTitle}</p>
                <p>{exchangeMiniDescription}</p>
              </div>
              <button type="button" onClick={() => (guardAuth("/exchange") ? router.push("/exchange") : undefined)}>
                {exchangeMiniButtonLabel} <span aria-hidden="true">›</span>
              </button>
            </article>

            <article className="chami-mini-card chami-card chami-mini-card--refresh">
              <div className="chami-mini-card__visual" aria-hidden="true"><Image src="/home-icons/refresh-card.png" alt="" width={72} height={72} /></div>
              <div>
                <h2>환기 카드</h2>
                <p>오늘의 감정에 맞는 작은 추천이 도착했어요.</p>
              </div>
              <button type="button" onClick={() => (guardAuth("/report") ? router.push("/report") : undefined)}>
                열어보기 <span aria-hidden="true">›</span>
              </button>
            </article>

            <article className="chami-mini-card chami-card chami-mini-card--report">
              <div className="chami-mini-card__visual" aria-hidden="true"><Image src="/home-icons/report.png" alt="" width={72} height={72} /></div>
              <div>
                <h2>감정 리포트</h2>
                <p>이번 주 마음의 흐름을 조용히 돌아봐요.</p>
              </div>
              <button type="button" onClick={() => (guardAuth("/report") ? router.push("/report") : undefined)}>
                보러가기 <span aria-hidden="true">›</span>
              </button>
            </article>

            <article className="chami-ad-card chami-ad-card--placeholder chami-card" aria-label="광고 영역">
              <div className="chami-ad-card__label">
                <span>광고 영역</span>
                <em>Google AdSense</em>
              </div>
              <div className="chami-ad-placeholder chami-ad-placeholder--adsense">
                {canRenderAdsenseSlot ? (
                  <ins
                    className="adsbygoogle chami-adsense-slot"
                    style={{ display: "block" }}
                    data-ad-client={adsenseClientId}
                    data-ad-slot={adsenseHomeSlot}
                    data-ad-format="auto"
                    data-full-width-responsive="true"
                  />
                ) : (
                  <div className="chami-ad-placeholder__fallback" aria-hidden="true" />
                )}
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
