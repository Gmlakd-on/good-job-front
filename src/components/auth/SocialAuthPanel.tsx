"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup";
type OAuthProvider = "google" | "kakao" | `custom:${string}`;

const KAKAO_AUTH_PROVIDER = (process.env.NEXT_PUBLIC_KAKAO_AUTH_PROVIDER || "kakao") as OAuthProvider;

const IN_APP_BROWSER_PATTERNS = [
  /KAKAOTALK/i,
  /Instagram/i,
  /FBAN|FBAV|FB_IAB|FB4A|FBIOS/i,
  /Line\//i,
  /NAVER\(inapp/i,
  /DaumApps/i,
  /Twitter/i,
  /LinkedInApp/i,
  /MicroMessenger/i,
  /; wv\)/i,
];

function getAuthRedirectOrigin() {
  // OAuth redirect는 사용자가 지금 접속한 도메인으로 돌려보내는 게 가장 안전하다.
  // NEXT_PUBLIC_SITE_URL이 예전 Vercel preview/deployment URL로 남아 있으면
  // 로그인 후 DEPLOYMENT_NOT_FOUND가 발생할 수 있으므로 브라우저 origin을 우선한다.
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
}

function getSafeNextPath(value: string) {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function isInAppBrowser() {
  if (typeof navigator === "undefined") return false;

  const userAgent = navigator.userAgent || "";
  return IN_APP_BROWSER_PATTERNS.some((pattern) => pattern.test(userAgent));
}

function canUseAndroidIntent() {
  if (typeof navigator === "undefined") return false;
  return /Android/i.test(navigator.userAgent || "");
}

function buildChromeIntentUrl(currentUrl: string) {
  try {
    const url = new URL(currentUrl);
    const path = `${url.host}${url.pathname}${url.search}${url.hash}`;
    return `intent://${path}#Intent;scheme=${url.protocol.replace(":", "")};package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(currentUrl)};end`;
  } catch {
    return currentUrl;
  }
}

interface SocialAuthPanelProps {
  mode: AuthMode;
  next?: string;
  initialError?: string;
  onModeChange?: (mode: AuthMode) => void;
}

export default function SocialAuthPanel({
  mode,
  next = "/",
  initialError = "",
  onModeChange,
}: SocialAuthPanelProps) {
  const [error, setError] = useState(initialError);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [inAppBrowser, setInAppBrowser] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setInAppBrowser(isInAppBrowser());
  }, []);

  const openInExternalBrowser = async () => {
    if (typeof window === "undefined") return;

    const currentUrl = window.location.href;

    if (canUseAndroidIntent()) {
      window.location.href = buildChromeIntentUrl(currentUrl);
      return;
    }

    try {
      await navigator.clipboard?.writeText(currentUrl);
      setCopied(true);
      setError("주소를 복사했어요. Safari나 Chrome 주소창에 붙여넣어 로그인해주세요.");
    } catch {
      setError("오른쪽 위 메뉴에서 'Safari로 열기' 또는 'Chrome에서 열기'를 선택한 뒤 로그인해주세요.");
    }
  };

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError("");

    if (provider === "google" && inAppBrowser) {
      setOauthLoading(null);
      setError("Google 보안 정책상 현재 앱 안 브라우저에서는 로그인이 막힐 수 있어요. Safari나 Chrome으로 열어 로그인해주세요.");
      return;
    }

    try {
      const supabase = createClient();
      const redirectOrigin = getAuthRedirectOrigin();
      const nextPath = getSafeNextPath(next);

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${redirectOrigin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
        },
      });

      if (oauthError) {
        setError(oauthError.message);
        setOauthLoading(null);
      }
    } catch (err) {
      console.error("OAuth error:", err);
      setError("서버에 연결할 수 없습니다. 잠시 후 다시 시도해주세요.");
      setOauthLoading(null);
    }
  };

  return (
    <div className="social-auth-panel">
      <div className="text-center">
        <h2 className="font-serif text-2xl mb-1" style={{ color: "var(--text-primary)" }}>
          {mode === "login" ? "로그인" : "회원가입"}
        </h2>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          {mode === "login" ? "다시 와줘서 고마워요" : "간편하게 시작해볼까요?"}
        </p>
      </div>

      {inAppBrowser && (
        <div
          role="alert"
          style={{
            border: "1px solid var(--border-medium)",
            borderRadius: "var(--radius-md)",
            background: "var(--paper-cream)",
            padding: "12px",
            fontSize: "12px",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
          }}
        >
          <p style={{ margin: "0 0 8px", fontWeight: 700, color: "var(--text-primary)" }}>
            현재 앱 안 브라우저에서 열려 있어요
          </p>
          <p style={{ margin: "0 0 10px" }}>
            Google 로그인은 보안 정책 때문에 카카오톡·인스타그램 같은 앱 안 브라우저에서 막힐 수 있어요.
            Safari나 Chrome으로 열면 정상 로그인할 수 있습니다.
          </p>
          <button
            type="button"
            onClick={openInExternalBrowser}
            className="w-full text-center text-xs"
            style={{
              borderRadius: "var(--radius-full)",
              border: "1px solid var(--border-medium)",
              background: "white",
              color: "var(--text-primary)",
              padding: "9px 12px",
              fontWeight: 700,
            }}
          >
            {canUseAndroidIntent() ? "Chrome으로 열기" : copied ? "주소 복사 완료" : "주소 복사하기"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => handleOAuthLogin("google")}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-3 text-sm font-medium transition-all"
          style={{
            borderRadius: "var(--radius-full)",
            background: "white",
            border: "1px solid var(--border-medium)",
            color: "var(--text-primary)",
            opacity: oauthLoading && oauthLoading !== "google" ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
            <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
            <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
            <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
          </svg>
          {oauthLoading === "google" ? "연결 중…" : "Google로 계속하기"}
        </button>

        <button
          type="button"
          onClick={() => handleOAuthLogin(KAKAO_AUTH_PROVIDER)}
          disabled={oauthLoading !== null}
          className="w-full flex items-center justify-center gap-3 py-3 text-sm font-medium transition-all"
          style={{
            borderRadius: "var(--radius-full)",
            background: "#FEE500",
            border: "1px solid #FEE500",
            color: "#000000",
            opacity: oauthLoading && oauthLoading !== KAKAO_AUTH_PROVIDER ? 0.5 : 1,
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
            <path d="M9 2.25C5.272 2.25 2.25 4.61 2.25 7.52c0 1.884 1.268 3.536 3.176 4.467l-.566 2.077a.37.37 0 0 0 .568.403l2.48-1.646c.356.04.72.062 1.092.062 3.728 0 6.75-2.36 6.75-5.363S12.728 2.25 9 2.25z" fill="#000000" />
          </svg>
          {oauthLoading === KAKAO_AUTH_PROVIDER ? "연결 중…" : "카카오로 계속하기"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-center" style={{ color: "var(--chami-heart)" }}>
          {error}
        </p>
      )}

      {onModeChange && (
        <button
          type="button"
          onClick={() => onModeChange(mode === "login" ? "signup" : "login")}
          className="w-full text-center text-xs"
          style={{ color: "var(--text-muted)" }}
        >
          {mode === "login" ? "처음이라면 → 회원가입" : "이미 계정이 있다면 → 로그인"}
        </button>
      )}
    </div>
  );
}
