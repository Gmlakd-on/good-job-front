"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
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
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [quote, setQuote] = useState<Quote | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<AuthMode>("login");
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
    fetch("/api/quotes", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => setQuote(data.quote))
      .catch(() =>
        setQuote({ id: "default", quote_text: "오늘 하루도 수고했어요.", author: "참 잘했어요" }),
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

  const quoteText = quote ? `“${quote.quote_text}”` : "오늘의 명언을 불러오는 중이에요.";
  const quoteAuthor = quote?.author?.trim() || "참 잘했어요";

  return (
    <div className="home-shell">
      <header className="home-nav">
        <div className="home-nav__inner">
          <Link href="/" className="home-nav__logo" aria-label="참 잘했어요 홈">
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
                    로그인
                  </button>
                  <button
                    type="button"
                    className="home-nav__button home-nav__button--solid"
                    onClick={() => openAuthModal("signup", "/books")}
                  >
                    회원가입
                  </button>
                </>
              ) : (
                <Link href="/books" className="home-nav__button home-nav__button--solid">
                  내 책장
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main>
        <section className="home-hero" aria-label="오늘의 명언">
          <div className="home-hero__inner">
            <div className="home-hero__quote-zone">
              <figure
                className="home-quote-card"
                tabIndex={0}
                aria-label={`오늘의 명언. ${quoteText} — ${quoteAuthor}`}
              >
                <blockquote className="home-quote-card__quote">
                  <p className="home-quote-card__text">{quoteText}</p>
                </blockquote>
                <figcaption className="home-quote-card__author">— {quoteAuthor}</figcaption>
                <div className="home-quote-card__meta" aria-hidden="true">
                  <span>오늘의 명언</span>
                </div>
              </figure>

              <div className="home-hero__ctas" aria-label="빠른 이동">
                <button type="button" className="home-hero__cta home-hero__cta--primary" onClick={enterWrite}>
                  일기 쓰기
                </button>
                <button type="button" className="home-hero__cta home-hero__cta--secondary" onClick={enterBooks}>
                  내 책장 보기
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

        <section className="home-feature-section" aria-label="주요 기능">
          <div className="home-feature-grid">
            <FeatureCard
              icon="📮"
              title="교환일기"
              description="친구 또는 모르는 누군가와 안전하게 일기를 주고받아요."
              badges={["친구 교환", "랜덤 교환"]}
              onClick={() => user ? router.push("/exchange") : openAuthModal("login", "/exchange")}
            />
            <FeatureCard
              icon="📔"
              title="내 일기장"
              description="오늘의 마음과 답장을 한 권의 기록으로 차곡차곡 모아요."
              badges={["AI 답장", "책장"]}
              onClick={enterBooks}
            />
            <FeatureCard
              icon="🧭"
              title="감정 리포트"
              description="내가 자주 느끼는 감정의 흐름을 조용히 돌아봐요."
              badges={["패턴", "회복"]}
              onClick={() => user ? router.push("/report") : openAuthModal("login", "/report")}
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
