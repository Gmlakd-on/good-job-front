"use client";

/**
 * 교환일기 허브.
 * UX 정비:
 * - 세션이 있으면 세션 목록이 첫 콘텐츠 (설명 카드가 본문을 밀어내지 않게 하단으로).
 * - 세션 카드에 핵심 정보 노출: Day n/7 진행 점, 상태 라벨(원시 status 문자열 노출 제거), 아바타 이니셜.
 * - 진행 중 세션과 지난 세션을 분리 정렬.
 * - 혼란을 주던 "일기 고르기 → /books" 보조 CTA 제거, 행동은 "친구 초대하기" 하나로.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { ExchangeSessionStatus, ExchangeSessionWithPartner } from "@/types/exchange";

const ACTIVE_STATUSES: ExchangeSessionStatus[] = ["active_7day", "extension_pending", "extended"];

const STATUS_KEY: Record<ExchangeSessionStatus, string> = {
  active_7day: "xch.status.active",
  extension_pending: "xch.status.extensionPending",
  extended: "xch.status.extended",
  ended: "xch.status.ended",
  terminated: "xch.status.terminated",
};

/** 시작일 기준 오늘이 몇 일째인지 (1~7, 범위 밖은 절사) */
function dayOf(session: ExchangeSessionWithPartner): number {
  const start = new Date(session.started_at);
  start.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((today.getTime() - start.getTime()) / 86400000) + 1;
  return Math.min(Math.max(diff, 1), 7);
}

function SessionCard({ session }: { session: ExchangeSessionWithPartner }) {
  const { t } = useI18n();
  const isActive = ACTIVE_STATUSES.includes(session.status);
  const day = dayOf(session);
  const name = session.partner_display_name || t("xch.fr.anon");

  return (
    <Link
      href={`/exchange/${session.id}`}
      className={`diary-card xch-card ${isActive ? "" : "xch-card--past"}`}
    >
      <span className="xch-card__avatar" aria-hidden="true">{name.slice(0, 1)}</span>
      <span className="xch-card__body">
        <span className="xch-card__name">{t("xch.card.with", { name })}</span>
        <span className="xch-card__meta">
          @{session.partner_handle || "unknown"} · {t(STATUS_KEY[session.status] as DictKey)}
        </span>
        {isActive && (
          <span className="xch-card__days" aria-label={t("xch.card.dayAria", { n: day })}>
            {Array.from({ length: 7 }, (_, i) => (
              <span
                key={i}
                className={`xch-card__dot ${i < day ? "xch-card__dot--past" : ""} ${i === day - 1 ? "xch-card__dot--today" : ""}`}
              />
            ))}
            <span className="xch-card__day-label">{t("xch.card.day", { n: day })}</span>
          </span>
        )}
      </span>
      <span className="xch-card__arrow" aria-hidden="true">→</span>
    </Link>
  );
}

export default function ExchangeHomePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [sessions, setSessions] = useState<ExchangeSessionWithPartner[]>([]);
  const [hasOffer, setHasOffer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const [sessionsRes, offerRes] = await Promise.all([
        fetch("/api/exchange/sessions", { cache: "no-store" }),
        fetch("/api/exchange/random/current-offer", { cache: "no-store" }),
      ]);
      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }
      if (offerRes.ok) {
        const data = await offerRes.json();
        setHasOffer(Boolean(data.offer));
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const { active, past } = useMemo(() => {
    const active = sessions.filter((s) => ACTIVE_STATUSES.includes(s.status));
    const past = sessions.filter((s) => !ACTIVE_STATUSES.includes(s.status));
    return { active, past };
  }, [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.loading")}</p>
      </div>
    );
  }

  const hasSessions = sessions.length > 0;

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("xch.back.home")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("xch.title")}</h1>
        <Link href="/exchange/friends" className="text-sm opacity-60 hover:opacity-90">
          {t("xch.friends")}
        </Link>
      </div>

      {/* 매칭 제안 도착 배너 — 시간 제한이 있는 가장 긴급한 항목 */}
      {hasOffer && (
        <Link href="/exchange/random" className="diary-card xch-offer-banner mb-4">
          <span aria-hidden="true">🎲</span>
          <span className="flex-1">
            <span className="text-sm font-medium block" style={{ color: "var(--deep-gray)" }}>{t("xch.hub.offerBanner")}</span>
            <span className="text-xs opacity-50">{t("xch.hub.offerBannerDesc")}</span>
          </span>
          <span className="xch-card__arrow" aria-hidden="true">→</span>
        </Link>
      )}

      {/* 세션이 없을 때만 설명 카드가 주인공 */}
      {!hasSessions && (
        <div className="diary-card p-6 text-center mb-4">
          <p className="text-2xl mb-3">💌</p>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
            {t("xch.hub.heroTitle")}
          </p>
          <p className="text-xs opacity-50 leading-relaxed mb-5">
            {t("xch.hub.heroDesc1")}
            <br />{t("xch.hub.heroDesc2")}
          </p>
          <div className="flex gap-2 justify-center">
            <Link href="/exchange/friends" className="btn-primary px-5 py-3 text-sm inline-block">
              {t("xch.hub.inviteCta")}
            </Link>
            <Link
              href="/exchange/random"
              className="px-5 py-3 text-sm rounded-full inline-block"
              style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
            >
              {t("xch.hub.randomCta")}
            </Link>
          </div>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium px-1 mb-3" style={{ color: "var(--deep-gray)" }}>{t("xch.hub.active")}</h2>
          <div className="space-y-3">
            {active.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium px-1 mb-3 opacity-60" style={{ color: "var(--deep-gray)" }}>{t("xch.hub.past")}</h2>
          <div className="space-y-3">
            {past.map((s) => <SessionCard key={s.id} session={s} />)}
          </div>
        </section>
      )}

      {/* 세션이 있는 사용자에겐 설명을 짧은 보조 행으로 */}
      {hasSessions && (
        <div className="xch-hub-foot">
          <p className="text-xs opacity-45">{t("xch.hub.footHint")}</p>
          <span className="flex gap-3 flex-none">
            <Link href="/exchange/random" className="text-xs underline opacity-60 hover:opacity-90">
              {t("xch.hub.footRandom")}
            </Link>
            <Link href="/exchange/friends" className="text-xs underline opacity-60 hover:opacity-90">
              {t("xch.hub.footInvite")}
            </Link>
          </span>
        </div>
      )}
    </div>
  );
}
