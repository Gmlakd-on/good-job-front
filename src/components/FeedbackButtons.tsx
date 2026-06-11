"use client";

import { useState } from "react";

interface FeedbackButtonsProps {
  replyId: string;
  onSubmit: (replyId: string, isHelpful: boolean) => Promise<void>;
}

export default function FeedbackButtons({ replyId, onSubmit }: FeedbackButtonsProps) {
  const [submitted, setSubmitted] = useState(false);
  const [choice, setChoice] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClick = async (isHelpful: boolean) => {
    setLoading(true);
    setChoice(isHelpful);
    try {
      await onSubmit(replyId, isHelpful);
      setSubmitted(true);
    } catch {
      setChoice(null);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-4 animate-fade-in-scale">
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {choice ? "확인 도장을 찍었어요" : "다음엔 더 나은 답글을 남길게요"}
        </p>
      </div>
    );
  }

  return (
    <div className="text-center py-4">
      <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
        이 답글이 어땠나요?
      </p>
      <div className="flex gap-2 justify-center">
        <button
          type="button"
          onClick={() => handleClick(true)}
          disabled={loading}
          className="text-sm font-medium transition-all"
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-xs)",
            background: "var(--cloth-sage)",
            color: "white",
            border: "none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          도움이 됐어요
        </button>
        <button
          type="button"
          onClick={() => handleClick(false)}
          disabled={loading}
          className="text-sm font-medium transition-all"
          style={{
            padding: "10px 20px",
            borderRadius: "var(--radius-xs)",
            background: "transparent",
            color: "var(--text-secondary)",
            border: "1px solid var(--border-subtle)",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.5 : 1,
          }}
        >
          아쉬웠어요
        </button>
      </div>
    </div>
  );
}
