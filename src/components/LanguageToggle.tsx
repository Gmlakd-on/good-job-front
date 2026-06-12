"use client";

/**
 * 언어 전환 토글 (ko/en).
 * - 비로그인 방문자도 영어로 서비스를 둘러볼 수 있도록 헤더/홈 내비에 노출.
 * - useI18n().setLanguage: 즉시 화면 적용 + localStorage 캐시 + (로그인 시) 계정 저장.
 */
import { useI18n } from "@/lib/i18n/I18nProvider";

export default function LanguageToggle() {
  const { language, setLanguage } = useI18n();

  return (
    <div className="lang-toggle" role="group" aria-label="Language / 언어">
      <button
        type="button"
        className={`lang-toggle__btn ${language === "ko" ? "lang-toggle__btn--active" : ""}`}
        aria-pressed={language === "ko"}
        lang="ko"
        onClick={() => setLanguage("ko")}
      >
        한국어
      </button>
      <button
        type="button"
        className={`lang-toggle__btn ${language === "en" ? "lang-toggle__btn--active" : ""}`}
        aria-pressed={language === "en"}
        lang="en"
        onClick={() => setLanguage("en")}
      >
        EN
      </button>
    </div>
  );
}
