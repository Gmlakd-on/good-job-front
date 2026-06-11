"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type AuthMode = "login" | "signup" | "forgot";
type OAuthProvider = "google" | "kakao" | `custom:${string}`;

const KAKAO_AUTH_PROVIDER = (process.env.NEXT_PUBLIC_KAKAO_AUTH_PROVIDER || "kakao") as OAuthProvider;

/**
 * useSearchParams를 쓰는 본문은 Suspense 경계 안에서 렌더링해야
 * 정적 프리렌더 시 CSR bailout 경고가 발생하지 않는다.
 */
export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}

function initialMode(value: string | null): AuthMode {
  return value === "signup" || value === "forgot" ? value : "login";
}

function AuthPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [mode, setMode] = useState<AuthMode>(() => initialMode(searchParams.get("mode")));
  const [resetSent, setResetSent] = useState(false);
  const [error, setError] = useState(() =>
    searchParams.get("error")
      ? searchParams.get("message") || "소셜 로그인에 실패했어요. Supabase Auth 설정과 Redirect URL을 확인해주세요."
      : ""
  );
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const title = mode === "forgot" ? "비밀번호 찾기" : "참 잘했어요";
  const subtitle = mode === "login"
    ? "다시 와줘서 고마워요"
    : mode === "signup"
      ? "처음 오셨군요, 반가워요"
      : "가입한 이메일로 재설정 링크를 보내드릴게요";

  const handleOAuthLogin = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    setError("");

    try {
      const supabase = createClient();

      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/books`,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "forgot") return handlePasswordReset();

    setError("");
    setLoading(true);

    try {
      const supabase = createClient();

      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (signUpError) {
          setError(signUpError.message);
        } else {
          setSignupDone(true);
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          setError("이메일 또는 비밀번호를 확인해주세요.");
        } else {
          router.push("/");
          router.refresh();
        }
      }
    } catch (err) {
      console.error("Auth error:", err);
      setError(
        "서버에 연결할 수 없습니다. Supabase 환경변수(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)를 확인해주세요."
      );
    }

    setLoading(false);
  };

  const handlePasswordReset = async () => {
    setError("");
    setResetSent(false);

    if (!email.trim()) {
      setError("비밀번호를 재설정할 이메일을 입력해주세요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    if (resetError) {
      setError(resetError.message);
    } else {
      setResetSent(true);
    }

    setLoading(false);
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError("");
    setResetSent(false);
    if (nextMode === "forgot") setPassword("");
  };

  if (signupDone) {
    return (
      <div className="flex flex-col items-center pt-16">
        <div
          className="p-6 w-full text-center"
          style={{
            maxWidth: 400,
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p className="font-serif text-xl mb-3" style={{ color: "var(--text-primary)" }}>
            가입 완료 ✦
          </p>
          <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
            이메일에서 인증 링크를 확인해주세요.
            <br />
            인증 후 로그인할 수 있어요.
          </p>
          <button
            onClick={() => { setSignupDone(false); switchMode("login"); }}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            로그인하러 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-12">
      <h1 className="font-serif text-2xl mb-1" style={{ color: "var(--text-primary)" }}>
        {title}
      </h1>
      <p className="text-sm mb-8 text-center" style={{ color: "var(--text-muted)" }}>
        {subtitle}
      </p>

      <div
        className="p-6 w-full"
        style={{
          maxWidth: 400,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        {mode !== "forgot" && (
          <>
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.997 8.997 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
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
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M9 2.25C5.272 2.25 2.25 4.61 2.25 7.52c0 1.884 1.268 3.536 3.176 4.467l-.566 2.077a.37.37 0 0 0 .568.403l2.48-1.646c.356.04.72.062 1.092.062 3.728 0 6.75-2.36 6.75-5.363S12.728 2.25 9 2.25z" fill="#000000"/>
                </svg>
                {oauthLoading === KAKAO_AUTH_PROVIDER ? "연결 중…" : "카카오로 계속하기"}
              </button>
            </div>

            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>또는</span>
              <div className="flex-1 h-px" style={{ background: "var(--border-subtle)" }} />
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{
              borderRadius: "var(--radius-md)",
              background: "var(--cream-deep)",
              color: "var(--text-primary)",
              border: "1px solid transparent",
            }}
          />

          {mode !== "forgot" && (
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="w-full px-4 py-3 text-sm outline-none pr-14 transition-all"
                style={{
                  borderRadius: "var(--radius-md)",
                  background: "var(--cream-deep)",
                  color: "var(--text-primary)",
                  border: "1px solid transparent",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs"
                style={{ color: "var(--text-muted)" }}
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              >
                {showPassword ? "숨기기" : "보기"}
              </button>
            </div>
          )}

          {resetSent && (
            <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
              비밀번호 재설정 메일을 보냈어요. 메일의 링크를 누르면 새 비밀번호 설정 페이지로 이동합니다.
            </p>
          )}

          {error && (
            <p className="text-sm" style={{ color: "var(--chami-heart)" }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 text-sm"
            style={{ opacity: loading ? 0.6 : 1 }}
          >
            {loading
              ? "잠깐만요…"
              : mode === "login"
                ? "로그인"
                : mode === "signup"
                  ? "회원가입"
                  : "재설정 메일 보내기"}
          </button>
        </form>

        {mode !== "forgot" ? (
          <>
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="w-full text-center text-xs mt-4"
              style={{ color: "var(--text-muted)" }}
            >
              {mode === "login" ? "아직 계정이 없다면 → 회원가입" : "이미 계정이 있다면 → 로그인"}
            </button>

            {mode === "login" && (
              <button
                type="button"
                onClick={() => switchMode("forgot")}
                className="w-full text-center text-xs mt-3"
                style={{ color: "var(--text-muted)" }}
              >
                비밀번호를 잊으셨나요?
              </button>
            )}
          </>
        ) : (
          <button
            type="button"
            onClick={() => switchMode("login")}
            className="w-full text-center text-xs mt-4"
            style={{ color: "var(--text-muted)" }}
          >
            로그인으로 돌아가기
          </button>
        )}
      </div>
    </div>
  );
}
