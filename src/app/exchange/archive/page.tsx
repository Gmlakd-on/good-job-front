"use client";

/**
 * 교환일기 보관함 — 하나의 아카이브.
 * 진행 중인 권은 "쓰러 가기"로 바로 작성 진입, 지난 권은 다시 읽기 진입.
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

function dayIndexNow(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1;
}

export default function ExchangeArchivePage() {
  const router = useRouter();
  const { t } = useI18n();
  const [sessions, setSessions] = useState<ExchangeSessionWithPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }
      const res = await fetch("/api/exchange/sessions", { cache: "no-store" });
      if (res.ok) setSessions((await res.json()).sessions || []);
      setLoading(false);
    };
    load();
  }, [router]);

  const { active, past } = useMemo(() => ({
    active: sessions.filter((s) => ACTIVE_STATUSES.includes(s.status)),
    past: sessions.filter((s) => !ACTIVE_STATUSES.includes(s.status)),
  }), [sessions]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.loading")}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/exchange")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("xch.back.exchange")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("arc.title")}</h1>
        <div className="w-12" />
      </div>

      {sessions.length === 0 && (
        <div className="diary-card p-8 text-center">
          <p className="text-2xl mb-3">🗂️</p>
          <p className="text-sm opacity-50">{t("arc.empty")}</p>
          <p className="text-xs opacity-35 mt-2">{t("arc.emptyHint")}</p>
        </div>
      )}

      {active.length > 0 && (
        <section className="mb-6">
          <h2 className="text-sm font-medium px-1 mb-3" style={{ color: "var(--deep-gray)" }}>{t("arc.ongoing")}</h2>
          <div className="space-y-3">
            {active.map((s) => {
              const day = Math.min(Math.max(dayIndexNow(s.started_at), 1), 7);
              const name = s.partner_display_name || t("xch.fr.anon");
              return (
                <div key={s.id} className="diary-card xch-card">
                  <span className="xch-card__avatar" aria-hidden="true">{name.slice(0, 1)}</span>
                  <span className="xch-card__body">
                    <span className="xch-card__name">{t("xch.card.with", { name })}</span>
                    <span className="xch-card__days" aria-label={t("xch.card.dayAria", { n: day })}>
                      {Array.from({ length: 7 }, (_, i) => (
                        <span key={i} className={`xch-card__dot ${i < day ? "xch-card__dot--past" : ""} ${i === day - 1 ? "xch-card__dot--today" : ""}`} />
                      ))}
                      <span className="xch-card__day-label">{t("xch.card.day", { n: day })}</span>
                    </span>
                  </span>
                  <Link href={`/exchange/${s.id}`} className="btn-primary px-4 py-2 text-xs flex-none">
                    {t("arc.write")}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {past.length > 0 && (
        <section>
          <h2 className="text-sm font-medium px-1 mb-3 opacity-60" style={{ color: "var(--deep-gray)" }}>{t("arc.past")}</h2>
          <div className="space-y-3">
            {past.map((s) => {
              const name = s.partner_display_name || t("xch.fr.anon");
              return (
                <Link key={s.id} href={`/exchange/${s.id}`} className="diary-card xch-card xch-card--past">
                  <span className="xch-card__avatar" aria-hidden="true">{name.slice(0, 1)}</span>
                  <span className="xch-card__body">
                    <span className="xch-card__name">{t("xch.card.with", { name })}</span>
                    <span className="xch-card__meta">
                      @{s.partner_handle || "unknown"} · {t(STATUS_KEY[s.status] as DictKey)}
                    </span>
                  </span>
                  <span className="xch-card__arrow" aria-hidden="true">→</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
