"use client";

/**
 * 친구 초대.
 * UX 정비 (정보 구조):
 * - 받은 초대(가장 즉시 행동 가능한 항목)를 페이지 최상단으로 — 기존에는 4번째 카드라 스크롤 깊이에 묻혀 있었음.
 * - 프로필이 이미 있으면 폼 대신 한 줄 요약 칩으로 접고, "수정"으로 펼침 — 매번 들어올 때마다 폼이 본문을 밀어내지 않게.
 * - 아이디 형식(단어_1~99)을 제출 전에 인라인으로 즉시 검증 — 서버 에러로 배우게 하지 않음.
 * - 친구 찾기: Enter 제출, 검색 결과가 있을 때만 초대 메시지 입력란 노출(행동 순서와 화면 순서 일치).
 * - 검색 0건일 때 명시적 안내. 초대 전송 중 버튼 상태 표시.
 */
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import {
  isValidHandle,
  MAX_INVITE_MESSAGE_LENGTH,
  type ExchangeProfile,
  type ExchangeProfileSearchResult,
} from "@/types/exchange";

type InviteWithProfile = {
  id: string;
  message: string | null;
  created_at: string;
  from_profile?: ExchangeProfileSearchResult | null;
  to_profile?: ExchangeProfileSearchResult | null;
};

const FRIENDLY_HANDLE_WORDS = [
  "lucky", "love", "hope", "smile", "good", "food", "mood", "moon", "star",
] as const;

function generateFriendlyHandle() {
  const word = FRIENDLY_HANDLE_WORDS[Math.floor(Math.random() * FRIENDLY_HANDLE_WORDS.length)];
  const number = Math.floor(Math.random() * 99) + 1;
  return `${word}_${number}`;
}

const inputStyle = {
  borderRadius: "var(--radius-md)",
  background: "var(--cream-deep)",
  color: "var(--text-primary)",
} as const;

export default function ExchangeFriendsPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ExchangeProfile | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [handle, setHandle] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<ExchangeProfileSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [invitingHandle, setInvitingHandle] = useState<string | null>(null);
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
      // 프로필이 없으면(첫 방문) 폼을 펼친 채 시작
      setProfileOpen(!data.profile);
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

  const handleTrimmed = handle.trim().toLowerCase();
  const handleInvalid = handleTrimmed.length > 0 && !isValidHandle(handleTrimmed);

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
      setProfileOpen(false);
      setStatusText(t("xch.fr.profileSaved"));
    } else {
      setStatusText(data.error || t("xch.fr.saveFail"));
    }
    setSaving(false);
  };

  const searchUsers = async () => {
    setStatusText("");
    const q = search.trim().toLowerCase();
    if (q.length < 2) {
      setStatusText(t("xch.fr.searchMin"));
      return;
    }
    setSearching(true);
    const res = await fetch(`/api/exchange/users?handle=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setResults(data.users || []);
      setSearched(true);
    } else {
      setStatusText(data.error || t("xch.fr.searchFail"));
    }
    setSearching(false);
  };

  const sendInvite = async (toHandle: string) => {
    setStatusText("");
    setInvitingHandle(toHandle);
    const res = await fetch("/api/exchange/friend-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_handle: toHandle, message }),
    });
    const data = await res.json();
    if (res.ok) {
      setStatusText(t("xch.fr.invited"));
      setMessage("");
      setResults([]);
      setSearched(false);
      setSearch("");
      await load();
    } else {
      setStatusText(data.error || t("xch.fr.inviteFail"));
    }
    setInvitingHandle(null);
  };

  const respondInvite = async (inviteId: string, action: "accept" | "decline") => {
    setStatusText("");
    const res = await fetch(`/api/exchange/friend-invites/${inviteId}/${action}`, {
      method: "POST",
    });
    const data = await res.json();
    if (res.ok) {
      setStatusText(action === "accept" ? t("xch.fr.accepted") : t("xch.fr.declined"));
      if (data.session?.id) router.push(`/exchange/${data.session.id}`);
      else await load();
    } else {
      setStatusText(data.error || t("xch.manage.fallbackFail"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.fr.loading")}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/exchange")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("xch.back.exchange")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("xch.fr.title")}</h1>
        <div className="w-14" />
      </div>

      {statusText && (
        <div className="diary-card p-3 mb-4 text-sm" role="status" style={{ color: "var(--deep-gray)" }}>
          {statusText}
        </div>
      )}

      {/* ① 받은 초대 — 가장 즉시 행동 가능한 항목이므로 최상단 */}
      {received.length > 0 && (
        <section className="diary-card p-5 mb-4 xch-received">
          <p className="text-sm font-medium mb-3" style={{ color: "var(--deep-gray)" }}>
            {t("xch.fr.received")} <span className="xch-received__badge">{received.length}</span>
          </p>
          <div className="space-y-2">
            {received.map((invite) => (
              <div key={invite.id} className="p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
                <p className="text-sm" style={{ color: "var(--deep-gray)" }}>
                  {t("xch.fr.inviteFrom", { name: invite.from_profile?.display_name || t("xch.fr.anon") })}
                </p>
                {invite.message && <p className="text-xs opacity-50 mt-1">{invite.message}</p>}
                <div className="flex gap-2 mt-3">
                  <button onClick={() => respondInvite(invite.id, "accept")} className="btn-primary px-4 py-2 text-xs">{t("xch.fr.accept")}</button>
                  <button onClick={() => respondInvite(invite.id, "decline")} className="px-4 py-2 text-xs rounded-full" style={{ background: "var(--paper-white)", color: "var(--deep-gray)" }}>{t("xch.fr.decline")}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ② 내 교환 프로필 — 있으면 요약 칩, 없거나 수정 중일 때만 폼 */}
      <section className="diary-card p-5 mb-4">
        {profile && !profileOpen ? (
          <div className="xch-profile-chip">
            <div>
              <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{profile.display_name}</p>
              <p className="text-xs opacity-45">@{profile.handle} · {t("xch.fr.profileChipDesc")}</p>
            </div>
            <button
              type="button"
              onClick={() => setProfileOpen(true)}
              className="text-xs px-3 py-1.5 rounded-full"
              style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
            >
              {t("xch.fr.edit")}
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("xch.fr.profileTitle")}</p>
            <p className="text-xs opacity-45 mb-4">
              {t("xch.fr.profileDesc")}
            </p>
            <div className="grid gap-3">
              <div className="flex gap-2">
                <input
                  value={handle}
                  onChange={(e) => setHandle(e.target.value.toLowerCase())}
                  placeholder={t("xch.fr.handlePlaceholder")}
                  aria-invalid={handleInvalid}
                  className={`flex-1 px-4 py-3 text-sm outline-none ${handleInvalid ? "xch-input--invalid" : ""}`}
                  style={inputStyle}
                />
                <button
                  type="button"
                  onClick={() => setHandle(generateFriendlyHandle())}
                  className="px-4 py-3 text-xs rounded-full"
                  style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
                >
                  {t("xch.fr.random")}
                </button>
              </div>
              <p className={`text-[11px] leading-relaxed ${handleInvalid ? "xch-hint--invalid" : "opacity-45"}`}>
                {handleInvalid
                  ? t("xch.fr.handleInvalid")
                  : t("xch.fr.handleHint")}
              </p>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={t("xch.fr.displayName")}
                className="w-full px-4 py-3 text-sm outline-none"
                style={inputStyle}
              />
              <div className="flex gap-2">
                <button
                  onClick={saveProfile}
                  disabled={saving || handleInvalid || handleTrimmed.length === 0}
                  className="btn-primary flex-1 py-3 text-sm disabled:opacity-40"
                >
                  {saving ? t("xch.fr.savingBtn") : profile ? t("xch.fr.save") : t("xch.fr.create")}
                </button>
                {profile && (
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false);
                      setHandle(profile.handle);
                      setDisplayName(profile.display_name);
                    }}
                    className="px-4 py-3 text-sm rounded-full"
                    style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
                  >
                    {t("xch.fr.cancel")}
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </section>

      {/* ③ 친구 찾기 */}
      <section className="diary-card p-5 mb-4">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("xch.fr.searchTitle")}</p>
        <p className="text-xs opacity-45 mb-3">{t("xch.fr.searchDesc")}</p>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value.toLowerCase());
              setSearched(false);
            }}
            onKeyDown={(e) => { if (e.key === "Enter") searchUsers(); }}
            placeholder={t("xch.fr.searchPlaceholder")}
            className="flex-1 px-4 py-3 text-sm outline-none"
            style={inputStyle}
          />
          <button
            onClick={searchUsers}
            disabled={searching}
            className="px-4 py-3 text-sm rounded-full disabled:opacity-40"
            style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
          >
            {searching ? t("xch.fr.searching") : t("xch.fr.search")}
          </button>
        </div>

        {searched && results.length === 0 && (
          <p className="text-xs opacity-45 mt-3">
            {t("xch.fr.notFound")}
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-3">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={MAX_INVITE_MESSAGE_LENGTH}
              placeholder={t("xch.fr.messagePlaceholder")}
              rows={2}
              className="w-full px-4 py-3 text-sm outline-none resize-none mb-3"
              style={inputStyle}
            />
            <div className="space-y-2">
              {results.map((user) => (
                <div key={user.handle} className="flex items-center justify-between gap-3 p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{user.display_name}</p>
                    <p className="text-xs opacity-45">@{user.handle}</p>
                  </div>
                  <button
                    onClick={() => sendInvite(user.handle)}
                    disabled={invitingHandle !== null}
                    className="text-xs px-3 py-1.5 rounded-full text-white disabled:opacity-40"
                    style={{ background: "var(--deep-gray)" }}
                  >
                    {invitingHandle === user.handle ? t("xch.fr.inviting") : t("xch.fr.invite")}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* ④ 보낸 초대 */}
      <section className="diary-card p-5">
        <p className="text-sm font-medium mb-3" style={{ color: "var(--deep-gray)" }}>{t("xch.fr.sent")}</p>
        {sent.length === 0 ? (
          <p className="text-xs opacity-40">{t("xch.fr.sentEmpty")}</p>
        ) : (
          <div className="space-y-2">
            {sent.map((invite) => (
              <div key={invite.id} className="p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
                <p className="text-sm" style={{ color: "var(--deep-gray)" }}>
                  {t("xch.fr.sentTo", { name: invite.to_profile?.display_name || t("xch.fr.anon") })}
                </p>
                <p className="text-xs opacity-45 mt-1">{t("xch.fr.sentWaiting")}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
