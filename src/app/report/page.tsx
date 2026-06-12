"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EMOTIONS } from "@/types";

interface DiaryForReport {
  created_at: string;
  diary_emotions: { emotion_code: string }[];
}

type Period = "7d" | "30d" | "all";

type EmotionCount = [code: string, count: number];

const EMOTION_EN_LABELS: Record<string, string> = {
  joy: "Joy",
  happiness: "Happiness",
  calm: "Calm",
  gratitude: "Gratitude",
  excitement: "Excitement",
  pride: "Pride",
  hope: "Hope",
  love: "Love",
  satisfaction: "Satisfaction",
  comfort: "Comfort",
  sadness: "Sadness",
  anxiety: "Anxiety",
  loneliness: "Loneliness",
  lethargy: "Low energy",
  exhaustion: "Exhaustion",
  anger: "Anger",
  irritation: "Irritation",
  frustration: "Frustration",
  regret: "Regret",
  fear: "Fear",
};

function computeStreak(diaries: DiaryForReport[], now: Date): number {
  const days = new Set(diaries.map((diary) => new Date(diary.created_at).toDateString()));
  let streak = 0;
  const cursor = new Date(now);

  if (!days.has(cursor.toDateString())) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (days.has(cursor.toDateString())) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

function getEmotionMeta(code: string, language: "ko" | "en") {
  const emotion = EMOTIONS.find((item) => item.code === code);
  return {
    emoji: emotion?.emoji ?? "•",
    label: language === "en" ? EMOTION_EN_LABELS[code] ?? emotion?.label ?? code : emotion?.label ?? code,
  };
}

function createDailyCounts(diaries: DiaryForReport[], now: Date, language: "ko" | "en") {
  const weekdays = language === "en"
    ? ["S", "M", "T", "W", "T", "F", "S"]
    : ["일", "월", "화", "수", "목", "금", "토"];

  return Array.from({ length: 14 }, (_, index) => {
    const daysAgo = 13 - index;
    const date = new Date(now.getTime() - daysAgo * 86400000);
    const dateKey = date.toDateString();
    const count = diaries.filter((diary) => new Date(diary.created_at).toDateString() === dateKey).length;

    return {
      count,
      date: `${date.getMonth() + 1}/${date.getDate()}`,
      isToday: daysAgo === 0,
      weekday: weekdays[date.getDay()],
    };
  });
}

export default function ReportPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [diaries, setDiaries] = useState<DiaryForReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("30d");

  const copy = language === "en"
    ? {
      back: "← Home",
      title: "Emotion Report ✨",
      share: "Share",
      period: { "7d": "7 days", "30d": "30 days", all: "All" },
      periodSentence: { "7d": "this week", "30d": "the last 30 days", all: "all records" },
      diaryCount: "Written diaries",
      streak: "Streak",
      topEmotion: "Most common emotion",
      recovered: "Recovered emotion",
      recoveredValue: "Writing streak",
      mostThisWeek: "Most common this week",
      repeated: "Often repeated",
      recoveredTitle: "Recovered feeling",
      donut: "Emotion donut",
      distribution: "Emotion distribution",
      insight: "Emotion insight",
      calendar: "Weekly emotion calendar",
      aiTitle: "AI summary of your emotional flow",
      noData: "No records yet",
      noDataDesc: "Once you write a diary, your emotional flow will appear here.",
      pctTail: "of your entries carried this feeling.",
      repeatedDesc: "Repeated feelings can be a gentle signal to care for yourself.",
      notEnough: "A little more writing will reveal the pattern.",
      recoveryDesc: "Your steady records show a small rhythm of recovery.",
      insightBody: "Recently, anxiety and low energy appear often. Take a quiet break and remember the small things you already handled well.",
      cheer: "Encourage today’s me",
    }
    : {
      back: "← 홈",
      title: "감정 리포트 ✨",
      share: "공유하기",
      period: { "7d": "7일", "30d": "30일", all: "전체" },
      periodSentence: { "7d": "이번 주", "30d": "최근 30일", all: "전체 기록" },
      diaryCount: "기록한 일기",
      streak: "연속 기록",
      topEmotion: "가장 많았던 감정",
      recovered: "회복된 감정",
      recoveredValue: "기록 흐름",
      mostThisWeek: "이번 주 가장 많았던 감정",
      repeated: "자주 반복된 감정",
      recoveredTitle: "회복된 감정",
      donut: "감정 도넛",
      distribution: "감정 분포",
      insight: "감정 인사이트",
      calendar: "주간 감정 캘린더",
      aiTitle: "AI가 요약한 감정 흐름",
      noData: "아직 기록이 없어요",
      noDataDesc: "일기를 쓰면 이곳에서 감정 흐름을 조용히 돌아볼 수 있어요.",
      pctTail: "정도가 이 감정으로 남아 있어요.",
      repeatedDesc: "반복되는 감정은 나를 돌보라는 작은 신호일 수 있어요.",
      notEnough: "아직 반복 패턴을 말하기엔 기록이 조금 더 필요해요.",
      recoveryDesc: "기록을 이어가며 마음을 회복하는 흐름이 보여요.",
      insightBody: "최근 불안과 무기력이 자주 나타나고 있어요. 충분히 쉬고, 작은 성취를 기억하며 나를 다독이는 시간을 가져보세요.",
      cheer: "오늘의 당신을 응원해요",
    };

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      const response = await fetch("/api/diaries", { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setDiaries(data.diaries || []);
      }

      setLoading(false);
    };

    load();
  }, [router]);

  const now = useMemo(() => new Date(), []);

  const filtered = useMemo(() => {
    if (period === "all") return diaries;

    const days = period === "7d" ? 7 : 30;
    const threshold = new Date(now.getTime() - days * 86400000);
    return diaries.filter((diary) => new Date(diary.created_at) >= threshold);
  }, [diaries, now, period]);

  const { sortedEmotions, totalEmotions } = useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    filtered.forEach((diary) => {
      diary.diary_emotions?.forEach((emotion) => {
        counts[emotion.emotion_code] = (counts[emotion.emotion_code] || 0) + 1;
        total += 1;
      });
    });

    return {
      sortedEmotions: Object.entries(counts).sort(([, a], [, b]) => b - a) as EmotionCount[],
      totalEmotions: total,
    };
  }, [filtered]);

  const streak = useMemo(() => computeStreak(diaries, now), [diaries, now]);
  const dailyCounts = useMemo(() => createDailyCounts(diaries, now, language), [diaries, language, now]);
  const maxDailyCount = Math.max(...dailyCounts.map((day) => day.count), 1);

  const topEmotion = sortedEmotions[0];
  const topMeta = topEmotion ? getEmotionMeta(topEmotion[0], language) : null;
  const topEmotionPct = topEmotion && totalEmotions > 0 ? Math.round((topEmotion[1] / totalEmotions) * 100) : 0;
  const repeatedEmotion = sortedEmotions.find(([, count]) => count >= 2);
  const repeatedMeta = repeatedEmotion ? getEmotionMeta(repeatedEmotion[0], language) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("report.loading")}</p>
      </div>
    );
  }

  return (
    <main className="report-page report-page--reference">
      <header className="report-reference-header">
        <button type="button" onClick={() => router.push("/")} className="report-reference-header__back">
          {copy.back}
        </button>
        <div className="report-reference-header__center">
          <h1>{copy.title}</h1>
          <div className="report-period" role="tablist" aria-label="감정 리포트 기간 선택">
            {(["7d", "30d", "all"] as const).map((key) => (
              <button
                key={key}
                role="tab"
                type="button"
                aria-selected={period === key}
                onClick={() => setPeriod(key)}
                className={`report-period__btn ${period === key ? "report-period__btn--active" : ""}`}
              >
                {copy.period[key]}
              </button>
            ))}
          </div>
        </div>
        <button type="button" className="report-reference-header__share">
          <span aria-hidden="true">⇧</span>
          {copy.share}
        </button>
      </header>

      <section className="report-stat-grid" aria-label="감정 요약">
        <article className="report-stat-card">
          <span className="report-stat-card__icon report-stat-card__icon--green" aria-hidden="true">📖</span>
          <span>{copy.diaryCount}</span>
          <strong>{filtered.length}{language === "ko" ? "개" : ""}</strong>
        </article>
        <article className="report-stat-card">
          <span className="report-stat-card__icon report-stat-card__icon--coral" aria-hidden="true">🗓️</span>
          <span>{copy.streak}</span>
          <strong>{language === "ko" ? `${streak}일` : `${streak} days`}</strong>
        </article>
        <article className="report-stat-card">
          <span className="report-stat-card__icon report-stat-card__icon--yellow" aria-hidden="true">{topMeta?.emoji ?? "🙂"}</span>
          <span>{copy.topEmotion}</span>
          <strong>{topMeta ? `${topMeta.label} ${topEmotionPct}%` : copy.noData}</strong>
        </article>
        <article className="report-stat-card">
          <span className="report-stat-card__icon report-stat-card__icon--leaf" aria-hidden="true">🌱</span>
          <span>{copy.recovered}</span>
          <strong>{streak > 0 ? (language === "ko" ? `연속 ${streak}일 기록` : `${streak} day streak`) : copy.recoveredValue}</strong>
        </article>
      </section>

      {filtered.length === 0 ? (
        <section className="report-empty-card">
          <span aria-hidden="true">🍃</span>
          <h2>{copy.noData}</h2>
          <p>{copy.noDataDesc}</p>
        </section>
      ) : (
        <>
          <section className="report-reading-cards report-reading-cards--reference">
            <article className="report-reading-card report-reading-card--repeat">
              <span>{copy.repeated}</span>
              <strong>{repeatedMeta ? `${repeatedMeta.emoji} ${repeatedMeta.label}` : copy.noData}</strong>
              <p>{repeatedMeta ? copy.repeatedDesc : copy.notEnough}</p>
            </article>
            <article className="report-reading-card report-reading-card--wave">
              <span>{copy.recoveredTitle}</span>
              <strong>{streak > 0 ? (language === "ko" ? `연속 ${streak}일 기록` : `${streak} day streak`) : copy.recoveredValue}</strong>
              <p>{copy.recoveryDesc}</p>
            </article>
          </section>

          <section className="report-bottom-grid">
            <article className="report-donut-card report-card-panel">
              <p className="report-panel-title">{copy.donut}</p>
              <div
                className="report-donut"
                style={{
                  background: `conic-gradient(#ef6f4d 0 ${topEmotionPct}%, rgba(236, 224, 205, 0.78) ${topEmotionPct}% 100%)`,
                }}
              >
                <div>
                  <strong>{topEmotionPct}%</strong>
                  <span>{topMeta?.label ?? "-"}</span>
                </div>
              </div>
              <p className="report-donut-card__caption">{copy.periodSentence[period]} {language === "ko" ? "감정 중 가장 큰 비율이에요." : "emotion share."}</p>
            </article>

            <article className="report-distribution-card report-card-panel">
              <p className="report-panel-title">{copy.distribution}</p>
              <div className="report-distribution-list">
                {sortedEmotions.map(([code, count], index) => {
                  const meta = getEmotionMeta(code, language);
                  const pct = totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0;

                  return (
                    <div key={code} className="report-emotion-row">
                      <span className="report-emotion-row__label">{meta.emoji} {meta.label}</span>
                      <span className="report-emotion-row__bar"><span style={{ width: `${pct}%` }} /></span>
                      <span className="report-emotion-row__count">{count}{language === "ko" ? "회" : "x"} ({pct}%)</span>
                      {index === 0 && <span className="sr-only">top emotion</span>}
                    </div>
                  );
                })}
              </div>
            </article>

            <aside className="report-insight-panel report-card-panel">
              <p className="report-panel-title">💡 {copy.insight}</p>
              <p>{topMeta ? (language === "ko" ? `${copy.periodSentence[period]} 동안 ${topMeta.label} 감정이 가장 자주 보였어요.` : `During ${copy.periodSentence[period]}, ${topMeta.label} appeared most often.`) : copy.noDataDesc}</p>
              <hr />
              <p>{copy.insightBody}</p>
              <button type="button">♥ {copy.cheer}</button>
            </aside>
          </section>

          <section className="report-calendar-card report-card-panel">
            <p className="report-panel-title">{copy.calendar}</p>
            <div className="report-days report-days--calendar">
              {dailyCounts.map((day) => (
                <div key={`${day.date}-${day.weekday}`} className={`report-days__col ${day.isToday ? "report-days__col--today" : ""}`}>
                  <span className="report-days__count">{day.count > 0 ? day.count : ""}</span>
                  <div
                    className={`report-days__bar ${day.count > 0 ? "report-days__bar--filled" : ""}`}
                    style={{ height: `${Math.max((day.count / maxDailyCount) * 62, day.count > 0 ? 10 : 3)}px` }}
                    title={`${day.date} · ${day.count}`}
                  />
                  <span className="report-days__weekday">{day.weekday}</span>
                  <span className="report-days__date">{day.date}</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </main>
  );
}
