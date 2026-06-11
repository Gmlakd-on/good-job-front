"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ExchangeEntry, ExchangeSessionWithPartner } from "@/types/exchange";

type EntryForView = ExchangeEntry & {
  content: string | null;
  is_visible: boolean;
  is_mine: boolean;
};

export default function ExchangeSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const sessionId = params.sessionId;
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<ExchangeSessionWithPartner | null>(null);
  const [entries, setEntries] = useState<EntryForView[]>([]);
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const res = await fetch(`/api/exchange/sessions/${sessionId}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setSession(data.session);
      setEntries(data.entries || []);
    } else {
      setStatusText(data.error || "교환일기를 불러오지 못했어요.");
    }
    setLoading(false);
  };

  useEffect(() => {
    // 마운트 시 1회 초기 데이터 로드 — 비동기 fetch 후 상태 반영 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const submitEntry = async () => {
    setSaving(true);
    setStatusText("");
    const res = await fetch(`/api/exchange/sessions/${sessionId}/entries`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, mood: mood || null }),
    });
    const data = await res.json();
    if (res.ok) {
      setContent("");
      setMood("");
      setStatusText("오늘의 교환일기를 저장했어요.");
      await load();
    } else {
      setStatusText(data.error || "저장에 실패했어요.");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">교환일기를 여는 중…</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/exchange")} className="text-sm opacity-40 hover:opacity-70">
          ← 교환일기
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>
          {session?.partner_display_name || "교환일기"}
        </h1>
        <div className="w-16" />
      </div>

      {statusText && (
        <div className="diary-card p-3 mb-4 text-sm" style={{ color: "var(--deep-gray)" }}>
          {statusText}
        </div>
      )}

      <section className="diary-card p-5 mb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
          오늘의 교환일기 쓰기
        </p>
        <p className="text-xs opacity-45 mb-4">
          같은 날 서로 작성하면 잠긴 글이 열려요. 연락처, 실명, 학교명 같은 개인정보는 적지 않는 게 좋아요.
        </p>
        <input
          value={mood}
          onChange={(e) => setMood(e.target.value)}
          placeholder="오늘 기분, 선택사항"
          className="w-full px-4 py-3 text-sm outline-none mb-3"
          style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", color: "var(--text-primary)" }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="오늘 상대에게 보여주고 싶은 만큼만 적어보세요."
          rows={7}
          className="w-full px-4 py-3 text-sm outline-none resize-none mb-3"
          style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", color: "var(--text-primary)" }}
        />
        <button onClick={submitEntry} disabled={saving || content.trim().length === 0} className="btn-primary w-full py-3 text-sm disabled:opacity-40">
          {saving ? "저장 중…" : "오늘의 교환일기 저장"}
        </button>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-medium px-1" style={{ color: "var(--deep-gray)" }}>지금까지의 기록</h2>
        {entries.length === 0 ? (
          <div className="diary-card p-8 text-center">
            <p className="text-2xl mb-3">📖</p>
            <p className="text-sm opacity-50">아직 작성된 교환일기가 없어요.</p>
          </div>
        ) : (
          entries.map((entry) => (
            <article key={entry.id} className="diary-card p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs opacity-45">
                  Day {entry.day_index} · {entry.is_mine ? "내 글" : `${session?.partner_display_name || "상대"}의 글`}
                </p>
                {entry.mood && <span className="text-xs opacity-45">{entry.mood}</span>}
              </div>
              {entry.is_visible ? (
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--deep-gray)" }}>
                  {entry.content}
                </p>
              ) : (
                <div className="rounded-xl p-4 text-center" style={{ background: "var(--warm-bg)" }}>
                  <p className="text-sm opacity-55">상대가 오늘의 글을 작성하면 열려요.</p>
                </div>
              )}
            </article>
          ))
        )}
      </section>
    </div>
  );
}
