"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/Toast";

const CONFIRM_TEXT = "삭제합니다";

export default function DeleteAccountSection() {
  const router = useRouter();
  const { showToast } = useToast();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const confirmed = confirmText === CONFIRM_TEXT;

  async function handleDelete() {
    if (!confirmed) {
      showToast(`'${CONFIRM_TEXT}'를 정확히 입력해주세요.`, "error");
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch("/api/account", { method: "DELETE" });
      if (res.ok) {
        const supabase = createClient();
        await supabase.auth.signOut();
        showToast("계정이 삭제되었어요. 안녕히 가세요.", "info");
        router.push("/");
      } else {
        const data = await res.json().catch(() => null);
        showToast(data?.error || "계정 삭제에 실패했어요.", "error");
      }
    } catch {
      showToast("네트워크 오류가 발생했어요.", "error");
    }
    setDeleting(false);
  }

  return (
    <div className="diary-card p-5 mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="text-sm opacity-40 hover:opacity-60 w-full text-left"
      >
        계정 삭제 {open ? "▲" : "▼"}
      </button>

      {open && (
        <div className="mt-4 animate-fade-in-up">
          <p className="text-xs opacity-50 mb-3 leading-relaxed">
            계정을 삭제하면 모든 일기, 답글, 감정 기록이 영구적으로 삭제됩니다.
            <br />
            이 작업은 되돌릴 수 없어요.
          </p>
          <p className="text-xs opacity-60 mb-2">
            확인을 위해 아래에 <strong>{CONFIRM_TEXT}</strong>를 입력해주세요.
          </p>
          <input
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={CONFIRM_TEXT}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none mb-3"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          />
          <button
            onClick={handleDelete}
            disabled={deleting || !confirmed}
            className="w-full py-2 rounded-lg text-xs text-white"
            style={{
              background: "var(--warm-red)",
              opacity: deleting || !confirmed ? 0.4 : 1,
            }}
          >
            {deleting ? "삭제 중…" : "계정 영구 삭제"}
          </button>
        </div>
      )}
    </div>
  );
}
