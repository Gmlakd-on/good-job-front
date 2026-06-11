"use client";

import { useEffect, useState, useRef } from "react";
import type { User } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { loadDraft, clearDraft, startDraftTimer } from "@/lib/draftStorage";
import { saveLastBookId, clearLastBookId } from "@/lib/lastBook";
import EmotionSelector from "@/components/EmotionSelector";
import PersonaSelector from "@/components/PersonaSelector";
import ReplyCard from "@/components/ReplyCard";
import FeedbackButtons from "@/components/FeedbackButtons";
import SafetyNotice from "@/components/SafetyNotice";
import ReportButton from "@/components/ReportButton";
import ReminderTimePicker from "@/components/ReminderTimePicker";
import AIInsightBadge from "@/components/AIInsightBadge";
import AITransparencyNote from "@/components/AITransparencyNote";
import ImmersiveEditor from "@/components/editor/ImmersiveEditor";
import BookCover from "@/components/book-ui/BookCover";
import BookProgress from "@/components/book-ui/BookProgress";
import { canWriteBook, type DiaryBook } from "@/components/book-ui/bookTypes";
import { EMOTIONS, type AiInsight } from "@/types";
import LoadingStep from "./_components/LoadingStep";
import SelectedTags from "./_components/SelectedTags";

type Step = "emotion" | "persona" | "write" | "loading" | "reply" | "crisis";

export default function WritePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookId = searchParams.get("bookId");

  const [book, setBook] = useState<DiaryBook | null>(null);
  const [step, setStep] = useState<Step>("emotion");
  const [selectedEmotions, setSelectedEmotions] = useState<string[]>([]);
  const [selectedPersona, setSelectedPersona] = useState("warm_teacher");
  const [diaryContent, setDiaryContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [replyId, setReplyId] = useState("");
  const [diaryId, setDiaryId] = useState("");
  const [safetyMessage, setSafetyMessage] = useState("");
  const [riskLevel, setRiskLevel] = useState("");
  const [aiInsight, setAiInsight] = useState<AiInsight | null>(null);
  const [error, setError] = useState("");
  const [draftRestored, setDraftRestored] = useState(false);
  const [activeBooks, setActiveBooks] = useState<DiaryBook[]>([]);

  // Refs for draft timer access to current state
  const contentRef = useRef(diaryContent);
  const emotionsRef = useRef(selectedEmotions);
  const personaRef = useRef(selectedPersona);

  useEffect(() => { contentRef.current = diaryContent; }, [diaryContent]);
  useEffect(() => { emotionsRef.current = selectedEmotions; }, [selectedEmotions]);
  useEffect(() => { personaRef.current = selectedPersona; }, [selectedPersona]);

  // ── Auth check ──
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      if (!data.user) { router.push("/auth"); return; }
      fetch("/api/profile").then((res) => res.json()).then((data) => {
        if (data.profile?.preferred_persona) setSelectedPersona(data.profile.preferred_persona);
      }).catch(() => {});
      // 일기장 전환 셀렉트용 — 활성 일기장 목록
      fetch("/api/diary-books").then((res) => res.json()).then((data) => {
        const list: DiaryBook[] = (data.books || []).filter((b: DiaryBook) => b.status === "active");
        setActiveBooks(list);
      }).catch(() => {});
    });
  }, [router]);

  // ── Load book ──
  useEffect(() => {
    async function loadBook() {
      if (!bookId) { router.replace("/books"); return; }
      try {
        const res = await fetch(`/api/diary-books/${bookId}`);
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { router.replace("/auth"); return; }
        if (!res.ok || !data.book) { clearLastBookId(); router.replace("/books"); return; }
        setBook(data.book);
        saveLastBookId(data.book.id); // 다음 "쓰기"는 이 일기장으로 바로 진입
      } catch { router.replace("/books"); }
    }
    loadBook();
  }, [bookId, router]);

  // ── Restore draft from localStorage ──
  useEffect(() => {
    if (!bookId || draftRestored) return;
    const draft = loadDraft(bookId);
    if (draft && draft.content.trim()) {
      // Batch updates in microtask to avoid synchronous setState in effect
      queueMicrotask(() => {
        setDiaryContent(draft.content);
        if (draft.emotions.length > 0) setSelectedEmotions(draft.emotions);
        if (draft.persona) setSelectedPersona(draft.persona);
        setDraftRestored(true);
      });
    }
  }, [bookId, draftRestored]);

  // ── Periodic draft save ──
  useEffect(() => {
    if (!bookId || step === "loading" || step === "reply" || step === "crisis") return;
    const stop = startDraftTimer(bookId, () => ({
      content: contentRef.current,
      emotions: emotionsRef.current,
      persona: personaRef.current,
    }));
    return stop;
  }, [bookId, step]);

  // ── Warn before unload ──
  useEffect(() => {
    const hasContent = diaryContent.trim().length > 0;
    const isEditing = step === "write" || step === "emotion";
    if (!hasContent || !isEditing) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [diaryContent, step]);

  // ── Submit handler ──
  async function handleSubmit() {
    if (!book) return;
    if (!canWriteBook(book)) { setError("이 일기장에는 더 이상 작성할 수 없어요."); return; }
    if (selectedEmotions.length === 0) { setError("감정을 하나 이상 선택해주세요."); return; }
    if (diaryContent.trim().length === 0) { setError("일기를 적어주세요."); return; }

    setError("");
    setAiInsight(null);
    setStep("loading");

    try {
      const emotions = selectedEmotions.map((code) => {
        const found = EMOTIONS.find((e) => e.code === code);
        return { code, label: found?.label || code };
      });

      const res = await fetch("/api/diaries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ diary_book_id: book.id, content: diaryContent, emotions, persona: selectedPersona }),
      });
      const data = await res.json();

      if (!res.ok) { setError(data.error || "오류가 발생했어요."); setStep("write"); return; }

      setRiskLevel(data.riskLevel);
      setAiInsight(data.ai || null);
      if (data.diary?.id) setDiaryId(data.diary.id);
      if (data.safetyMessage && data.riskLevel === "CRITICAL") { setSafetyMessage(data.safetyMessage); setStep("crisis"); return; }
      if (data.reply) { setReplyContent(data.reply.content); setReplyId(data.reply.id); }
      if (data.safetyMessage) setSafetyMessage(data.safetyMessage);

      // 제출 성공 → 임시저장 삭제
      if (bookId) clearDraft(bookId);

      // AI 생성 실패 시에도 reply 화면으로 이동 (재시도 버튼 표시)
      if (data.aiGenerationFailed) {
        setReplyContent("");
        setReplyId("");
      }
      setStep("reply");
    } catch { setError("네트워크 오류가 발생했어요."); setStep("write"); }
  }

  // AI 답장 재시도
  async function handleRetryReply() {
    if (!diaryId) return;
    setStep("loading");
    try {
      const res = await fetch(`/api/diaries/${diaryId}/retry-reply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ persona: selectedPersona }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "답글 생성에 실패했어요."); setStep("reply"); return; }
      if (data.reply) { setReplyContent(data.reply.content); setReplyId(data.reply.id); }
      setAiInsight(data.ai || null);
      setStep("reply");
    } catch { setError("네트워크 오류가 발생했어요."); setStep("reply"); }
  }

  async function handleFeedback(targetReplyId: string, isHelpful: boolean) {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply_id: targetReplyId, is_helpful: isHelpful }),
    });
  }

  // ── Book loading ──
  if (!book) return (
    <div className="pt-16 text-center">
      <div className="inline-block animate-chami-bounce" style={{ fontSize: 40 }}>📖</div>
      <p className="mt-3 text-base" style={{ color: "var(--text-muted)" }}>일기장 여는 중…</p>
    </div>
  );

  // ── Book full ──
  if (!canWriteBook(book) && step !== "reply") {
    return (
      <div className="flex flex-col items-center pt-8 text-center">
        <BookCover title={book.title} coverStyleId={book.cover_style_id} coverVariant={book.cover_variant} size="md" />
        <p className="mt-4 text-lg" style={{ color: "var(--text-primary)" }}>
          이 일기장은 더 이상 작성할 수 없어요.
        </p>
        <div className="mt-4 flex gap-3">
          <Link href="/books/new" className="inline-flex font-medium text-sm text-white"
            style={{ padding: "12px 24px", borderRadius: "var(--radius-full)", background: "var(--accent)", boxShadow: "0 4px 12px rgba(201, 123, 90, 0.3)" }}>
            새 일기장 만들기
          </Link>
          <Link href="/books" className="inline-flex font-medium text-sm"
            style={{ padding: "12px 24px", borderRadius: "var(--radius-full)", background: "var(--cream-deep)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
            책장으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={`write-page write-page--${book.cover_style_id}`}>
      <div className="write-page__topbar">
        <Link href={`/books/${book.id}`} className="write-page__back">← {book.title}</Link>
        <div className="flex items-center gap-2">
          {/* 본문 작성 전(emotion/persona)에만 일기장 전환 허용 — 작성 중 전환으로 글이 섞이는 혼란 방지 */}
          {(step === "emotion" || step === "persona") && activeBooks.length > 1 && (
            <select
              className="write-book-switch"
              value={book.id}
              aria-label="일기장 바꾸기"
              onChange={(e) => router.replace(`/write?bookId=${e.target.value}`)}
            >
              {activeBooks.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
          )}
          <BookProgress book={book} />
        </div>
      </div>

      {step === "emotion" && (
        <div className="write-page__step animate-fade-in-scale">
          <h2 className="font-serif text-xl mb-5 font-medium" style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            오늘 어떤 마음이었어요?
          </h2>
          <EmotionSelector selected={selectedEmotions} onChange={setSelectedEmotions} />
          <button onClick={() => { if (selectedEmotions.length === 0) { setError("감정을 하나 이상 선택해주세요."); return; } setError(""); setStep("persona"); }} className="btn-primary w-full mt-5">
            읽어줄 사람 고르기
          </button>
          {error && <p className="mt-3 text-sm text-center" style={{ color: "var(--chami-heart)" }}>{error}</p>}
        </div>
      )}

      {step === "persona" && (
        <div className="write-page__step animate-fade-in-scale">
          <button onClick={() => setStep("emotion")} className="btn-ghost text-sm mb-4 -ml-1">← 감정 다시 고르기</button>
          <SelectedTags emotions={selectedEmotions} />
          <PersonaSelector selected={selectedPersona} onChange={setSelectedPersona} />
          <div className="mt-4"><AITransparencyNote /></div>
          <button onClick={() => setStep("write")} className="btn-primary w-full mt-5">기록 시작</button>
        </div>
      )}

      {step === "write" && (
        <div className="write-page__step write-page__step--editor">
          <div className="write-page__editor-top">
            <button onClick={() => setStep("persona")} className="btn-ghost text-sm">← 뒤로</button>
            <SelectedTags emotions={selectedEmotions} persona={selectedPersona} compact />
          </div>
          <ImmersiveEditor coverStyle={book.cover_style_id} value={diaryContent} onChange={setDiaryContent} onSubmit={handleSubmit} />
          <button onClick={handleSubmit} disabled={diaryContent.trim().length === 0} className="btn-primary w-full mt-4" style={{ opacity: diaryContent.trim().length === 0 ? 0.5 : 1 }}>
            답장 받기
          </button>
          {error && <p className="mt-3 text-sm text-center" style={{ color: "var(--chami-heart)" }}>{error}</p>}
        </div>
      )}

      {step === "loading" && <LoadingStep persona={selectedPersona} />}

      {step === "crisis" && (
        <div className="write-page__step animate-fade-in-scale">
          <SafetyNotice variant="crisis" />
          <Link href="/" className="mt-6 inline-flex font-medium text-sm"
            style={{ padding: "12px 24px", borderRadius: "var(--radius-full)", background: "var(--cream-deep)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
            홈으로
          </Link>
        </div>
      )}

      {step === "reply" && (
        <div className="write-page__step animate-fade-in-scale">
          <SelectedTags emotions={selectedEmotions} persona={selectedPersona} compact />
          <div className="mb-4 p-4" style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", border: "1px solid var(--border-subtle)" }}>
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              {diaryContent.length > 120 ? `${diaryContent.slice(0, 120)}…` : diaryContent}
            </p>
          </div>
          {safetyMessage && riskLevel === "HIGH" && <div className="mb-4"><SafetyNotice variant="high" /></div>}

          {/* AI 답장 성공 */}
          {replyContent && (
            <ReplyCard content={replyContent} animate persona={selectedPersona} />
          )}

          {/* AI 답장 실패 — 재시도 UI */}
          {!replyContent && !safetyMessage && (
            <div className="mb-4 p-5 text-center" style={{ borderRadius: "var(--radius-lg)", background: "var(--cream-deep)", border: "1px solid var(--border-subtle)" }}>
              <p className="text-sm mb-1" style={{ color: "var(--text-primary)" }}>일기는 안전하게 저장되었어요.</p>
              <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>답글 생성에 일시적인 문제가 있었어요.</p>
              <button
                type="button"
                onClick={handleRetryReply}
                className="text-sm font-medium text-white px-5 py-2.5"
                style={{ borderRadius: "var(--radius-full)", background: "var(--accent)", boxShadow: "0 4px 12px rgba(201, 123, 90, 0.3)" }}
              >
                답글 다시 받기
              </button>
            </div>
          )}
          <AIInsightBadge insight={aiInsight} />
          {replyId && (
            <div className="mt-4">
              <FeedbackButtons replyId={replyId} onSubmit={handleFeedback} />
              <div className="mt-2"><ReportButton targetType="REPLY" targetId={replyId} /></div>
            </div>
          )}
          <div className="mt-4"><ReminderTimePicker diaryId={diaryId} /></div>
          <div className="mt-6 flex justify-center gap-3">
            <Link href={`/books/${book.id}`} className="font-medium text-sm"
              style={{ padding: "10px 20px", borderRadius: "var(--radius-full)", background: "var(--cream-deep)", color: "var(--text-primary)", border: "1px solid var(--border-subtle)" }}>
              일기장으로
            </Link>
            <Link href="/books" className="font-medium text-sm text-white"
              style={{ padding: "10px 20px", borderRadius: "var(--radius-full)", background: "var(--accent)", boxShadow: "0 4px 12px rgba(201, 123, 90, 0.3)" }}>
              책장으로
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
