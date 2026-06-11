"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import DiaryListItem from "@/components/DiaryListItem";
import DiaryStats from "@/components/DiaryStats";
import { DiaryListSkeleton } from "@/components/Skeletons";
import { EMOTIONS } from "@/types";
import Link from "next/link";

interface DiaryRow {
  id: string;
  content: string;
  status: string;
  created_at: string;
  diary_emotions: { emotion_code: string }[];
  replies: { id: string; persona?: string; content?: string }[];
}

export default function DiariesPage() {
  const router = useRouter();
  const [diaries, setDiaries] = useState<DiaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateKeys, setDateKeys] = useState(() => getRelativeDateKeys());

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
      setDateKeys(getRelativeDateKeys());
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="w-8" />
          <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>내 일기장</h1>
          <div className="w-8" />
        </div>
        <DiaryListSkeleton count={4} />
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="flex items-center justify-between mb-4">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← 홈
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>
          내 일기장
        </h1>
        <Link href="/write" className="text-xl opacity-40 hover:opacity-70" aria-label="새 일기 쓰기">
          +
        </Link>
      </div>
      {diaries.length > 0 && (
        <DiaryStats diaries={diaries} />
      )}

      {/* 검색 */}
      {diaries.length > 3 && (
        <div className="mb-3">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="책상 서랍 속 일기 검색…"
            className="w-full px-4 py-2.5 rounded-xl text-sm outline-none"
            style={{ background: "var(--card-bg)", color: "var(--deep-gray)", border: "1px solid rgba(231,199,182,0.2)" }}
          />
        </div>
      )}

      {/* 감정 필터 */}
      {diaries.length > 0 && (
        <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
          <button
            onClick={() => setEmotionFilter(null)}
            className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0"
            style={{
              background: emotionFilter === null ? "var(--soft-accent)" : "var(--card-bg)",
              color: emotionFilter === null ? "white" : "var(--deep-gray)",
            }}
          >
            전체
          </button>
          {EMOTIONS.map((e) => {
            const hasAny = diaries.some((d) =>
              d.diary_emotions?.some((de) => de.emotion_code === e.code)
            );
            if (!hasAny) return null;
            return (
              <button
                key={e.code}
                onClick={() => setEmotionFilter(emotionFilter === e.code ? null : e.code)}
                className="text-xs px-3 py-1.5 rounded-full whitespace-nowrap transition-all flex-shrink-0"
                style={{
                  background: emotionFilter === e.code ? "var(--soft-accent)" : "var(--card-bg)",
                  color: emotionFilter === e.code ? "white" : "var(--deep-gray)",
                }}
              >
                {e.emoji} {e.label}
              </button>
            );
          })}
        </div>
      )}

      {(() => {
        let filtered = diaries;

        if (emotionFilter) {
          filtered = filtered.filter((d) =>
            d.diary_emotions?.some((e) => e.emotion_code === emotionFilter)
          );
        }

        if (searchQuery.trim()) {
          const q = searchQuery.trim().toLowerCase();
          filtered = filtered.filter((d) => d.content.toLowerCase().includes(q));
        }

        return filtered.length === 0 && diaries.length > 0 ? (
          <div className="diary-card p-6 text-center">
            <p className="text-sm opacity-50">
              {searchQuery.trim() ? "검색 결과가 없어요." : "이 감정의 일기가 아직 없어요."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
        <div className="diary-card p-8 text-center">
          <p className="text-sm opacity-50 mb-4">아직 적은 일기가 없어요.</p>
          <Link
            href="/write"
            className="inline-block px-6 py-2 rounded-full text-sm text-white"
            style={{ background: "var(--soft-accent)" }}
          >
            첫 일기 쓰기
          </Link>
        </div>
      ) : (
        <>
          <div>
            {filtered.map((d, idx) => {
              const dateKey = new Date(d.created_at).toDateString();
              const prevDateKey = idx > 0 ? new Date(filtered[idx - 1].created_at).toDateString() : null;
              const showDateHeader = dateKey !== prevDateKey;
              const date = new Date(d.created_at);
              const isToday = dateKey === dateKeys.today;
              const isYesterday = dateKey === dateKeys.yesterday;
              const dateLabel = isToday ? "오늘" : isYesterday ? "어제" : `${date.getMonth() + 1}월 ${date.getDate()}일`;

              return (
                <div key={d.id}>
                  {showDateHeader && (
                    <p className="text-xs opacity-30 mt-4 mb-2 px-1">{dateLabel}</p>
                  )}
                  <DiaryListItem
                    id={d.id}
                    content={d.content}
                    emotionCodes={d.diary_emotions?.map((e) => e.emotion_code) || []}
                    hasReply={d.replies?.length > 0}
                    replyPersona={d.replies?.[0]?.persona}
                    createdAt={d.created_at}
                  />
                </div>
              );
            })}
          </div>
          <div className="text-center mt-6">
            <button
              onClick={() => exportDiaries(diaries)}
              className="text-xs opacity-30 hover:opacity-50 transition-opacity"
            >
              내 일기장 텍스트로 내보내기
            </button>
          </div>
        </>
      );
      })()}
    </div>
  );
}

function exportDiaries(diaries: DiaryRow[]) {
  const lines = diaries.map((d) => {
    const date = new Date(d.created_at);
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    const emotions = d.diary_emotions?.map((e) => e.emotion_code).join(", ") || "";
    return `--- ${dateStr} [${emotions}] ---\n${d.content}\n`;
  });

  const text = `참 잘했어요 — 내 일기장\n내보낸 날짜: ${new Date().toLocaleDateString("ko-KR")}\n총 ${diaries.length}개\n\n${lines.join("\n")}`;

  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `참잘했어요_일기_${new Date().toISOString().slice(0, 10)}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}


function getRelativeDateKeys() {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return {
    today: today.toDateString(),
    yesterday: yesterday.toDateString(),
  };
}
