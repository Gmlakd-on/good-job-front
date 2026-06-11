"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import SocialAuthPanel from "@/components/auth/SocialAuthPanel";

type AuthMode = "login" | "signup";

export default function AuthPage() {
  return (
    <Suspense fallback={null}>
      <AuthPageContent />
    </Suspense>
  );
}

function initialMode(value: string | null): AuthMode {
  return value === "signup" ? "signup" : "login";
}

function AuthPageContent() {
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<AuthMode>(() => initialMode(searchParams.get("mode")));
  const initialError = searchParams.get("error")
    ? searchParams.get("message") || "소셜 로그인에 실패했어요. Supabase Auth 설정과 Redirect URL을 확인해주세요."
    : "";
  const next = searchParams.get("next") || "/books";

  return (
    <div className="flex flex-col items-center pt-12">
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
        <SocialAuthPanel
          mode={mode}
          next={next}
          initialError={initialError}
          onModeChange={setMode}
        />
      </div>
    </div>
  );
}
