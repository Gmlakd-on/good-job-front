"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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
  const [authNext, setAuthNext] = useState("/books");

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

  const quoteText = `“${localizedQuote.text}”`;
  const quoteAuthor = localizedQuote.author;

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
