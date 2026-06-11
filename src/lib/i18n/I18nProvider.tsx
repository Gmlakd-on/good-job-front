"use client";

/**
 * 언어 컨텍스트.
 * - 백엔드(/api/settings → user_settings.language)에 저장된 언어를 불러와 화면 전체에 적용한다.
 * - setLanguage 호출 시: ① 즉시 화면 리렌더 ② localStorage 캐시 ③ PATCH /api/settings 로 계정 저장.
 * - 기존 문제: 언어를 저장만 하고 어떤 화면도 번역하지 않아 "바꿔도 안 바뀜" → 이 Provider가 실제 적용 지점.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { DICTIONARIES, type DictKey, type Language } from "./dictionary";

const STORAGE_KEY = "gj.language";

interface I18nContextValue {
  language: Language;
  /** 사전 키 → 현재 언어 문자열. vars로 {n}, {cover} 같은 치환 지원. */
  t: (key: DictKey, vars?: Record<string, string | number>) => string;
  /** 언어 변경 + 계정 저장. 저장 실패해도 화면 적용은 유지된다. */
  setLanguage: (lang: Language) => Promise<void>;
}

const I18nContext = createContext<I18nContextValue>({
  language: "ko",
  t: (key) => DICTIONARIES.ko[key] ?? key,
  setLanguage: async () => {},
});

function isLanguage(value: unknown): value is Language {
  return value === "ko" || value === "en";
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>("ko");

  // 1) 첫 페인트: localStorage 캐시로 깜빡임 최소화
  useEffect(() => {
    const cached = window.localStorage.getItem(STORAGE_KEY);
    if (!isLanguage(cached)) return;

    const timeoutId = window.setTimeout(() => {
      setLanguageState(cached);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  // 2) 계정에 저장된 언어가 진실. 로그인 상태면 서버 값으로 동기화.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return; // 비로그인 등 — 캐시/기본값 유지
        const data = await res.json();
        const serverLang = data?.settings?.language;
        if (!cancelled && isLanguage(serverLang)) {
          setLanguageState(serverLang);
          window.localStorage.setItem(STORAGE_KEY, serverLang);
        }
      } catch {
        /* 네트워크 실패 시 캐시 유지 */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // <html lang> 동기화 (접근성/SEO)
  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback(async (lang: Language) => {
    setLanguageState(lang); // 즉시 적용
    window.localStorage.setItem(STORAGE_KEY, lang);
    try {
      await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language: lang }),
      });
    } catch {
      /* 계정 저장 실패해도 화면 언어는 유지 */
    }
  }, []);

  const t = useCallback(
    (key: DictKey, vars?: Record<string, string | number>) => {
      let text = DICTIONARIES[language][key] ?? DICTIONARIES.ko[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replaceAll(`{${k}}`, String(v));
        }
      }
      return text;
    },
    [language],
  );

  const value = useMemo(() => ({ language, t, setLanguage }), [language, t, setLanguage]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}
