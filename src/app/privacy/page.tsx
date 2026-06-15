import type { Metadata } from "next";
import Link from "next/link";

const SERVICE_NAME = "참 잘했어요";
const CONTACT_EMAIL = "dear.hope.on@gmail.com";
const LAST_UPDATED = "2026년 6월 15일";

export const metadata: Metadata = {
  title: `개인정보처리방침 | ${SERVICE_NAME}`,
  description: `${SERVICE_NAME}이 어떤 개인정보를 왜 쓰고, 언제 지우는지 쉽게 안내합니다.`,
};

const simpleCollectionCards = [
  {
    title: "로그인할 때",
    data: "이메일, 이름 또는 닉네임, 프로필 사진",
    reason: "내 계정인지 확인하고 로그인 상태를 유지하기 위해 사용합니다.",
  },
  {
    title: "일기를 쓸 때",
    data: "일기 글, 감정, 날씨, 태그, 책장 설정",
    reason: "쓴 글을 저장하고, 나중에 다시 볼 수 있게 하기 위해 사용합니다.",
  },
  {
    title: "AI 답글을 받을 때",
    data: "일기 내용, 선택한 감정, 답글 캐릭터 설정",
    reason: "일기에 맞는 따뜻한 답글을 만들기 위해 사용합니다.",
  },
  {
    title: "서비스를 안전하게 지킬 때",
    data: "접속 시간, IP 주소, 기기·브라우저 정보, 오류 기록",
    reason: "오류를 고치고, 부정 이용이나 해킹 시도를 막기 위해 사용합니다.",
  },
  {
    title: "문의를 보낼 때",
    data: "이메일 주소, 문의 내용, 신고 내용",
    reason: "답변을 보내고 문제를 처리하기 위해 사용합니다.",
  },
];

const retentionItems = [
  "회원 정보는 회원 탈퇴 때 삭제합니다.",
  "일기와 책장 정보는 사용자가 직접 지우거나 탈퇴하면 삭제합니다.",
  "오류·보안 기록은 서비스 보호에 필요한 최소 기간만 보관합니다.",
  "법에서 꼭 보관하라고 정한 정보가 있으면, 그 기간 동안만 따로 보관한 뒤 삭제합니다.",
];

const externalServices = [
  { name: "Supabase", work: "로그인, 데이터베이스, 파일 저장, 계정 관리" },
  { name: "Google", work: "Google 로그인, 이메일 확인, 기본 프로필 확인, Gemini API를 사용하는 경우 AI 답글 생성" },
  { name: "Kakao", work: "Kakao 로그인을 제공하는 경우 로그인 인증" },
  { name: "Vercel", work: "웹사이트 배포, 접속 요청 처리, 호스팅" },
  { name: "Upstash", work: "사용하는 경우 속도 제한, 보안, 장애 대응 기록 처리" },
];

const userRights = [
  "내 정보를 보여 달라고 요청할 수 있습니다.",
  "잘못된 정보를 고쳐 달라고 요청할 수 있습니다.",
  "내 정보를 지워 달라고 요청할 수 있습니다.",
  "정보 사용을 멈춰 달라고 요청할 수 있습니다.",
  "동의를 철회하거나 회원 탈퇴를 요청할 수 있습니다.",
];

export default function PrivacyPage() {
  return (
    <article className="legal-page legal-page--readable" aria-labelledby="privacy-title">
      <header className="legal-hero legal-hero--readable">
        <p className="legal-eyebrow">Privacy Policy</p>
        <h1 id="privacy-title">개인정보처리방침</h1>
        <p className="legal-lead">
          이 문서는 {SERVICE_NAME}이 <strong>어떤 정보를 가져가는지</strong>, <strong>왜 쓰는지</strong>,
          <strong> 언제 지우는지</strong>를 쉽게 설명합니다.
        </p>
        <p className="legal-plain-note">
          어려운 법률 표현보다, 실제 이용자가 바로 이해할 수 있는 말을 먼저 적었습니다. 자세한 내용은 아래 항목에서 확인할 수 있습니다.
        </p>
        <dl className="legal-summary">
          <div>
            <dt>서비스명</dt>
            <dd>{SERVICE_NAME}</dd>
          </div>
          <div>
            <dt>개인정보 문의</dt>
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

      <section className="legal-section legal-section--important" aria-labelledby="privacy-at-a-glance">
        <h2 id="privacy-at-a-glance">먼저, 이것만은 꼭 알아두세요</h2>
        <div className="legal-big-points" aria-label="개인정보 처리 핵심 요약">
          <div>
            <strong>일기를 저장하려면 글 내용이 저장됩니다.</strong>
            <span>그래야 내가 쓴 일기를 다시 볼 수 있습니다.</span>
          </div>
          <div>
            <strong>AI 답글을 요청하면 일기 내용이 AI 처리에 사용될 수 있습니다.</strong>
            <span>답글을 만들기 위한 용도이며, 의료·상담·법률 판단을 대신하지 않습니다.</span>
          </div>
          <div>
            <strong>광고 판매 목적으로 개인정보를 팔지 않습니다.</strong>
            <span>사용자 동의 없이 개인정보를 제3자에게 넘기지 않습니다.</span>
          </div>
          <div>
            <strong>탈퇴하면 원칙적으로 삭제합니다.</strong>
            <span>법에서 보관해야 하는 경우만 정해진 기간 동안 따로 보관합니다.</span>
          </div>
        </div>
      </section>

      <section className="legal-section" aria-labelledby="privacy-collection">
        <h2 id="privacy-collection">1. 어떤 정보를 가져가나요?</h2>
        <p>
          서비스에 꼭 필요한 정보만 사용합니다. 아래 내용은 이용 방식에 따라 달라질 수 있습니다.
        </p>
        <div className="legal-info-grid">
          {simpleCollectionCards.map((item) => (
            <section className="legal-info-card" key={item.title} aria-label={item.title}>
              <h3>{item.title}</h3>
              <p>
                <strong>가져가는 정보</strong>
                <span>{item.data}</span>
              </p>
              <p>
                <strong>쓰는 이유</strong>
                <span>{item.reason}</span>
              </p>
            </section>
          ))}
        </div>
      </section>

      <section className="legal-section" aria-labelledby="privacy-purpose">
        <h2 id="privacy-purpose">2. 왜 사용하나요?</h2>
        <ul className="legal-check-list">
          <li>회원가입과 로그인을 처리합니다.</li>
          <li>내 일기, 책장, 감정 리포트, 교환일기 기능을 제공합니다.</li>
          <li>AI 답글을 만들고, 위험한 표현이 있는 경우 안전 안내를 보여줍니다.</li>
          <li>오류를 고치고 서비스를 안정적으로 운영합니다.</li>
          <li>문의와 신고를 확인하고 답변합니다.</li>
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="privacy-retention">
        <h2 id="privacy-retention">3. 언제까지 보관하나요?</h2>
        <p>
          필요한 기간이 지나면 삭제합니다. 사용자가 직접 삭제하거나 탈퇴한 경우에도 원칙적으로 삭제합니다.
        </p>
        <ul className="legal-check-list">
          {retentionItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="privacy-ai">
        <h2 id="privacy-ai">4. AI 답글을 받을 때 꼭 알아야 할 점</h2>
        <div className="legal-callout">
          <strong>쉽게 말하면</strong>
          <p>
            AI 답글을 만들려면 사용자가 쓴 일기와 선택한 감정이 필요합니다. 그래서 답글을 요청한 경우에만 관련 정보가 AI 처리에 사용될 수 있습니다.
          </p>
        </div>
        <ul className="legal-check-list">
          <li>AI 답글은 마음을 정리하는 데 도움을 주는 참고용 문장입니다.</li>
          <li>AI 답글은 의사, 상담사, 변호사, 금융 전문가의 판단을 대신하지 않습니다.</li>
          <li>자해나 타해처럼 긴급한 위험이 감지되면 답글보다 안전 안내가 먼저 표시될 수 있습니다.</li>
          <li>답글이 이상하거나 불편하면 문의 또는 신고로 검토를 요청할 수 있습니다.</li>
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="privacy-sensitive">
        <h2 id="privacy-sensitive">5. 민감한 내용은 조심해 주세요</h2>
        <p>
          {SERVICE_NAME}은 건강정보, 신념, 범죄경력 같은 민감정보를 일부러 요구하지 않습니다. 다만 일기에는 사용자가 스스로 민감한 내용을 적을 수 있습니다.
        </p>
        <p>
          공개하고 싶지 않은 정보, 다른 사람의 개인정보, 주민등록번호, 계좌번호, 비밀번호 같은 내용은 적지 않는 것이 안전합니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-sharing">
        <h2 id="privacy-sharing">6. 다른 사람에게 보여지나요?</h2>
        <ul className="legal-check-list">
          <li>개인 일기와 계정 정보는 기본적으로 공개되지 않습니다.</li>
          <li>교환일기처럼 공유 기능을 사용하면, 사용자가 선택한 상대방에게 내용이 보일 수 있습니다.</li>
          <li>사용자 동의가 있거나 법에서 요구하는 경우가 아니면 개인정보를 제3자에게 제공하지 않습니다.</li>
          <li>광고, 판매, 임대 목적으로 개인정보를 제공하지 않습니다.</li>
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="privacy-outsourcing">
        <h2 id="privacy-outsourcing">7. 외부 서비스를 사용하나요?</h2>
        <p>
          안정적인 로그인, 저장, 배포, AI 답글 생성을 위해 아래 외부 서비스를 사용할 수 있습니다. 실제 사용 여부는 배포 설정에 따라 달라질 수 있습니다.
        </p>
        <div className="legal-service-list">
          {externalServices.map((service) => (
            <div key={service.name}>
              <strong>{service.name}</strong>
              <span>{service.work}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="legal-section" aria-labelledby="privacy-transfer">
        <h2 id="privacy-transfer">8. 국외에서 처리될 수 있나요?</h2>
        <p>
          Supabase, Google, Vercel처럼 해외 회사의 서비스를 이용하는 경우, 로그인 정보, 저장 데이터, 오류 기록, AI 답글 생성에 필요한 정보가 해외 서버에서 처리될 수 있습니다.
        </p>
        <p>
          국외 처리를 원하지 않는 경우 소셜 로그인이나 AI 답글 기능 이용을 중단하거나 계정 삭제를 요청할 수 있습니다. 다만 필수 인프라를 거부하면 서비스 이용이 제한될 수 있습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-rights">
        <h2 id="privacy-rights">9. 내 정보에 대해 무엇을 요청할 수 있나요?</h2>
        <ul className="legal-check-list">
          {userRights.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>
          요청은 서비스 화면에서 직접 하거나 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 보낼 수 있습니다. 계정 주인이 맞는지 확인이 필요한 경우, 최소한의 확인 절차를 요청할 수 있습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-cookies">
        <h2 id="privacy-cookies">10. 쿠키를 사용하나요?</h2>
        <p>
          로그인 상태 유지, 보안, 이용 환경 개선을 위해 쿠키 또는 비슷한 기술을 사용할 수 있습니다. 브라우저 설정에서 쿠키 저장을 거부하거나 삭제할 수 있지만, 이 경우 로그인이 잘 되지 않는 등 일부 기능이 제한될 수 있습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-children">
        <h2 id="privacy-children">11. 만 14세 미만 아동 안내</h2>
        <p>
          서비스는 원칙적으로 만 14세 미만 아동을 대상으로 하지 않습니다. 만 14세 미만 아동이 이용하려면 법정대리인의 동의가 필요합니다. 법정대리인은 아동의 개인정보 열람, 수정, 삭제, 처리정지를 요청할 수 있습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-security">
        <h2 id="privacy-security">12. 개인정보를 어떻게 보호하나요?</h2>
        <ul className="legal-check-list">
          <li>필요한 사람만 개인정보에 접근할 수 있도록 권한을 제한합니다.</li>
          <li>로그인과 전송 과정의 보안을 유지하기 위해 보호 조치를 적용합니다.</li>
          <li>오류 기록과 보안 기록을 점검하여 문제를 빠르게 고칩니다.</li>
          <li>개인정보가 필요 없어지면 복구하기 어렵게 삭제합니다.</li>
        </ul>
      </section>

      <section className="legal-section" aria-labelledby="privacy-video">
        <h2 id="privacy-video">13. 영상정보처리기기 안내</h2>
        <p>
          현재 {SERVICE_NAME}은 서비스 운영을 위해 고정형 또는 이동형 영상정보처리기기를 설치·운영하지 않습니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-changes">
        <h2 id="privacy-changes">14. 이 방침이 바뀌면 어떻게 알리나요?</h2>
        <p>
          법령, 서비스 기능, 외부 처리 시스템이 바뀌면 이 방침도 수정될 수 있습니다. 중요한 변경 사항은 서비스 화면 또는 공지사항으로 안내합니다.
        </p>
      </section>

      <section className="legal-section" aria-labelledby="privacy-contact">
        <h2 id="privacy-contact">15. 문의</h2>
        <p>
          개인정보와 관련해 궁금한 점이 있으면 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 연락해 주세요.
        </p>
      </section>

      <nav className="legal-bottom-links" aria-label="관련 문서">
        <Link href="/terms">서비스 이용약관 보기</Link>
        <Link href="/support">문의하기</Link>
      </nav>
    </article>
  );
}
