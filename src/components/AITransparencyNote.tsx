export default function AITransparencyNote() {
  return (
    <div
      className="rounded-2xl px-4 py-3 text-xs leading-relaxed"
      style={{
        background: "rgba(255, 248, 236, 0.72)",
        border: "1px solid var(--border-subtle)",
        color: "var(--text-muted)",
      }}
    >
      <p className="font-medium mb-1" style={{ color: "var(--text-secondary)" }}>
        AI 답글 안내
      </p>
      <p>
        답글 생성을 켜면 작성한 일기와 선택한 감정이 외부 AI API로 전송될 수 있어요.
        위험 신호가 감지되면 답글보다 안전 안내를 먼저 보여줍니다.
      </p>
    </div>
  );
}
