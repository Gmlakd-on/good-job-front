"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

function getAuthRedirectOrigin() {
  // OAuth redirect는 현재 접속 중인 도메인을 우선한다.
  // NEXT_PUBLIC_SITE_URL이 삭제된 Vercel preview/deployment URL로 남아 있으면
  // 로그인 후 DEPLOYMENT_NOT_FOUND가 날 수 있다.
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
}

interface AuthGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthGate({ open, onClose, onSuccess }: AuthGateProps) {
  const [error, setError] = useState("");
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  if (!open) return null;

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider);
    setError("");

    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${getAuthRedirectOrigin()}/auth/callback?next=/`,
        },
      });

      if (err) {
        setError(err.message);
        setOauthLoading(null);
      }
    } catch {
      setError("서버에 연결할 수 없습니다.");
      setOauthLoading(null);
    }
  };

  return (
    <div className="auth-gate__overlay" onClick={onClose}>
      <div className="auth-gate__modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-gate__close" onClick={onClose} aria-label="닫기">
          ×
        </button>

        <div className="auth-gate__header">
          <p className="auth-gate__title">기록장을 저장할게요</p>
          <p className="auth-gate__subtitle">
            계정을 만들면 지금 고른 기록장이 바로 저장돼요.
          </p>
        </div>

        <button
          className="auth-gate__btn auth-gate__btn--oauth"
          onClick={() => handleOAuth("google")}
          disabled={!!oauthLoading}
        >
          {oauthLoading === "google" ? "연결 중…" : "Google로 시작하기"}
        </button>

        {error && <p className="auth-gate__error">{error}</p>}

        <button className="auth-gate__toggle" onClick={onSuccess}>
          이미 로그인했다면 계속하기
        </button>
      </div>
    </div>
  );
}
