import type { Metadata } from "next";
import Link from "next/link";

const SERVICE_NAME = "참 잘했어요";
const CONTACT_EMAIL = "dear.hope.on@gmail.com";
const LAST_UPDATED = "2026년 6월 15일";

export const metadata: Metadata = {
  title: `서비스 이용약관 | ${SERVICE_NAME}`,
  description: `${SERVICE_NAME} 이용 조건과 사용자가 알아야 할 내용을 쉽게 안내합니다.`,
};

const serviceFeatures = [
  "개인 일기를 쓰고 저장하는 기능",
  "내 일기를 책장처럼 모아 보는 기능",
  "감정, 날씨, 태그를 기록하고 돌아보는 기능",
  "사용자가 요청한 경우 AI 답글을 받는 기능",
  "친구와 함께 쓰는 교환일기, 신고, 차단 기능",
];

const userPromises = [
  "다른 사람의 개인정보나 비밀을 허락 없이 올리지 않습니다.",
  "다른 사람을 사칭하거나 거짓 정보를 입력하지 않습니다.",
  "욕설, 괴롭힘, 혐오, 차별, 폭력, 자해 조장 내용을 올리지 않습니다.",
  "서비스를 해킹하거나, 자동 프로그램으로 과도하게 사용하지 않습니다.",
  "다른 사람의 권리와 안전을 해치지 않습니다.",
];

const emergencyContacts = [
  "긴급한 위험: 112 또는 119",
  "자살예방 상담전화: 109",
  "정신건강 위기상담: 1577-0199",
];

export default function TermsPage() {
  return (
    <article className="legal-page legal-page--readable" aria-labelledby="terms-title">
      <header className="legal-hero legal-hero--readable">
        <p className="legal-eyebrow">Terms of Service</p>
        <h1 id="terms-title">서비스 이용약관</h1>
        <p className="legal-lead">
          이 약관은 {SERVICE_NAME}을 이용할 때 <strong>무엇을 할 수 있고</strong>, <strong>무엇을 조심해야 하는지</strong>를 설명합니다.
        </p>
        <p className="legal-plain-note">
          길고 어려운 문장보다, 실제 이용자가 먼저 알아야 할 내용을 쉬운 말로 정리했습니다.
        </p>
        <dl className="legal-summary">
          <div>
            <dt>서비스명</dt>
            <dd>{SERVICE_NAME}</dd>
          </div>
          <div>
            <dt>문의</dt>
            <dd>
              <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            </dd>
          </div>
          <div>
            <dt>최종 수정일</dt>
            <dd>{LAST_UPDATED}</dd>
          </div>
        </dl>
      </header>

      <section className="legal-section legal-section--important" aria-labelledby="terms-at-a-glance">
        <h2 id="terms-at-a-glance">먼저, 이것만은 꼭 알아두세요</h2>
        <div className="legal-big-points" aria-label="서비스 이용약관 핵심 요약">
          <div>
            <strong>내 일기는 기본적으로 내 것입니다.</strong>
            <span>서비스는 저장, 답글 생성, 안전 관리에 필요한 범위에서만 사용합니다.</span>
          </div>
          <div>
            <strong>AI 답글은 참고용입니다.</strong>
            <span>의료, 심리 상담, 법률, 재정 판단을 대신하지 않습니다.</span>
          </div>
          <div>
            <strong>다른 사람을 해치는 사용은 제한될 수 있습니다.</strong>
            <span>괴롭힘, 혐오, 사칭, 해킹, 개인정보 침해는 허용하지 않습니다.</span>
          </div>
          <div>
            <strong>언제든지 탈퇴를 요청할 수 있습니다.</strong>
            <span>탈퇴하면 법에서 보관해야 하는 경우를 제외하고 개인정보와 저장 콘텐츠를 삭제합니다.</span>
          </div>
        </div>
      </section>

      <section className="legal-section" aria-labelledby="terms-purpose">
        <h2 id="terms-purpose">1. 이 약관의 목적</h2>
        <p>
          이 약관은 이용자가 {SERVICE_NAME}을 안전하게 이용할 수 있도록, 서비스 이용 조건과 서로의 책임을 정하기 위한 문서입니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-service">
        <h2 id="terms-service">2. 어떤 서비스를 제공하나요?</h2>
        <p>{SERVICE_NAME}은 마음을 기록하고 돌아볼 수 있도록 아래 기능을 제공할 수 있습니다.</p>
        <ul className="legal-check-list">
          {serviceFeatures.map((feature) => (
            <li key={feature}>{feature}</li>
          ))}
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="terms-signup">
        <h2 id="terms-signup">3. 회원가입과 로그인</h2>
        <p>
          사용자는 Google 로그인, Kakao 로그인 또는 서비스에서 제공하는 인증 방법으로 회원가입하거나 로그인할 수 있습니다.
        </p>
        <p>
          계정은 본인이 안전하게 관리해야 합니다. 내 계정이 허락 없이 사용된 것 같다면 운영팀에 알려 주세요.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-user-duty">
        <h2 id="terms-user-duty">4. 이용자가 지켜야 할 약속</h2>
        <p>모두가 안전하게 이용할 수 있도록 아래 행동은 하지 말아 주세요.</p>
        <ul className="legal-check-list">
          {userPromises.map((promise) => (
            <li key={promise}>{promise}</li>
          ))}
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="terms-content">
        <h2 id="terms-content">5. 내가 쓴 글의 권리</h2>
        <div className="legal-callout">
          <strong>쉽게 말하면</strong>
          <p>내가 쓴 일기와 글은 기본적으로 내 것입니다. 서비스는 기능 제공에 필요한 범위에서만 사용합니다.</p>
        </div>
        <ul className="legal-check-list">
          <li>이용자가 작성한 일기, 확언, 프로필, 문의, 신고 내용의 권리는 원칙적으로 이용자에게 있습니다.</li>
          <li>서비스는 저장, 백업, AI 답글 생성, 안전 필터링, 신고 처리, 오류 대응에 필요한 범위에서만 콘텐츠를 처리합니다.</li>
          <li>공개 또는 공유 기능을 직접 선택하지 않은 글은 이용자 동의 없이 외부에 공개하지 않습니다.</li>
          <li>다른 사람의 개인정보나 권리를 침해하는 글은 작성하지 않아야 합니다.</li>
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="terms-ai">
        <h2 id="terms-ai">6. AI 답글 안내</h2>
        <p>
          AI 답글은 사용자가 쓴 일기와 선택한 감정을 바탕으로 자동 생성되는 문장입니다. 마음을 정리하는 데 도움을 주기 위한 참고용입니다.
        </p>
        <ul className="legal-check-list">
          <li>AI 답글은 틀릴 수 있고, 사용자의 상황을 완전히 알지 못할 수 있습니다.</li>
          <li>AI 답글은 의료 진단, 심리 상담, 법률·재정 자문, 전문 치료를 대신하지 않습니다.</li>
          <li>위험 신호가 감지되면 AI 답글보다 안전 안내가 먼저 표시될 수 있습니다.</li>
        </ul>
        <div className="legal-emergency-box">
          <strong>긴급한 도움이 필요할 때</strong>
          <ul>
            {emergencyContacts.map((contact) => (
              <li key={contact}>{contact}</li>
            ))}
          </ul>
        </div>
      </section>

      <section className="legal-section" aria-labelledby="terms-management">
        <h2 id="terms-management">7. 신고와 이용 제한</h2>
        <p>
          신고가 들어오거나 법령 위반, 권리 침해, 서비스 안전 침해가 의심되는 경우 운영팀은 필요한 범위에서 내용을 확인할 수 있습니다.
        </p>
        <p>
          문제가 확인되면 콘텐츠 삭제, 기능 제한, 계정 이용 제한 등 필요한 조치를 할 수 있습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-change">
        <h2 id="terms-change">8. 서비스 변경 또는 중단</h2>
        <p>
          운영상 또는 기술상 필요한 경우 서비스의 일부가 바뀌거나 잠시 중단될 수 있습니다. 중요한 변경이나 긴 중단이 예상되면 가능한 범위에서 미리 안내합니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-delete">
        <h2 id="terms-delete">9. 탈퇴와 데이터 삭제</h2>
        <p>
          이용자는 언제든지 계정 탈퇴를 요청할 수 있습니다. 탈퇴하면 개인정보와 저장된 콘텐츠는 원칙적으로 삭제됩니다.
        </p>
        <p>
          단, 법에서 일정 기간 보관해야 하는 정보가 있다면 해당 기간 동안 따로 보관한 뒤 삭제합니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-liability">
        <h2 id="terms-liability">10. 책임의 범위</h2>
        <p>
          운영팀은 안정적인 서비스를 제공하기 위해 노력합니다. 다만 천재지변, 통신 장애, 외부 플랫폼 장애, 이용자의 잘못 등 운영팀이 합리적으로 막기 어려운 사유로 생긴 손해는 책임이 제한될 수 있습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-law">
        <h2 id="terms-law">11. 적용되는 법과 분쟁 해결</h2>
        <p>
          이 약관은 대한민국 법령에 따라 해석됩니다. 서비스 이용 중 분쟁이 생기면 먼저 성실히 협의하고, 해결되지 않으면 관계 법령에서 정한 절차를 따릅니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="terms-contact">
        <h2 id="terms-contact">12. 문의</h2>
        <p>
          서비스 이용, 계정, 개인정보, 신고, 약관에 관한 문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> 또는
          <Link href="/support"> 문의하기 페이지</Link>로 보내 주세요.
        </p>
      </section>

      <nav className="legal-bottom-links" aria-label="관련 문서">
        <Link href="/privacy">개인정보처리방침 보기</Link>
        <Link href="/support">문의하기</Link>
      </nav>
    </article>
  );
}
