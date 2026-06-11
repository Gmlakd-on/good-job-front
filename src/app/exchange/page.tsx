"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ExchangeSessionWithPartner } from "@/types/exchange";

export default function ExchangeHomePage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<ExchangeSessionWithPartner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch("/api/exchange/sessions", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
      setLoading(false);
    };
    load();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">교환일기를 불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← 홈
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>교환일기</h1>
        <Link href="/exchange/friends" className="text-sm opacity-60 hover:opacity-90">
          친구
        </Link>
      </div>

      <div className="diary-card p-5 mb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
          서로 쓰면 열리는 7일 일기
        </p>
        <p className="text-xs opacity-50 leading-relaxed">
          친구 초대나 랜덤 매칭으로 연결된 상대와 하루 한 번씩 기록해요. 상대가 같은 날 작성하면 서로의 글이 공개됩니다.
        </p>
        <div className="flex gap-2 mt-4">
          <Link href="/exchange/friends" className="btn-primary px-4 py-2 text-sm">
            친구 초대하기
          </Link>
          <Link href="/books" className="px-4 py-2 text-sm rounded-full" style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}>
            일기 고르기
          </Link>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="diary-card p-8 text-center">
          <p className="text-2xl mb-3">💌</p>
          <p className="text-sm opacity-60">진행 중인 교환일기가 없어요.</p>
          <p className="text-xs opacity-35 mt-2">먼저 교환 프로필을 만들고 친구에게 초대를 보내보세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Link
              key={session.id}
              href={`/exchange/${session.id}`}
              className="diary-card block p-4 transition-all hover:shadow-md"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>
                    {session.partner_display_name || "익명"}님과의 교환일기
                  </p>
                  <p className="text-xs opacity-45 mt-1">
                    @{session.partner_handle || "unknown"} · {session.status === "active_7day" ? "7일 진행 중" : session.status}
                  </p>
                </div>
                <span className="text-xs opacity-40">열기 →</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
