"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import ReplyCard from "@/components/ReplyCard";
import FeedbackButtons from "@/components/FeedbackButtons";
import SafetyNotice from "@/components/SafetyNotice";
import ReportButton from "@/components/ReportButton";
import { DiaryDetailSkeleton } from "@/components/Skeletons";
import ConfirmDialog from "@/components/ConfirmDialog";
import AIInsightBadge from "@/components/AIInsightBadge";
import { useToast } from "@/components/Toast";
import { formatFullDate } from "@/lib/date";
import { EMOTIONS, PERSONAS, WEATHER_OPTIONS, type AiInsight } from "@/types";

interface DiaryDetail {
  id: string;
  content: string;
  status: string;
  risk_level: string;
  weather_code?: string | null;
  weather_label?: string | null;
  created_at: string;
  diary_emotions: { emotion_code: string; emotion_label: string }[];
  replies: { id: string; content: string; persona: string; risk_level: string }[];
  ai_insight?: AiInsight | null;
}

export default function DiaryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useI18n();
  const { showToast } = useToast();
  const [diary, setDiary] = useState<DiaryDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch(`/api/diaries/${id}`);
      if (res.ok) {
        const data = await res.json();
        setDiary(data.diary);
      }
      setLoading(false);
    };
    load();
  }, [id, router]);

  const handleFeedback = async (replyId: string, isHelpful: boolean) => {
    await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply_id: replyId, is_helpful: isHelpful }),
    });
  };

  const handleDelete = async () => {
    setDeleting(true);
    const res = await fetch(`/api/diaries/${id}`, { method: "DELETE" });
    if (res.ok) {
      showToast(t("dd.deleted"), "info");
      router.push("/diaries");
    } else {
      showToast(t("dd.deleteFail"), "error");
    }
    setDeleting(false);
  };

  const handleStartEdit = () => {
    if (diary) {
      setEditContent(diary.content);
      setEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!editContent.trim()) return;
    setSaving(true);
    const res = await fetch(`/api/diaries/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: editContent.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setDiary((prev) => prev ? { ...prev, content: data.diary.content } : prev);
      setEditing(false);
      showToast(t("dd.edited"), "success");
    } else {
      const data = await res.json();
      showToast(data.error || t("dd.editFail"), "error");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="pt-2">
        <button className="text-sm opacity-40 mb-6">← {t("common.toBook")}</button>
        <DiaryDetailSkeleton />
      </div>
    );
  }

  if (!diary) {
    return (
      <div className="pt-4 text-center">
        <p className="opacity-50">{t("dd.notFound")}</p>
        <button onClick={() => router.push("/diaries")} className="mt-4 text-sm opacity-50 hover:opacity-80">
          ← {t("common.toBook")}
        </button>
      </div>
    );
  }

  const dateStr = formatFullDate(diary.created_at);
  const reply = diary.replies?.[0];
  const weather = diary.weather_code
    ? WEATHER_OPTIONS.find((item) => item.code === diary.weather_code)
    : null;
  const weatherLabel = weather?.label || diary.weather_label;

  return (
    <div className="pt-2">
      <button
        onClick={() => router.push("/diaries")}
        className="text-sm opacity-40 mb-6 hover:opacity-70"
      >
        ← {t("common.toBook")}
      </button>

      {/* 감정 태그 */}
      <div className="flex gap-2 mb-3 flex-wrap">
        {weatherLabel && (
          <span className="text-sm px-3 py-1 rounded-full text-white" style={{ background: "var(--cloth-indigo)" }}>
            {weather?.emoji} {weatherLabel}
          </span>
        )}
        {diary.diary_emotions?.map((e) => {
          const found = EMOTIONS.find((em) => em.code === e.emotion_code);
          return (
            <span key={e.emotion_code} className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--warm-highlight)" }}>
              {found?.emoji} {e.emotion_label}
            </span>
          );
        })}
        {reply && (
          <span className="text-sm px-3 py-1 rounded-full" style={{ background: "var(--warm-blue)", color: "white" }}>
            {PERSONAS.find((p) => p.code === reply.persona)?.emoji}{" "}
            {PERSONAS.find((p) => p.code === reply.persona)?.name || reply.persona}
          </span>
        )}
      </div>

      {/* 일기 본문 */}
      <div className="diary-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs opacity-40">{dateStr}</p>
          <div className="flex gap-3">
            {/* 답글이 오기 전까지만 수정 가능 */}
            {diary.status === "SUBMITTED" && !editing && (
              <button
                onClick={handleStartEdit}
                className="text-xs opacity-30 hover:opacity-50 transition-opacity"
              >
                {t("dd.edit")}
              </button>
            )}
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs opacity-30 hover:opacity-50 transition-opacity"
            >
              {t("dd.delete")}
            </button>
          </div>
        </div>

        {editing ? (
          <div>
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="diary-lines w-full min-h-[150px] bg-transparent resize-none outline-none text-base leading-8"
              style={{ color: "var(--deep-gray)" }}
              maxLength={3000}
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs opacity-40">{editContent.length} / 3000</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setEditing(false)}
                  className="text-xs px-4 py-1.5 rounded-full"
                  style={{ background: "var(--warm-bg-deep)" }}
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={saving || !editContent.trim()}
                  className="text-xs px-4 py-1.5 rounded-full text-white"
                  style={{ background: "var(--soft-accent)", opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? t("dd.saving") : t("dd.save")}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="text-base leading-8 whitespace-pre-line" style={{ color: "var(--deep-gray)" }}>
            {diary.content}
          </p>
        )}
      </div>

      {/* 삭제 확인 */}
      <ConfirmDialog
        open={showDeleteConfirm}
        title={t("dd.confirmTitle")}
        message={t("dd.confirmMsg")}
        confirmLabel={t("dd.confirmYes")}
        cancelLabel={t("common.cancel")}
        danger
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteConfirm(false)}
      />

      {/* HIGH 안내 */}
      {diary.risk_level === "HIGH" && (
        <div className="mb-4">
          <SafetyNotice variant="high" />
        </div>
      )}

      {/* CRITICAL 안내 */}
      {diary.risk_level === "CRITICAL" && (
        <div className="mb-4">
          <SafetyNotice variant="crisis" />
        </div>
      )}

      {/* 답글 */}
      {reply && (
        <>
          <ReplyCard
            content={reply.content}
            persona={reply.persona}
          />
          <AIInsightBadge insight={diary.ai_insight} />
          <div className="mt-4">
            <FeedbackButtons replyId={reply.id} onSubmit={handleFeedback} />
          </div>
          <div className="mt-2">
            <ReportButton targetType="REPLY" targetId={reply.id} />
          </div>
        </>
      )}
    </div>
  );
}
