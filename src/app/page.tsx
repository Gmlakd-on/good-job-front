"use client";

import { useCallback, useEffect, useState } from "react";
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
}

type AuthMode = "login" | "signup";

export default function HomePage() {
  const { t } = useI18n();
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
    fetch("/api/quotes", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setQuote(data.quote))
      .catch(() =>
        setQuote({ id: "default", quote_text: t("home.quoteDefault"), author: "참 잘했어요" }),
      );
  }, []);

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

  const quoteText = quote ? `“${quote.quote_text}”` : t("home.quoteLoading");
  const quoteAuthor = quote?.author?.trim() || "참 잘했어요";

  return (
    <div className="home-shell">
      <header className={`home-nav ${navHidden ? "home-nav--hidden" : ""}`}>
        <div className="home-nav__inner">
          <Link href="/" className="home-nav__logo" aria-label={t("home.logoAria")}>
            참 잘했어요
          </Link>

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
      </header>

      <main>
        <section className="home-hero" aria-label={t("home.quoteLabel")}>
          <div className="home-hero__inner">
            <div className="home-hero__quote-zone">
              <figure
                className="home-quote-card"
                tabIndex={0}
                aria-label={`${t("home.quoteLabel")}. ${quoteText} — ${quoteAuthor}`}
              >
                <blockquote className="home-quote-card__quote">
                  <p className="home-quote-card__text">{quoteText}</p>
                </blockquote>
                <figcaption className="home-quote-card__author">— {quoteAuthor}</figcaption>
                <div className="home-quote-card__meta" aria-hidden="true">
                  <span>{t("home.quoteLabel")}</span>
                </div>
              </figure>

              <div className="home-hero__ctas" aria-label={t("home.quickNav")}>
                <button type="button" className="home-hero__cta home-hero__cta--primary" onClick={enterWrite}>
                  {t("home.ctaWrite")}
                </button>
                <button type="button" className="home-hero__cta home-hero__cta--secondary" onClick={enterBooks}>
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

        {/* 로그인 전: 가입 없이 표지 고르기 → 적기 → 답장 체험 */}
        {authChecked && !user && <TryItDemo />}

        <section className="home-feature-section" aria-label={t("home.featuresAria")}>
          <div className="home-feature-grid">
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
    <button type="button" onClick={onClick} className="home-feature-card">
      <div className="home-feature-card__top">
        <span className="home-feature-card__icon">{icon}</span>
        <span className="home-feature-card__arrow">→</span>
      </div>
      <h3 className="home-feature-card__title">{title}</h3>
      <p className="home-feature-card__description">{description}</p>
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
