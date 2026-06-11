"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { formatFullDate } from "@/lib/date";

interface ProfileSectionProps {
  email: string;
  initialNickname: string;
  createdAt: string;
}

export default function ProfileSection({ email, initialNickname, createdAt }: ProfileSectionProps) {
  const { showToast } = useToast();
  const [nickname, setNickname] = useState(initialNickname);
  const [savedNickname, setSavedNickname] = useState(initialNickname);
  const [saving, setSaving] = useState(false);

  const isDirty = nickname !== savedNickname;

  async function handleSave() {
    if (!isDirty) return;
    setSaving(true);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nickname }),
    });
    if (res.ok) {
      setSavedNickname(nickname);
      showToast("닉네임이 저장되었어요.", "success");
    } else {
      const data = await res.json();
      showToast(data.error || "저장에 실패했어요.", "error");
    }
    setSaving(false);
  }

  return (
    <div className="diary-card p-5 mb-4">
      <p className="text-xs opacity-40 mb-3">프로필</p>

      <div className="mb-4">
        <label className="text-xs opacity-60 mb-1 block">닉네임</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder="닉네임을 입력해주세요"
            maxLength={20}
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          />
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="px-4 py-2 rounded-lg text-xs text-white transition-opacity"
            style={{ background: "var(--soft-accent)", opacity: saving || !isDirty ? 0.4 : 1 }}
          >
            {saving ? "…" : "저장"}
          </button>
        </div>
        <p className="text-xs opacity-30 mt-1">{nickname.length}/20</p>
      </div>

      <div className="mb-2">
        <label className="text-xs opacity-60 mb-1 block">이메일</label>
        <p className="text-sm opacity-70">{email}</p>
      </div>

      {createdAt && (
        <p className="text-xs opacity-30 mt-3">가입일: {formatFullDate(createdAt)}</p>
      )}
    </div>
  );
}
