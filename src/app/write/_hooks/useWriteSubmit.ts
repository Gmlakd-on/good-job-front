"use client";

import { useState, useCallback } from "react";
import { clearDraft } from "@/lib/draftStorage";

interface SubmitResult {
  diary?: { id: string };
  reply?: { id: string; content: string };
  ai?: Record<string, unknown>;
  riskLevel?: string;
  safetyMessage?: string;
  aiGenerationFailed?: boolean;
}

export function useWriteSubmit(bookId: string | null) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const submitDiary = useCallback(
    async (params: {
      content: string;
      emotions: Array<{ code: string; label: string }>;
      persona: string;
    }): Promise<SubmitResult | null> => {
      setSubmitting(true);
      setError("");

      try {
        const res = await fetch("/api/diaries", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diary_book_id: bookId,
            content: params.content,
            emotions: params.emotions,
            persona: params.persona,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "오류가 발생했어요.");
          return null;
        }

        // Clear draft on success
        if (bookId) clearDraft(bookId);

        return data;
      } catch {
        setError("네트워크 오류가 발생했어요.");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    [bookId]
  );

  const retryReply = useCallback(
    async (diaryId: string, persona: string): Promise<SubmitResult | null> => {
      setSubmitting(true);
      setError("");

      try {
        const res = await fetch(`/api/diaries/${diaryId}/retry-reply`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ persona }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "답글 생성에 실패했어요.");
          return null;
        }

        return data;
      } catch {
        setError("네트워크 오류가 발생했어요.");
        return null;
      } finally {
        setSubmitting(false);
      }
    },
    []
  );

  return { submitDiary, retryReply, submitting, error, setError };
}
