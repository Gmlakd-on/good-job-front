"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function PasswordSettingsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [authChecked, setAuthChecked] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/auth");
        return;
      }
      setAuthChecked(true);
    });
  }, [router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
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
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (updateError) {
      setError(updateError.message || "비밀번호 변경에 실패했어요.");
      return;
    }

    setNewPassword("");
    setConfirmPassword("");
    showToast("비밀번호가 변경되었어요.", "success");
    router.push("/settings");
  };

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">확인 중…</p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="mb-6 flex items-center justify-between">
        <Link href="/settings" className="text-sm opacity-40 hover:opacity-70">← 설정</Link>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>비밀번호 변경</h1>
        <span className="w-10" />
      </div>

      <form onSubmit={handleSubmit} className="diary-card mx-auto grid max-w-[460px] gap-3 p-5">
        <label className="grid gap-1">
          <span className="text-xs opacity-60">새 비밀번호</span>
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="6자 이상"
            minLength={6}
            required
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          />
        </label>

        <label className="grid gap-1">
          <span className="text-xs opacity-60">새 비밀번호 확인</span>
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="한 번 더 입력해주세요"
            minLength={6}
            required
            className="w-full rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          />
        </label>

        {error && <p className="text-sm text-[var(--warm-red)]">{error}</p>}

        <button
          type="submit"
          disabled={loading || !newPassword || !confirmPassword}
          className="mt-2 w-full rounded-lg py-2.5 text-sm text-white"
          style={{ background: "var(--soft-accent)", opacity: loading || !newPassword || !confirmPassword ? 0.5 : 1 }}
        >
          {loading ? "변경 중…" : "비밀번호 변경하기"}
        </button>
      </form>
    </div>
  );
}
