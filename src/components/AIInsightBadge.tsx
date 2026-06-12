import type { AiInsight } from "@/types";

const CARE_MODE_LABELS: Record<string, string> = {
  companionship: "곁에 머물기",
  side_with_user: "먼저 편들기",
  organize: "상황 정리",
  advice: "선택지 제안",
  self_blame_relief: "자기비난 덜기",
  safety_check: "안전 확인",
  warm_confrontation: "따뜻한 직면",
  clarify: "조심스럽게 묻기",
};

function labelCareMode(value?: string) {
  if (!value) return null;
  return CARE_MODE_LABELS[value] || value;
}

function labelProvider(insight: AiInsight) {
  if (insight.provider === "fallback" || insight.model === "fallback") {
    return "기본 답장 모드";
  }
  if (insight.provider === "gemini") {
    return "Gemini 답장 모드";
  }
  return "AI 답장 모드";
}

export default function AIInsightBadge({ insight }: { insight?: AiInsight | null }) {
  if (!insight) return null;

  const careMode = labelCareMode(insight.primaryCareMode);
  const tone = insight.emotionWeight ? `감정 무게: ${insight.emotionWeight}` : null;
  const moderation = insight.moderationStatus === "BLOCKED" ? "안전 필터로 대체됨" : "안전 필터 통과";

  return (
    <div
      className="mt-3 rounded-2xl px-4 py-3 text-xs leading-relaxed"
      style={{
        background: "var(--cream-deep)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
      }}
      aria-label="AI 답장 처리 정보"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium" style={{ color: "var(--text-secondary)" }}>
          {labelProvider(insight)}
        </span>
        {careMode && <span>· 돌봄 방식: {careMode}</span>}
        {tone && <span>· {tone}</span>}
        <span>· {moderation}</span>
      </div>
      <p className="mt-1 opacity-70">
        답글은 의료·상담 판단이 아니라 일기 내용을 바탕으로 만든 정서적 응답이에요.
      </p>
    </div>
  );
}
