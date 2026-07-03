"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import AIInsightBadge from "@/components/AIInsightBadge";
import ReminderTimePicker from "@/components/ReminderTimePicker";
import ReportButton from "@/components/ReportButton";
import SafetyNotice from "@/components/SafetyNotice";
import { EMOTIONS, PERSONAS, WEATHER_OPTIONS, type AiInsight } from "@/types";

interface MemoryReplyViewProps {
  bookId: string;
  bookTitle: string;
  diaryContent: string;
  replyContent: string;
  persona: string;
  selectedEmotions: string[];
  selectedWeather: string | null;
  diaryId: string;
  replyId: string;
  safetyMessage: string;
  riskLevel: string;
  ownerReplyPending: boolean;
  ownerReplyDueAt: string;
  ownerReplyError: string;
  aiInsight: AiInsight | null;
  formatOwnerDueAt: (value: string) => string;
  onRetryReply: () => void;
  onFeedback: (replyId: string, isHelpful: boolean) => Promise<void>;
}

function clippedText(text: string, limit = 220) {
  const normalized = text.trim();
  if (normalized.length <= limit) return normalized;
  return `${normalized.slice(0, limit).trim()}...`;
}

export default function MemoryReplyView({
  bookId,
  bookTitle,
  diaryContent,
  replyContent,
  persona,
  selectedEmotions,
  selectedWeather,
  diaryId,
  replyId,
  safetyMessage,
  riskLevel,
  ownerReplyPending,
  ownerReplyDueAt,
  ownerReplyError,
  aiInsight,
  formatOwnerDueAt,
  onRetryReply,
  onFeedback,
}: MemoryReplyViewProps) {
  const [heartLoading, setHeartLoading] = useState(false);
  const [hearted, setHearted] = useState(false);
  const [heartError, setHeartError] = useState("");

  const personaData = PERSONAS.find((item) => item.code === persona) ?? PERSONAS[0];
  const selectedEmotionItems = selectedEmotions
    .map((code) => EMOTIONS.find((emotion) => emotion.code === code))
    .filter(Boolean);
  const selectedWeatherItem = selectedWeather
    ? WEATHER_OPTIONS.find((weather) => weather.code === selectedWeather)
    : null;

  const handleHeartClick = async () => {
    if (!replyId || heartLoading || hearted) return;

    setHeartLoading(true);
    setHearted(true);
    setHeartError("");

    try {
      await onFeedback(replyId, true);
    } catch {
      setHearted(false);
      setHeartError("하트를 남기지 못했어요. 잠시 후 다시 눌러주세요.");
    } finally {
      setHeartLoading(false);
    }
  };

  return (
    <section className="memory-reply-page animate-fade-in-scale">
      <header className="memory-reply-topbar">
        <Link href={`/books/${bookId}`} className="memory-reply-back" aria-label="일기장으로 돌아가기">
          ← {bookTitle}
        </Link>
      </header>

      <div className="memory-chip-row" aria-label="오늘의 기록 태그">
        {selectedWeatherItem && (
          <span className="memory-chip memory-chip--weather">
            <span aria-hidden>{selectedWeatherItem.emoji}</span>
            {selectedWeatherItem.label}
          </span>
        )}
        {selectedEmotionItems.map((emotion) =>
          emotion ? (
            <span key={emotion.code} className="memory-chip memory-chip--emotion">
              <span aria-hidden>{emotion.emoji}</span>
              {emotion.label}
            </span>
          ) : null
        )}
        <span className="memory-chip memory-chip--persona">
          <Image
            src={personaData.imageSrc}
            alt=""
            width={24}
            height={24}
            className="memory-chip__avatar"
            aria-hidden="true"
          />
          {personaData.name}
        </span>
      </div>

      {safetyMessage && riskLevel === "HIGH" && (
        <div className="memory-safety">
          <SafetyNotice variant="high" />
        </div>
      )}

      <div className="memory-reply-spread">
        <article className="memory-paper memory-paper--diary" aria-label="내 일기">
          <span className="memory-paper__clip" aria-hidden />
          <div className="memory-paper__label">· 내 일기 ✏️</div>
          <p className="memory-diary-lines">{clippedText(diaryContent)}</p>
          <div className="memory-paper__bottom-note">♡ 잘 썼어요</div>
          <div className="memory-stamp" aria-hidden>
            <span>참<br />잘했어요</span>
            <small>- {personaData.name} -</small>
          </div>
        </article>

        <div className="memory-read-bridge" aria-hidden>
          <span>💗</span>
          <strong>읽었어요</strong>
        </div>

        <article className="memory-paper memory-paper--reply" aria-label={`${personaData.name}의 답글`}>
          <div className="memory-reply-badge">
            <Image
              src={personaData.imageSrc}
              alt=""
              width={42}
              height={42}
              aria-hidden="true"
            />
            <span>{personaData.name}의 답글</span>
          </div>

          {replyContent ? (
            <p className="memory-reply-body">{replyContent}</p>
          ) : ownerReplyPending ? (
            <div className="memory-empty-reply">
              <p className="memory-empty-reply__title">참이에게 일기가 전해졌어요 💌</p>
              <p>
                이 답글은 AI가 아니라 운영자가 직접 남겨요.
                <span>도착 예정: {formatOwnerDueAt(ownerReplyDueAt)}</span>
                {ownerReplyError ? <b>{ownerReplyError}</b> : null}
              </p>
            </div>
          ) : (
            <div className="memory-empty-reply">
              <p className="memory-empty-reply__title">일기는 안전하게 저장됐어요.</p>
              <p>답글 생성이 잠시 멈췄어요. 다시 한 번 받아볼 수 있어요.</p>
              <button type="button" onClick={onRetryReply} className="memory-retry-btn">
                답글 다시 받기
              </button>
            </div>
          )}

          {replyId ? (
            <div className="memory-reply-actions">
              <button
                type="button"
                className={hearted ? "memory-heart memory-heart--active" : "memory-heart"}
                onClick={handleHeartClick}
                disabled={heartLoading || hearted}
                aria-pressed={hearted}
                aria-label={hearted ? "마음에 든 답글로 표시됨" : "답글에 하트 남기기"}
              >
                {hearted ? "♥" : "♡"}
              </button>
              {heartError ? <p className="memory-heart-error">{heartError}</p> : null}
            </div>
          ) : null}
        </article>
      </div>

      <AIInsightBadge insight={ownerReplyPending ? null : aiInsight} />

      {replyId && (
        <div className="memory-feedback">
          <ReportButton targetType="REPLY" targetId={replyId} />
        </div>
      )}

      <ReminderTimePicker diaryId={diaryId} />

      <nav className="memory-nav-row" aria-label="답글 이후 이동">
        <Link href={`/books/${bookId}`} className="memory-nav-btn memory-nav-btn--outline">
          📖 일기장으로
        </Link>
        <Link href="/books" className="memory-nav-btn memory-nav-btn--primary">
          📚 책장으로
        </Link>
      </nav>
    </section>
  );
}
