"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword.length < 6) {
      setError("비밀번호는 6자 이상이어야 해요.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("비밀번호가 일치하지 않아요.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      setError(updateError.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center pt-20">
        <div
          className="p-8 w-full text-center"
          style={{
            maxWidth: 400,
            borderRadius: "var(--radius-lg)",
            background: "var(--bg-card)",
            border: "1px solid var(--border-subtle)",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <p className="font-serif text-xl mb-3" style={{ color: "var(--text-primary)" }}>
            비밀번호가 변경되었어요 ✓
          </p>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            새 비밀번호로 로그인할 수 있어요.
          </p>
          <button
            onClick={() => router.push("/books")}
            className="btn-primary px-6 py-2.5 text-sm"
          >
            내 기록장으로 가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center pt-20">
      <h1 className="font-serif text-2xl mb-2" style={{ color: "var(--text-primary)" }}>
        새 비밀번호 설정
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        사용할 새 비밀번호를 입력해주세요.
      </p>

      <form
        onSubmit={handleSubmit}
        className="p-6 w-full flex flex-col gap-3"
        style={{
          maxWidth: 400,
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
        }}
      >
        <input
          type="password"
          placeholder="새 비밀번호 (6자 이상)"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 text-sm outline-none"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--cream-deep)",
            color: "var(--text-primary)",
            border: "1px solid transparent",
          }}
        />
        <input
          type="password"
          placeholder="비밀번호 확인"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          minLength={6}
          className="w-full px-4 py-3 text-sm outline-none"
          style={{
            borderRadius: "var(--radius-md)",
            background: "var(--cream-deep)",
            color: "var(--text-primary)",
            border: "1px solid transparent",
          }}
        />

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
          {loading ? "변경 중…" : "비밀번호 변경하기"}
        </button>
      </form>
    </div>
  );
}
