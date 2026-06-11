"use client";

import { useState } from "react";

interface ReportButtonProps {
  targetType: "DIARY" | "REPLY";
  targetId: string;
}

export default function ReportButton({ targetType, targetId }: ReportButtonProps) {
  const [showForm, setShowForm] = useState(false);
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason: reason.trim(),
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      }
    } catch {
      // 조용히 실패 처리
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <p className="text-xs text-center opacity-40 py-2 animate-fade-in-up">
        알려주셔서 감사해요. 확인 후 개선할게요.
      </p>
    );
  }

  if (!showForm) {
    return (
      <button
        onClick={() => setShowForm(true)}
        className="text-xs opacity-30 hover:opacity-50 transition-opacity block mx-auto"
      >
        이 답글이 불편했어요
      </button>
    );
  }

  return (
    <div className="animate-fade-in-up mt-2">
      <div
        className="rounded-xl p-4"
        style={{ background: "var(--warm-bg-deep)" }}
      >
        <p className="text-xs opacity-60 mb-2">어떤 부분이 불편했나요?</p>
        <div className="flex flex-wrap gap-2 mb-3">
          {["진단/판정 표현", "무례한 표현", "부적절한 조언", "기타"].map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className="text-xs px-3 py-1.5 rounded-full transition-all"
              style={{
                background: reason === r ? "var(--soft-accent)" : "var(--card-bg)",
                color: reason === r ? "white" : "var(--deep-gray)",
              }}
            >
              {r}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSubmit}
            disabled={!reason || loading}
            className="text-xs px-4 py-1.5 rounded-full text-white transition-opacity"
            style={{
              background: "var(--warm-red)",
              opacity: !reason || loading ? 0.4 : 1,
            }}
          >
            {loading ? "전송 중…" : "전송"}
          </button>
          <button
            onClick={() => { setShowForm(false); setReason(""); }}
            className="text-xs px-4 py-1.5 rounded-full opacity-50 hover:opacity-70"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  );
}
