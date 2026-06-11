"use client";

import { EMOTIONS } from "@/types";

interface DiaryStatsProps {
  diaries: {
    created_at: string;
    diary_emotions: { emotion_code: string }[];
  }[];
}

export default function DiaryStats({ diaries }: DiaryStatsProps) {
  if (diaries.length === 0) return null;

  // 감정 빈도 계산
  const emotionCounts: Record<string, number> = {};
  for (const d of diaries) {
    for (const e of d.diary_emotions || []) {
      emotionCounts[e.emotion_code] = (emotionCounts[e.emotion_code] || 0) + 1;
    }
  }

  // 상위 3개 감정
  const topEmotions = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([code, count]) => {
      const emotion = EMOTIONS.find((e) => e.code === code);
      return { code, count, emoji: emotion?.emoji || "?", label: emotion?.label || code };
    });

  const streak = calculateStreak(diaries.map((d) => d.created_at));
  const thisWeekCount = countThisWeek(diaries.map((d) => d.created_at));

  return (
    <div
      className="mb-4 p-4"
      style={{
        borderRadius: "var(--radius-lg)",
        background: "var(--bg-card)",
        border: "1px solid var(--border-subtle)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex items-center justify-between">
        {/* 연속 기록 */}
        <div className="text-center flex-1">
          <p className="text-2xl font-medium" style={{ color: "var(--text-primary)" }}>
            {streak}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>연속 출석</p>
        </div>

        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />

        {/* 이번 주 */}
        <div className="text-center flex-1">
          <p className="text-2xl font-medium" style={{ color: "var(--text-primary)" }}>
            {thisWeekCount}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>이번 주 장수</p>
        </div>

        <div className="w-px h-8" style={{ background: "var(--border-subtle)" }} />

        {/* 자주 느끼는 감정 */}
        <div className="text-center flex-1">
          <p className="text-xl">
            {topEmotions.map((e) => e.emoji).join(" ")}
          </p>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>자주 찍힌 마음</p>
        </div>
      </div>
    </div>
  );
}

function calculateStreak(dates: string[]): number {
  if (dates.length === 0) return 0;
  const uniqueDays = [
    ...new Set(dates.map((d) => new Date(d).toDateString())),
  ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const today = new Date().toDateString();
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  if (uniqueDays[0] !== today && uniqueDays[0] !== yesterday) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDays.length; i++) {
    const prev = new Date(uniqueDays[i - 1]).getTime();
    const curr = new Date(uniqueDays[i]).getTime();
    const diffDays = (prev - curr) / 86400000;
    if (Math.abs(diffDays - 1) < 0.1) { streak++; } else { break; }
  }
  return streak;
}

function countThisWeek(dates: string[]): number {
  const now = new Date();
  const dayOfWeek = now.getDay();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);
  return dates.filter((d) => new Date(d) >= startOfWeek).length;
}
