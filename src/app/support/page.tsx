const CRISIS_CONTACTS = [
  { label: "자살예방상담전화", value: "109", note: "전화 및 문자 상담" },
] as const;

export default function SupportPage() {
  return (
    <div className="support-page">
      <section className="support-page__card" aria-labelledby="support-title">
        <p className="support-page__eyebrow">도움말</p>
        <h1 id="support-title">도움이 필요하신가요?</h1>
        <p className="support-page__lead">
          서비스 이용 중 문제가 있거나 궁금한 점이 있다면 언제든 연락해주세요.
        </p>

        <div className="support-page__contact">
          <p>
            <strong>이메일:</strong> <a href="mailto:dear.hope.on@gmail.com">dear.hope.on@gmail.com</a>
          </p>
          <p>
            <strong>응답 시간:</strong> 보통 1~2영업일 이내
          </p>
        </div>

        <div className="support-page__crisis" role="note">
          <p className="support-page__crisis-title">
            위기 상황에서는 이 서비스가 아닌 전문 상담 기관에 즉시 연락해주세요.
          </p>
          <ul>
            {CRISIS_CONTACTS.map((contact) => (
              <li key={contact.value}>
                <span>{contact.label}</span>
                <strong>{contact.value}</strong>
                <em>{contact.note}</em>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}
