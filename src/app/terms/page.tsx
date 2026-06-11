export default function TermsPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="font-serif text-2xl mb-6" style={{ color: "var(--text-primary)" }}>이용약관</h1>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <p className="mb-4">참 잘했어요 서비스를 이용해주셔서 감사합니다.</p>
        <p className="mb-4">본 서비스는 일기 기록과 AI 기반 답글 서비스를 제공합니다. 사용자는 본 서비스를 개인적인 감정 기록 목적으로 이용할 수 있습니다.</p>
        <p className="mb-4">AI 답글은 사용자의 일기를 바탕으로 생성된 정서적 응답이며, 의료 진단, 심리 상담, 법률·재정 자문 또는 전문 치료를 대체하지 않습니다.</p>
        <p className="mb-4">위기 상황, 자해 위험, 타해 위험 또는 즉각적인 도움이 필요한 경우에는 가까운 사람, 지역 긴급 도움 기관, 전문 기관에 연락해야 합니다.</p>
        <p className="mb-4">사용자가 작성한 일기 내용은 AI 답글 생성, 안전 필터링, 서비스 제공 목적으로만 사용되며, 공개 게시물로 노출되지 않습니다.</p>
        <p className="mb-4">타인의 개인정보, 불법적인 내용, 권리를 침해하는 내용을 입력해서는 안 됩니다. 신고된 내용은 운영자가 검토할 수 있습니다.</p>
        <p className="mb-4">서비스 운영에 필요한 경우 사전 공지 후 약관이 변경될 수 있습니다.</p>
        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>최종 수정: 2026년</p>
      </div>
    </div>
  );
}
