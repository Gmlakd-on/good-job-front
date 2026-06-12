"use client";

/**
 * 감정 리포트.
 * - 모바일: 기존처럼 위→아래 한 흐름 (요약 → 분포 → 2주 기록 → 인사이트).
 * - 데스크톱(≥1024px): 좌측 요약/인사이트 사이드(sticky) + 우측 차트 2단 그리드로
 *   확장된 본문 폭(980px)을 실제로 활용한다.
 * - 추가 지표: 연속 기록(streak) — "오늘 포함 n일째"를 요약 카드에 함께 보여준다.
 */
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import { EMOTIONS } from "@/types";

interface DiaryForReport {
  created_at: string;
  diary_emotions: { emotion_code: string }[];
}

type Period = "7d" | "30d" | "all";

/** 오늘(또는 어제)부터 거꾸로 이어지는 연속 기록 일수 */
function computeStreak(diaries: DiaryForReport[], now: Date): number {
  const days = new Set(diaries.map((d) => new Date(d.created_at).toDateString()));
  let streak = 0;
  const cursor = new Date(now);
  // 오늘 아직 안 썼다면 어제부터 세기 시작 (하루 비기 전까지는 streak 유지)
  if (!days.has(cursor.toDateString())) cursor.setDate(cursor.getDate() - 1);
  while (days.has(cursor.toDateString())) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export default function ReportPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [diaries, setDiaries] = useState<DiaryForReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch("/api/diaries");
      if (res.ok) {
        const data = await res.json();
        setDiaries(data.diaries || []);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    return diaries.filter((d) => {
      if (period === "all") return true;
      const days = period === "7d" ? 7 : 30;
      return new Date(d.created_at) >= new Date(now.getTime() - days * 86400000);
    });
  }, [diaries, period, now]);

  // 감정 집계
  const { sorted, totalEmotions } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;
    for (const d of filtered) {
      for (const e of d.diary_emotions || []) {
        counts[e.emotion_code] = (counts[e.emotion_code] || 0) + 1;
        total++;
      }
    }
    return { sorted: Object.entries(counts).sort(([, a], [, b]) => b - a), totalEmotions: total };
  }, [filtered]);

  // 일별 기록 수 (최근 14일) — 요일 라벨 + 오늘 표시
  const { dailyCounts, maxDaily } = useMemo(() => {
    const WEEKDAY = language === "en"
      ? ["S", "M", "T", "W", "T", "F", "S"]
      : ["일", "월", "화", "수", "목", "금", "토"];
    const list: { date: string; weekday: string; count: number; isToday: boolean }[] = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 86400000);
      const dateStr = d.toDateString();
      list.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        weekday: WEEKDAY[d.getDay()],
        count: diaries.filter((diary) => new Date(diary.created_at).toDateString() === dateStr).length,
        isToday: i === 0,
      });
    }
    return { dailyCounts: list, maxDaily: Math.max(...list.map((d) => d.count), 1) };
  }, [diaries, now, language]);

  const streak = useMemo(() => computeStreak(diaries, now), [diaries, now]);
  const topEmotion = sorted[0] ? EMOTIONS.find((e) => e.code === sorted[0][0]) : null;
  const nextEmotion = sorted[1] ? EMOTIONS.find((e) => e.code === sorted[1][0]) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("report.loading")}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 report">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.back()} className="text-sm opacity-40 hover:opacity-70">
          {t("report.back")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("report.title")}</h1>
        <div className="w-8" />
      </div>

      {/* 기간 선택 */}
      <div className="report-period" role="tablist" aria-label={t("report.periodAria")}>
        {(["7d", "30d", "all"] as const).map((key) => (
          <button
            key={key}
            role="tab"
            aria-selected={period === key}
            onClick={() => setPeriod(key)}
            className={`report-period__btn ${period === key ? "report-period__btn--active" : ""}`}
          >
            {t(`report.period.${key}` as DictKey)}
          </button>
        ))}
      </div>

      <div className="report-grid">
        {/* ── 좌측(데스크톱) / 상단(모바일): 요약 + 인사이트 ── */}
        <aside className="report-side">
          <div className="diary-card report-summary">
            <div className="report-summary__stat">
              <p className="report-summary__num">{filtered.length}</p>
              <p className="report-summary__label">{t("report.diaryCount", { period: t(`report.periodLabel.${period}` as DictKey) })}</p>
            </div>
            <div className="report-summary__divider" aria-hidden="true" />
            <div className="report-summary__stat">
              <p className="report-summary__num">
                {streak}
                <span className="report-summary__unit">{t("report.streakUnit")}</span>
              </p>
              <p className="report-summary__label">
                {streak > 0 ? t("report.streakOn") : t("report.streakOff")}
              </p>
            </div>
          </div>

          {topEmotion && (
            <div className="diary-card report-insight">
              <p className="text-sm font-medium mb-3 opacity-70">{t("report.insight")}</p>
              <p className="text-sm leading-relaxed opacity-60">
                {t("report.insightMain", { period: t(`report.insightPeriod.${period}` as DictKey) })}{" "}
                <span style={{ color: "var(--deep-gray)" }}>
                  {topEmotion.emoji} {topEmotion.label}
                </span>
                {t("report.insightIs")}
                {nextEmotion && (
                  <>
                    {" "}{t("report.insightNext")}{" "}
                    <span style={{ color: "var(--deep-gray)" }}>
                      {nextEmotion.emoji} {nextEmotion.label}
                    </span>
                    {t("report.insightTail")}
                  </>
                )}
              </p>
              <p className="text-xs opacity-40 mt-3">
                {t("report.insightFoot")}
              </p>
            </div>
          )}
        </aside>

        {/* ── 우측(데스크톱) / 하단(모바일): 차트 ── */}
        <div className="report-main">
          {filtered.length === 0 ? (
            <div className="diary-card p-6 text-center">
              <p className="text-sm opacity-50">{t("report.emptyPeriod")}</p>
            </div>
          ) : (
            <>
              {/* 감정 분포 바 차트 */}
              <div className="diary-card p-5">
                <p className="text-sm font-medium mb-4 opacity-70">{t("report.distribution")}</p>
                <div className="space-y-3">
                  {sorted.map(([code, count], rank) => {
                    const emotion = EMOTIONS.find((e) => e.code === code);
                    const pct = totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0;
                    return (
                      <div key={code}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span>
                            {emotion?.emoji} {emotion?.label || code}
                          </span>
                          <span className="opacity-40">{t("report.countPct", { count, pct })}</span>
                        </div>
                        <div className="report-bar">
                          <div
                            className={`report-bar__fill ${rank === 0 ? "report-bar__fill--top" : ""}`}
                            style={{ width: `${pct}%`, minWidth: pct > 0 ? "4px" : "0" }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 일별 기록 (최근 2주) */}
              <div className="diary-card p-5">
                <p className="text-sm font-medium mb-4 opacity-70">{t("report.twoWeeks")}</p>
                <div className="report-days">
                  {dailyCounts.map((d, i) => (
                    <div key={i} className={`report-days__col ${d.isToday ? "report-days__col--today" : ""}`}>
                      <span className="report-days__count">{d.count > 0 ? d.count : ""}</span>
                      <div
                        className={`report-days__bar ${d.count > 0 ? "report-days__bar--filled" : ""}`}
                        style={{
                          height: `${Math.max((d.count / maxDaily) * 56, d.count > 0 ? 6 : 2)}px`,
                        }}
                        title={`${d.date} · ${d.count}개`}
                      />
                      <span className="report-days__weekday">{d.weekday}</span>
                      <span className="report-days__date">{i % 2 === 0 ? d.date : ""}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
