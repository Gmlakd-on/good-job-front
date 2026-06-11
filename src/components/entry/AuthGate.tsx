"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthGateProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AuthGate({ open, onClose, onSuccess }: AuthGateProps) {
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);
  const [signupDone, setSignupDone] = useState(false);

  if (!open) return null;

  const handleOAuth = async (provider: "google") => {
    setOauthLoading(provider);
    setError("");
    try {
      const supabase = createClient();
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error: err } = await supabase.auth.signUp({ email, password });
        if (err) { setError(err.message); setLoading(false); return; }
        setSignupDone(true);
        setLoading(false);
        return;
      }

      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); return; }
      setLoading(false);
      onSuccess();
    } catch {
      setError("서버에 연결할 수 없습니다. 환경변수를 확인해주세요.");
      setLoading(false);
    }
  };

  return (
    <div className="auth-gate__overlay" onClick={onClose}>
      <div className="auth-gate__modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-gate__close" onClick={onClose} aria-label="닫기">×</button>

        <div className="auth-gate__header">
          <p className="auth-gate__title">기록장을 저장할게요</p>
          <p className="auth-gate__subtitle">
            계정을 만들면 지금 고른 기록장이 바로 저장돼요.
          </p>
        </div>

        {signupDone ? (
          <div className="auth-gate__done">
            <p>✉️ 확인 메일을 보냈어요.</p>
            <p>메일함을 확인한 뒤 다시 로그인해주세요.</p>
            <button
              className="auth-gate__btn auth-gate__btn--primary"
              onClick={() => { setSignupDone(false); setMode("login"); }}
            >
              로그인하기
            </button>
          </div>
        ) : (
          <>
            <button
              className="auth-gate__btn auth-gate__btn--oauth"
              onClick={() => handleOAuth("google")}
              disabled={!!oauthLoading}
            >
              {oauthLoading === "google" ? "연결 중…" : "Google로 시작하기"}
            </button>

            <div className="auth-gate__divider">
              <span>또는</span>
            </div>

            <form onSubmit={handleSubmit} className="auth-gate__form">
              <input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="auth-gate__input"
              />
              <input
                type="password"
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="auth-gate__input"
              />

              {error && <p className="auth-gate__error">{error}</p>}

              <button
                type="submit"
                className="auth-gate__btn auth-gate__btn--primary"
                disabled={loading}
              >
                {loading ? "처리 중…" : mode === "signup" ? "가입하고 저장하기" : "로그인하고 저장하기"}
              </button>
            </form>

            <button
              className="auth-gate__toggle"
              onClick={() => setMode(mode === "login" ? "signup" : "login")}
            >
              {mode === "login" ? "계정이 없나요? 가입하기" : "이미 계정이 있나요? 로그인"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
