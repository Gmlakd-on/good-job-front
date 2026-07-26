"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import DiaryListItem from "@/components/DiaryListItem";
import DiaryStats from "@/components/DiaryStats";
import { DiaryListSkeleton } from "@/components/Skeletons";
import { EMOTIONS } from "@/types";
import Link from "next/link";
import { fetchDiaryPage, type DiaryListRow } from "@/lib/api/diaries";

export default function DiariesPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [diaries, setDiaries] = useState<DiaryListRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [emotionFilter, setEmotionFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateKeys, setDateKeys] = useState(() => getRelativeDateKeys());
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/auth");
        return;
      }

      try {
        const page = await fetchDiaryPage({
          limit: 30,
          signal: controller.signal,
        });
        setDiaries(page.diaries);
        setNextCursor(page.nextCursor);
        setHasNextPage(page.hasNextPage);
      } catch (error) {
        if (!controller.signal.aborted) {
          setLoadError(
            error instanceof Error ? error.message : "일기를 불러오지 못했어요.",
          );
        }
      } finally {
        if (!controller.signal.aborted) {
          setDateKeys(getRelativeDateKeys());
          setLoading(false);
        }
      }
    };

    void load();
    return () => controller.abort();
  }, [router]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;

    setLoadingMore(true);
    setLoadError("");
    try {
      const page = await fetchDiaryPage({ cursor: nextCursor, limit: 30 });
      setDiaries((current) => {
        const knownIds = new Set(current.map((diary) => diary.id));
        return [
          ...current,
          ...page.diaries.filter((diary) => !knownIds.has(diary.id)),
        ];
      });
      setNextCursor(page.nextCursor);
      setHasNextPage(page.hasNextPage);
    } catch (error) {
      setLoadError(
        error instanceof Error ? error.message : "일기를 더 불러오지 못했어요.",
      );
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, nextCursor]);

  if (loading) {
    return (
      <div className="pt-4">
        <div className="flex items-center justify-between mb-6">
          <div className="w-8" />
          <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("shelf.title")}</h1>
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
          ← {t("common.back.home")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>
          {t("shelf.title")}
        </h1>
        <Link href="/write" className="text-xl opacity-40 hover:opacity-70" aria-label={t("dl.writeAria")}>
          +
        </Link>
      </div>
      {loadError && (
        <p className="mb-3 text-center text-sm text-[var(--warm-red)]">
          {loadError}
        </p>
      )}
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
            placeholder={t("dl.searchPlaceholder")}
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
            {t("dl.all")}
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
              {searchQuery.trim() ? t("dl.noSearch") : t("dl.noEmotion")}
            </p>
          </div>
        ) : filtered.length === 0 ? (
        <div className="diary-card p-8 text-center">
          <p className="text-sm opacity-50 mb-4">{t("dl.noneYet")}</p>
          <Link
            href="/write"
            className="inline-block px-6 py-2 rounded-full text-sm text-white"
            style={{ background: "var(--soft-accent)" }}
          >
            {t("dl.firstCta")}
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
              const dateLabel = isToday ? t("dl.today") : isYesterday ? t("dl.yesterday") : t("dl.dateMD", { m: date.getMonth() + 1, d: date.getDate() });

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
          {hasNextPage && nextCursor && (
            <div className="mt-5 text-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="min-h-11 rounded-full px-6 text-sm transition-opacity disabled:opacity-50"
                style={{
                  background: "var(--card-bg)",
                  color: "var(--deep-gray)",
                  border: "1px solid rgba(231,199,182,0.3)",
                }}
              >
                {loadingMore ? "불러오는 중…" : "이전 일기 더 보기"}
              </button>
            </div>
          )}
          <div className="text-center mt-6">
            <button
              onClick={() => exportDiaries(diaries)}
              className="text-xs opacity-30 hover:opacity-50 transition-opacity"
            >
              {t("dl.export")}
            </button>
          </div>
        </>
      );
      })()}
    </div>
  );
}

function exportDiaries(diaries: DiaryListRow[]) {
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
