"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { EMOTIONS } from "@/types";

interface DiaryForReport {
  created_at: string;
  diary_emotions: { emotion_code: string }[];
}

type Period = "7d" | "30d" | "all";

export default function ReportPage() {
  const router = useRouter();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">불러오는 중…</p>
      </div>
    );
  }

  // 기간 필터링
  const now = new Date();
  const filtered = diaries.filter((d) => {
    if (period === "all") return true;
    const days = period === "7d" ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 86400000);
    return new Date(d.created_at) >= cutoff;
  });

  // 감정 집계
  const emotionCounts: Record<string, number> = {};
  let totalEmotions = 0;
  for (const d of filtered) {
    for (const e of d.diary_emotions || []) {
      emotionCounts[e.emotion_code] = (emotionCounts[e.emotion_code] || 0) + 1;
      totalEmotions++;
    }
  }

  const sorted = Object.entries(emotionCounts)
    .sort(([, a], [, b]) => b - a);

  // 일별 기록 수 (최근 14일)
  const dailyCounts: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toDateString();
    const count = diaries.filter((diary) => new Date(diary.created_at).toDateString() === dateStr).length;
    dailyCounts.push({ date: `${d.getMonth() + 1}/${d.getDate()}`, count });
  }
  const maxDaily = Math.max(...dailyCounts.map((d) => d.count), 1);

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.back()} className="text-sm opacity-40 hover:opacity-70">
          ← 뒤로
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>감정 리포트</h1>
        <div className="w-8" />
      </div>

      {/* 기간 선택 */}
      <div className="flex gap-2 mb-6 justify-center">
        {([["7d", "7일"], ["30d", "30일"], ["all", "전체"]] as const).map(([key, label]) => (
          <button
            key={key}
            onClick={() => setPeriod(key)}
            className="text-xs px-4 py-1.5 rounded-full transition-all"
            style={{
              background: period === key ? "var(--soft-accent)" : "var(--card-bg)",
              color: period === key ? "white" : "var(--deep-gray)",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 요약 */}
      <div className="diary-card p-4 mb-4 text-center">
        <p className="text-3xl font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
          {filtered.length}
        </p>
        <p className="text-xs opacity-40">
          {period === "7d" ? "최근 7일" : period === "30d" ? "최근 30일" : "전체"} 기록한 일기
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="diary-card p-6 text-center">
          <p className="text-sm opacity-50">이 기간에 기록한 일기가 없어요.</p>
        </div>
      ) : (
        <>
          {/* 감정 분포 바 차트 */}
          <div className="diary-card p-5 mb-4">
            <p className="text-sm font-medium mb-4 opacity-70">감정 분포</p>
            <div className="space-y-3">
              {sorted.map(([code, count]) => {
                const emotion = EMOTIONS.find((e) => e.code === code);
                const pct = totalEmotions > 0 ? Math.round((count / totalEmotions) * 100) : 0;
                return (
                  <div key={code}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span>
                        {emotion?.emoji} {emotion?.label || code}
                      </span>
                      <span className="opacity-40">{count}회 ({pct}%)</span>
                    </div>
                    <div
                      className="h-2 rounded-full overflow-hidden"
                      style={{ background: "var(--warm-bg-deep)" }}
                    >
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: "var(--soft-accent)",
                          minWidth: pct > 0 ? "4px" : "0",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 일별 기록 히트맵 */}
          <div className="diary-card p-5 mb-4">
            <p className="text-sm font-medium mb-4 opacity-70">최근 2주 기록</p>
            <div className="flex items-end justify-between gap-1" style={{ height: 80 }}>
              {dailyCounts.map((d, i) => (
                <div key={i} className="flex flex-col items-center flex-1">
                  <div
                    className="w-full rounded-t transition-all duration-300"
                    style={{
                      height: `${(d.count / maxDaily) * 60}px`,
                      background: d.count > 0 ? "var(--soft-accent)" : "var(--warm-bg-deep)",
                      minHeight: d.count > 0 ? 4 : 2,
                    }}
                  />
                  <span className="text-xs opacity-30 mt-1" style={{ fontSize: 8 }}>
                    {i % 2 === 0 ? d.date : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 감정 인사이트 */}
          {sorted.length > 0 && (
            <div className="diary-card p-5">
              <p className="text-sm font-medium mb-3 opacity-70">감정 인사이트</p>
              <p className="text-sm leading-relaxed opacity-60">
                {period === "7d" ? "최근 일주일" : period === "30d" ? "최근 한 달" : "지금까지"} 동안
                가장 자주 느낀 감정은{" "}
                <span style={{ color: "var(--deep-gray)" }}>
                  {EMOTIONS.find((e) => e.code === sorted[0][0])?.emoji}{" "}
                  {EMOTIONS.find((e) => e.code === sorted[0][0])?.label}
                </span>
                이에요.
                {sorted.length > 1 && (
                  <>
                    {" "}그 다음은{" "}
                    <span style={{ color: "var(--deep-gray)" }}>
                      {EMOTIONS.find((e) => e.code === sorted[1][0])?.emoji}{" "}
                      {EMOTIONS.find((e) => e.code === sorted[1][0])?.label}
                    </span>
                    이었어요.
                  </>
                )}
              </p>
              <p className="text-xs opacity-40 mt-3">
                어떤 감정이든 느끼는 것 자체가 자연스러운 일이에요.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
