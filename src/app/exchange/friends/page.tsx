"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { ExchangeProfile, ExchangeProfileSearchResult } from "@/types/exchange";

type InviteWithProfile = {
  id: string;
  message: string | null;
  created_at: string;
  from_profile?: ExchangeProfileSearchResult | null;
  to_profile?: ExchangeProfileSearchResult | null;
};

const FRIENDLY_HANDLE_WORDS = [
  "lucky",
  "love",
  "hope",
  "smile",
  "good",
  "food",
  "mood",
  "moon",
  "star",
] as const;

function generateFriendlyHandle() {
  const word =
    FRIENDLY_HANDLE_WORDS[
      Math.floor(Math.random() * FRIENDLY_HANDLE_WORDS.length)
    ];
  const number = Math.floor(Math.random() * 99) + 1;

  return `${word}_${number}`;
}

export default function ExchangeFriendsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ExchangeProfile | null>(null);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<ExchangeProfileSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [received, setReceived] = useState<InviteWithProfile[]>([]);
  const [sent, setSent] = useState<InviteWithProfile[]>([]);
  const [statusText, setStatusText] = useState("");

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const [profileRes, invitesRes] = await Promise.all([
      fetch("/api/exchange/profile", { cache: "no-store" }),
      fetch("/api/exchange/friend-invites", { cache: "no-store" }),
    ]);

    if (profileRes.ok) {
      const data = await profileRes.json();
      setProfile(data.profile);
      setHandle(data.profile?.handle || "");
      setDisplayName(data.profile?.display_name || "");
    }

    if (invitesRes.ok) {
      const data = await invitesRes.json();
      setReceived(data.received || []);
      setSent(data.sent || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    // 마운트 시 1회 초기 데이터 로드 — 비동기 fetch 후 상태 반영 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveProfile = async () => {
    setSaving(true);
    setStatusText("");
    const res = await fetch("/api/exchange/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ handle, display_name: displayName, random_matching_enabled: true }),
    });
    const data = await res.json();
    if (res.ok) {
      setProfile(data.profile);
      setHandle(data.profile.handle);
      setDisplayName(data.profile.display_name);
      setStatusText("교환 프로필을 저장했어요.");
    } else {
      setStatusText(data.error || "저장에 실패했어요.");
    }
    setSaving(false);
  };

  const searchUsers = async () => {
    setStatusText("");
    const q = search.trim().toLowerCase();
    if (q.length < 2) {
      setStatusText("아이디를 2자 이상 입력해주세요.");
      return;
    }
    const res = await fetch(`/api/exchange/users?handle=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setResults(data.users || []);
    } else {
      setStatusText(data.error || "검색에 실패했어요.");
    }
  };

  const sendInvite = async (toHandle: string) => {
    setStatusText("");
    const res = await fetch("/api/exchange/friend-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_handle: toHandle, message }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusText("초대를 보냈어요. 상대가 수락하면 교환일기가 시작돼요.");
      setMessage("");
      await load();
    } else {
      setStatusText(data.error || "초대에 실패했어요.");
    }
  };

  const respondInvite = async (inviteId: string, action: "accept" | "decline") => {
    setStatusText("");
    const res = await fetch(`/api/exchange/friend-invites/${inviteId}/${action}`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      setStatusText(action === "accept" ? "초대를 수락했어요." : "초대를 거절했어요.");
      if (data.session?.id) router.push(`/exchange/${data.session.id}`);
      else await load();
    } else {
      setStatusText(data.error || "처리에 실패했어요.");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/exchange")} className="text-sm opacity-40 hover:opacity-70">
          ← 교환일기
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>친구 초대</h1>
        <div className="w-14" />
      </div>

      {statusText && (
        <div className="diary-card p-3 mb-4 text-sm" style={{ color: "var(--deep-gray)" }}>
          {statusText}
        </div>
      )}

      <section className="diary-card p-5 mb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>내 교환 프로필</p>
        <p className="text-xs opacity-45 mb-4">
          친구가 나를 찾을 때 쓰는 아이디예요. 처음 들어오면 자동으로 만들어져요.
        </p>
        <div className="grid gap-3">
          <div className="flex gap-2">
            <input
              value={handle}
              onChange={(e) => setHandle(e.target.value.toLowerCase())}
              placeholder="예: lucky_7, moon_23, star_99"
              className="flex-1 px-4 py-3 text-sm outline-none"
              style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", color: "var(--text-primary)" }}
            />
            <button
              type="button"
              onClick={() => setHandle(generateFriendlyHandle())}
              className="px-4 py-3 text-xs rounded-full"
              style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
            >
              랜덤
            </button>
          </div>
          <p className="text-[11px] opacity-45 leading-relaxed">
            아이디는 lucky, love, hope, smile, good, food, mood, moon, star 중 하나와 1~99 숫자로 만들 수 있어요.
          </p>
          <input
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="표시 이름"
            className="w-full px-4 py-3 text-sm outline-none"
            style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", color: "var(--text-primary)" }}
          />
          <button onClick={saveProfile} disabled={saving} className="btn-primary py-3 text-sm disabled:opacity-40">
            {profile ? "프로필 수정" : "프로필 만들기"}
          </button>
        </div>
      </section>

      <section className="diary-card p-5 mb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>친구 찾기</p>
        <p className="text-xs opacity-45 mb-3">친구에게 받은 아이디를 입력해 찾아보세요.</p>
        <div className="flex gap-2 mb-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value.toLowerCase())}
            placeholder="친구 아이디 예: moon_23"
            className="flex-1 px-4 py-3 text-sm outline-none"
            style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", color: "var(--text-primary)" }}
          />
          <button onClick={searchUsers} className="px-4 py-3 text-sm rounded-full" style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}>
            검색
          </button>
        </div>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="초대 메시지, 선택사항"
          rows={2}
          className="w-full px-4 py-3 text-sm outline-none resize-none mb-3"
          style={{ borderRadius: "var(--radius-md)", background: "var(--cream-deep)", color: "var(--text-primary)" }}
        />
        <div className="space-y-2">
          {results.map((user) => (
            <div key={user.handle} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{user.display_name}</p>
                <p className="text-xs opacity-45">@{user.handle}</p>
              </div>
              <button onClick={() => sendInvite(user.handle)} className="text-xs px-3 py-1.5 rounded-full text-white" style={{ background: "var(--deep-gray)" }}>
                초대
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="diary-card p-5 mb-4">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--deep-gray)" }}>받은 초대</p>
        {received.length === 0 ? (
          <p className="text-xs opacity-40">아직 받은 초대가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {received.map((invite) => (
              <div key={invite.id} className="p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
                <p className="text-sm" style={{ color: "var(--deep-gray)" }}>
                  {invite.from_profile?.display_name || "익명"}님의 초대
                </p>
                {invite.message && <p className="text-xs opacity-50 mt-1">{invite.message}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => respondInvite(invite.id, "accept")} className="btn-primary px-4 py-2 text-xs">수락</button>
                  <button onClick={() => respondInvite(invite.id, "decline")} className="px-4 py-2 text-xs rounded-full" style={{ background: "var(--paper-white)", color: "var(--deep-gray)" }}>거절</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="diary-card p-5">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--deep-gray)" }}>보낸 초대</p>
        {sent.length === 0 ? (
          <p className="text-xs opacity-40">대기 중인 보낸 초대가 없어요.</p>
        ) : (
          <div className="space-y-2">
            {sent.map((invite) => (
              <div key={invite.id} className="p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
                <p className="text-sm" style={{ color: "var(--deep-gray)" }}>
                  {invite.to_profile?.display_name || "익명"}님에게 보냄
                </p>
                <p className="text-xs opacity-45 mt-1">상대의 수락을 기다리는 중이에요.</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
