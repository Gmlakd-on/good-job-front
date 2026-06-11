export default function PrivacyPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <h1 className="font-serif text-2xl mb-6" style={{ color: "var(--text-primary)" }}>개인정보 처리방침</h1>
      <div className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        <h2 className="font-semibold mt-6 mb-2">1. 수집하는 개인정보</h2>
        <p className="mb-4">이메일 주소, 닉네임, 일기 내용, 감정 선택 기록, 답글 피드백, 리마인더 및 서비스 이용 기록을 수집합니다.</p>

        <h2 className="font-semibold mt-6 mb-2">2. 수집 목적</h2>
        <p className="mb-4">계정 관리, 일기 저장, AI 답글 생성, 리마인더 제공, 신고 처리, 서비스 안정성 및 품질 개선을 위해 사용합니다.</p>

        <h2 className="font-semibold mt-6 mb-2">3. AI 답글 처리</h2>
        <p className="mb-4">AI 답글 생성 시 사용자가 작성한 일기 내용과 선택한 감정, 답글 캐릭터 정보가 외부 AI API로 전송될 수 있습니다. 전송되는 정보는 답글 생성을 위한 최소 범위로 제한하며, 서비스 화면에는 답글 처리 방식과 안전 필터 결과를 함께 안내합니다.</p>

        <h2 className="font-semibold mt-6 mb-2">4. 민감 정보와 안전 안내</h2>
        <p className="mb-4">자해·위기 신호가 감지될 경우 AI 답글 대신 안전 안내가 먼저 표시될 수 있습니다. 본 서비스는 의료 서비스, 전문 상담, 위기 개입 기관을 대체하지 않습니다.</p>

        <h2 className="font-semibold mt-6 mb-2">5. 보관 기간</h2>
        <p className="mb-4">회원 탈퇴 시 또는 법령에 의한 보관 기간 종료 시 즉시 파기합니다. 운영상 필요한 보안 로그는 서비스 안정성 확인 목적의 최소 범위로 관리합니다.</p>

        <h2 className="font-semibold mt-6 mb-2">6. 제3자 제공</h2>
        <p className="mb-4">사용자의 개인정보를 판매하거나 공개하지 않습니다. 다만 AI 답글 생성, 인증, 데이터 저장 등 서비스 제공에 필요한 외부 처리 시스템을 사용할 수 있습니다.</p>

        <h2 className="font-semibold mt-6 mb-2">7. 이용자의 권리</h2>
        <p className="mb-4">사용자는 언제든지 자신의 데이터 열람, 수정, 삭제 및 계정 탈퇴를 요청하거나 직접 수행할 수 있습니다.</p>

        <h2 className="font-semibold mt-6 mb-2">8. 문의</h2>
        <p className="mb-4">개인정보 관련 문의는 설정 페이지 또는 support 페이지를 통해 접수할 수 있습니다.</p>
        <p className="mt-8 text-xs" style={{ color: "var(--text-muted)" }}>최종 수정: 2026년</p>
      </div>
    </div>
  );
}
