interface AITransparencyNoteProps {
  persona?: string;
}

export default function AITransparencyNote({ persona }: AITransparencyNoteProps) {
  const isOwnerPersona = persona === "operator_voice";

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
        {isOwnerPersona ? "참이 답글 안내" : "AI 답글 안내"}
      </p>
      <p>
        {isOwnerPersona
          ? "참이를 고르면 운영자가 직접 읽고 답글을 남겨요. 보통 하루 뒤까지 도착하도록 관리 대시보드에 요청이 올라갑니다."
          : "답글 생성을 켜면 작성한 일기와 선택한 감정이 Gemini API로 전송될 수 있어요. 위험 신호가 감지되면 답글보다 안전 안내를 먼저 보여줍니다."}
      </p>
    </div>
  );
}
