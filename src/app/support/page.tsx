export default function SupportPage() {
  return (
    <div className="max-w-2xl mx-auto py-12 px-4 text-center">
      <h1 className="font-serif text-2xl mb-4" style={{ color: "var(--text-primary)" }}>도움이 필요하신가요?</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-secondary)" }}>
        서비스 이용 중 문제가 있거나 궁금한 점이 있다면 언제든 연락해주세요.
      </p>
      <div className="diary-card p-6 text-left">
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold">이메일:</span> support@chamjal.com
        </p>
        <p className="text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
          <span className="font-semibold">응답 시간:</span> 보통 1~2영업일 이내
        </p>
        <p className="text-xs mt-6" style={{ color: "var(--text-muted)" }}>
          위기 상황에서는 이 서비스가 아닌 전문 상담 기관에 즉시 연락해주세요.
        </p>
      </div>
    </div>
  );
}
