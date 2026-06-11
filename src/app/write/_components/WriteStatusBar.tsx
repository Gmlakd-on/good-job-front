"use client";

/**
 * 작성 상태바: 자동 저장 시점 + 글자 수.
 * - "쓰다가 날아가면 어쩌지" 불안을 없애는 것이 목적. 저장은 원래 되고 있었지만 보이지 않았다.
 * - 30초마다 상대 시간을 갱신한다 ("방금 저장됨 ✓" → "1분 전 저장됨").
 * - 글자 수는 한도(3,000자)의 90%부터 경고색으로 전환.
 */
import { useEffect, useState } from "react";

const CONTENT_LIMIT = 3000;

function formatSavedAt(savedAt: number | null, now: number): string | null {
  if (!savedAt) return null;
  const diff = now - savedAt;
  if (diff < 8_000) return "방금 저장됨 ✓";
  if (diff < 60_000) return `${Math.floor(diff / 1000)}초 전 저장됨`;
  return `${Math.floor(diff / 60_000)}분 전 저장됨`;
}

export default function WriteStatusBar({
  length,
  lastSavedAt,
}: {
  length: number;
  lastSavedAt: number | null;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(t);
  }, []);

  // 저장 직후엔 즉시 "방금 저장됨"이 보이도록 동기화
  useEffect(() => {
    if (lastSavedAt) setNow(Date.now());
  }, [lastSavedAt]);

  const savedLabel = formatSavedAt(lastSavedAt, now);
  const nearLimit = length >= CONTENT_LIMIT * 0.9;

  return (
    <div className="write-status" aria-live="polite">
      <span className="write-status__saved">
        {savedLabel ?? (length > 0 ? "자동 저장 대기 중…" : "\u00A0")}
      </span>
      <span
        className={`write-status__count ${nearLimit ? "write-status__count--warn" : ""}`}
      >
        {length.toLocaleString()} / {CONTENT_LIMIT.toLocaleString()}자
      </span>
    </div>
  );
}
