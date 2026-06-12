"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatFullDate } from "@/lib/date";
import { EMOTIONS, PERSONAS, WEATHER_OPTIONS } from "@/types";

interface BookReaderEmotion {
  emotion_code?: string;
  emotion_label: string;
}

interface BookReaderReply {
  content?: string;
  persona?: string;
}

export interface BookReaderEntry {
  id: string;
  content: string;
  created_at: string;
  weather_code?: string | null;
  weather_label?: string | null;
  diary_emotions?: BookReaderEmotion[];
  replies?: BookReaderReply[];
}

interface BookReaderProps {
  entries: BookReaderEntry[];
}

function getEmotionLabel(emotion: BookReaderEmotion): string {
  const found = EMOTIONS.find((item) => item.code === emotion.emotion_code);
  return `${found?.emoji ? `${found.emoji} ` : ""}${emotion.emotion_label}`;
}

function getPersonaLabel(personaCode?: string): string {
  const persona = PERSONAS.find((item) => item.code === personaCode);
  return persona?.name || "답장";
}

function getWeatherLabel(weatherCode?: string | null, weatherLabel?: string | null): string | null {
  if (!weatherCode && !weatherLabel) return null;
  const found = WEATHER_OPTIONS.find((item) => item.code === weatherCode);
  const label = found?.label || weatherLabel;
  if (!label) return null;
  return `${found?.emoji ? `${found.emoji} ` : ""}${label}`;
}

export default function BookReader({ entries }: BookReaderProps) {
  const pages = useMemo(
    () => [...entries].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
    [entries],
  );
  const [pageIndex, setPageIndex] = useState(0);

  const entry = pages[pageIndex];
  const reply = entry?.replies?.[0];
  const weatherLabel = getWeatherLabel(entry?.weather_code, entry?.weather_label);
  const hasPrevious = pageIndex > 0;
  const hasNext = pageIndex < pages.length - 1;

  if (!entry) {
    return (
      <div className="book-reader__empty">
        <p>아직 넘겨볼 기록이 없어요.<br />첫 장을 써두면 여기에 책처럼 펼쳐져요.</p>
      </div>
    );
  }

  return (
    <div className="book-reader" aria-live="polite">
      <div className="book-reader__frame" key={entry.id}>
        <article className="book-reader__page book-reader__page--diary">
          <div className="book-reader__meta">
            <span className="book-reader__label">오늘의 기록</span>
            <time>{formatFullDate(entry.created_at)}</time>
          </div>

          {(weatherLabel || (entry.diary_emotions && entry.diary_emotions.length > 0)) && (
            <div className="book-reader__emotion-row" aria-label="선택한 날씨와 감정">
              {weatherLabel && (
                <span className="book-reader__emotion book-reader__emotion--weather">
                  {weatherLabel}
                </span>
              )}
              {entry.diary_emotions?.map((emotion) => (
                <span key={`${entry.id}-${emotion.emotion_code || emotion.emotion_label}`} className="book-reader__emotion">
                  {getEmotionLabel(emotion)}
                </span>
              ))}
            </div>
          )}

          <p className="book-reader__content">{entry.content}</p>
          <Link href={`/diary/${entry.id}`} className="book-reader__open-link">이 기록 자세히 보기</Link>
        </article>

        <aside className="book-reader__page book-reader__page--reply">
          <div className="book-reader__meta book-reader__meta--persona">
            <span className="book-reader__persona-name">{getPersonaLabel(reply?.persona)}</span>
          </div>

          {reply?.content ? (
            <p className="book-reader__reply">{reply.content}</p>
          ) : (
            <p className="book-reader__reply opacity-50">아직 답장이 없어요.</p>
          )}
        </aside>
      </div>

      <div className="book-reader__controls">
        <button
          type="button"
          className="book-reader__button"
          disabled={!hasPrevious}
          onClick={() => setPageIndex((current) => Math.max(0, current - 1))}
        >
          ← 이전 장
        </button>
        <span className="book-reader__counter">{pageIndex + 1} / {pages.length}</span>
        <button
          type="button"
          className="book-reader__button"
          disabled={!hasNext}
          onClick={() => setPageIndex((current) => Math.min(pages.length - 1, current + 1))}
        >
          다음 장 →
        </button>
      </div>
    </div>
  );
}
