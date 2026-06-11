"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

export default function PasswordSection() {
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleChange() {
    if (newPassword.length < 6) {
      showToast("비밀번호는 6자 이상이어야 해요.", "error");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("비밀번호가 일치하지 않아요.", "error");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      showToast("비밀번호 변경에 실패했어요.", "error");
    } else {
      showToast("비밀번호가 변경되었어요.", "success");
      setNewPassword("");
      setConfirmPassword("");
      setOpen(false);
    }
    setSaving(false);
  }

  return (
    <div className="diary-card p-5 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm opacity-60 hover:opacity-80 w-full text-left"
      >
        비밀번호 변경 {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-4 space-y-3 animate-fade-in-up">
          <input
            type="password"
            placeholder="새 비밀번호 (6자 이상)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            minLength={6}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          />
          <input
            type="password"
            placeholder="새 비밀번호 확인"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          />
          <button
            onClick={handleChange}
            disabled={saving || !newPassword || !confirmPassword}
            className="w-full py-2 rounded-lg text-xs text-white"
            style={{ background: "var(--soft-accent)", opacity: saving ? 0.5 : 1 }}
          >
            {saving ? "변경 중…" : "비밀번호 변경"}
          </button>
        </div>
      )}
    </div>
  );
}
