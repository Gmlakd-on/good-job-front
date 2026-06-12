"use client";

/**
 * 교환일기 허브 = 한 화면 대시보드.
 *
 * 설계 원칙 (1인 1교환 정책 반영):
 * ① 슬롯 카드 — "지금의 교환" 1자리. 차 있으면 파트너+Day 진행+오늘 쓰기 CTA,
 *    비어 있으면 빈 슬롯 상태로 아래 연결 패널을 안내.
 * ② 새 연결 패널 — 같은 화면에서 [친구 초대|랜덤 매칭] 탭으로 검색→초대→대기를
 *    바로 진행. 받은 초대·보낸 초대 대기·랜덤 대기 상태가 전부 칩/행으로 동시에 보임.
 *    슬롯이 차 있으면 패널은 잠금(1인 제한 안내) — 백엔드 가드와 동일 정책.
 * ③ 보관함 — 단일 아카이브 진입점. 진행/지난 권수만 보여주고 상세는 /exchange/archive.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  type ExchangeProfile,
  type ExchangeProfileSearchResult,
  type ExchangeRandomSubmission,
  type ExchangeSessionStatus,
  type ExchangeSessionWithPartner,
} from "@/types/exchange";

const ACTIVE_STATUSES: ExchangeSessionStatus[] = ["active_7day", "extension_pending", "extended"];
const MIN_DAYS_BEFORE_TERMINATE = 3;

const inputStyle = {
  borderRadius: "var(--radius-md)",
  background: "var(--cream-deep)",
  color: "var(--text-primary)",
} as const;

type InviteRow = {
  id: string;
  message: string | null;
  from_profile?: ExchangeProfileSearchResult | null;
  to_profile?: ExchangeProfileSearchResult | null;
};

function dayIndexNow(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1;
}

function expiresShort(iso: string, t: (k: DictKey, v?: Record<string, string | number>) => string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t("xch.rd.expiresSoon");
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? t("xch.rd.expiresHM", { h, m }) : t("xch.rd.expiresM", { m });
}

export default function ExchangeHubPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ExchangeSessionWithPartner[]>([]);
  const [hasOffer, setHasOffer] = useState(false);
  const [submission, setSubmission] = useState<ExchangeRandomSubmission | null>(null);
  const [profile, setProfile] = useState<ExchangeProfile | null>(null);
  const [received, setReceived] = useState<InviteRow[]>([]);
  const [sent, setSent] = useState<InviteRow[]>([]);
  const [tab, setTab] = useState<"friend" | "random">("friend");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<ExchangeProfileSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [invitingHandle, setInvitingHandle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }

    const [sessionsRes, offerRes, subRes, profileRes, invitesRes] = await Promise.all([
      fetch("/api/exchange/sessions", { cache: "no-store" }),
      fetch("/api/exchange/random/current-offer", { cache: "no-store" }),
      fetch("/api/exchange/random/submission", { cache: "no-store" }),
      fetch("/api/exchange/profile", { cache: "no-store" }),
      fetch("/api/exchange/friend-invites", { cache: "no-store" }),
    ]);
    if (sessionsRes.ok) setSessions((await sessionsRes.json()).sessions || []);
    if (offerRes.ok) setHasOffer(Boolean((await offerRes.json()).offer));
    if (subRes.ok) setSubmission((await subRes.json()).submission ?? null);
    if (profileRes.ok) setProfile((await profileRes.json()).profile ?? null);
    if (invitesRes.ok) {
      const data = await invitesRes.json();
      setReceived(data.received || []);
      setSent(data.sent || []);
    }
    setLoading(false);
  }, [router]);

  useEffect(() => {
    // 마운트 시 1회 초기 로드
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const { active, past } = useMemo(() => ({
    active: sessions.filter((s) => ACTIVE_STATUSES.includes(s.status)),
    past: sessions.filter((s) => !ACTIVE_STATUSES.includes(s.status)),
  }), [sessions]);

  const slot = active[0] ?? null;
  const slotDay = slot ? Math.min(Math.max(dayIndexNow(slot.started_at), 1), 7) : 0;
  const slotRawDay = slot ? dayIndexNow(slot.started_at) : 0;
  const cancelRemain = slot ? Math.max(MIN_DAYS_BEFORE_TERMINATE - slotRawDay + 1, 0) : 0;

  const searchUsers = async () => {
    setStatusText("");
    const q = search.trim().toLowerCase();
    if (q.length < 2) { setStatusText(t("xch.fr.searchMin")); return; }
    setSearching(true);
    const res = await fetch(`/api/exchange/users?handle=${encodeURIComponent(q)}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) { setResults(data.users || []); setSearched(true); }
    else setStatusText(data.error || t("xch.fr.searchFail"));
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
      setMessage(""); setResults([]); setSearched(false); setSearch("");
      await load();
    } else setStatusText(data.error || t("xch.fr.inviteFail"));
    setInvitingHandle(null);
  };

  const respondInvite = async (inviteId: string, action: "accept" | "decline") => {
    setBusy(true);
    setStatusText("");
    const res = await fetch(`/api/exchange/friend-invites/${inviteId}/${action}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      if (data.session?.id) { router.push(`/exchange/${data.session.id}`); return; }
      setStatusText(action === "accept" ? t("xch.fr.accepted") : t("xch.fr.declined"));
      await load();
    } else setStatusText(data.error || t("xch.manage.fallbackFail"));
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.loading")}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-5">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("xch.back.home")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("xch.title")}</h1>
        <Link href="/exchange/friends" className="text-sm opacity-60 hover:opacity-90">{t("xch.friends")}</Link>
      </div>

      {hasOffer && (
        <Link href="/exchange/random" className="diary-card xch-offer-banner mb-4">
          <span aria-hidden="true">🎲</span>
          <span className="flex-1">
            <span className="text-sm font-medium block" style={{ color: "var(--deep-gray)" }}>{t("xch.hub.offerBanner")}</span>
            <span className="text-xs opacity-50">{t("xch.hub.offerBannerDesc")}</span>
          </span>
          <span className="xch-card__arrow" aria-hidden="true">→</span>
        </Link>
      )}

      {statusText && (
        <div className="diary-card p-3 mb-4 text-sm" role="status" style={{ color: "var(--deep-gray)" }}>{statusText}</div>
      )}

      {/* ① 슬롯: 지금의 교환 */}
      <section className="diary-card p-5 mb-4 hub-slot">
        <p className="hub-slot__eyebrow">{t("hub.slotTitle")}</p>
        {slot ? (
          <>
            <div className="flex items-center gap-3 mt-2">
              <span className="xch-card__avatar" aria-hidden="true">
                {(slot.partner_display_name || "?").slice(0, 1)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate" style={{ color: "var(--deep-gray)" }}>
                  {t("xch.card.with", { name: slot.partner_display_name || t("xch.fr.anon") })}
                </p>
                <span className="xch-card__days" aria-label={t("xch.card.dayAria", { n: slotDay })}>
                  {Array.from({ length: 7 }, (_, i) => (
                    <span key={i} className={`xch-card__dot ${i < slotDay ? "xch-card__dot--past" : ""} ${i === slotDay - 1 ? "xch-card__dot--today" : ""}`} />
                  ))}
                  <span className="xch-card__day-label">{t("xch.card.day", { n: slotDay })}</span>
                </span>
              </div>
            </div>
            <Link href={`/exchange/${slot.id}`} className="btn-primary w-full py-3 text-sm text-center block mt-4">
              {t("hub.writeToday")}
            </Link>
            <p className="text-[11px] opacity-40 mt-2 text-center">
              {cancelRemain > 0 ? t("hub.cancelLockD", { d: cancelRemain }) : t("hub.cancelOpen")}
            </p>
          </>
        ) : (
          <div className="hub-slot__empty">
            <span className="hub-slot__ring" aria-hidden="true">💌</span>
            <p className="text-sm font-medium mt-3" style={{ color: "var(--deep-gray)" }}>{t("hub.slotEmpty")}</p>
            <p className="text-xs opacity-45 mt-1 leading-relaxed">{t("hub.slotEmptyDesc")}</p>
          </div>
        )}
      </section>

      {/* ② 새 연결 패널 */}
      <section className="diary-card p-5 mb-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{t("hub.newConn")}</p>
          {/* 동시 진행 상태 칩 — 항상 보임 */}
          <div className="hub-chips">
            {sent.length > 0 && <span className="hub-chip">{t("hub.sentPending", { n: sent.length })}</span>}
            {submission && <span className="hub-chip hub-chip--live">{t("hub.randomWaiting", { time: expiresShort(submission.expires_at, t) })}</span>}
          </div>
        </div>

        {slot ? (
          <div className="hub-locked" role="note">
            <p className="text-sm" style={{ color: "var(--deep-gray)" }}>🔒 {t("hub.locked")}</p>
            <p className="text-xs opacity-50 mt-1 leading-relaxed">{t("hub.lockedDesc")}</p>
          </div>
        ) : (
          <>
            <div className="hub-tabs" role="tablist" aria-label={t("hub.newConn")}>
              <button role="tab" aria-selected={tab === "friend"} onClick={() => setTab("friend")}
                className={`hub-tab ${tab === "friend" ? "hub-tab--active" : ""}`}>
                {t("hub.tabFriend")}
                {received.length > 0 && <span className="xch-received__badge">{received.length}</span>}
              </button>
              <button role="tab" aria-selected={tab === "random"} onClick={() => setTab("random")}
                className={`hub-tab ${tab === "random" ? "hub-tab--active" : ""}`}>
                {t("hub.tabRandom")}
                {(submission || hasOffer) && <span className="hub-tab__dot" aria-hidden="true" />}
              </button>
            </div>

            {tab === "friend" && (
              <div className="mt-4">
                {/* 받은 초대 — 가장 즉시 행동 가능 */}
                {received.map((invite) => (
                  <div key={invite.id} className="p-3 rounded-xl mb-2" style={{ background: "var(--warm-bg)" }}>
                    <p className="text-sm" style={{ color: "var(--deep-gray)" }}>
                      {t("xch.fr.inviteFrom", { name: invite.from_profile?.display_name || t("xch.fr.anon") })}
                    </p>
                    {invite.message && <p className="text-xs opacity-50 mt-1">{invite.message}</p>}
                    <div className="flex gap-2 mt-3">
                      <button onClick={() => respondInvite(invite.id, "accept")} disabled={busy} className="btn-primary px-4 py-2 text-xs disabled:opacity-40">{t("xch.fr.accept")}</button>
                      <button onClick={() => respondInvite(invite.id, "decline")} disabled={busy} className="px-4 py-2 text-xs rounded-full disabled:opacity-40" style={{ background: "var(--paper-white)", color: "var(--deep-gray)" }}>{t("xch.fr.decline")}</button>
                    </div>
                  </div>
                ))}

                {!profile ? (
                  <p className="text-xs opacity-55 leading-relaxed">
                    {t("hub.profileNeeded")}{" "}
                    <Link href="/exchange/friends" className="underline opacity-80 hover:opacity-100">{t("hub.profileGo")}</Link>
                  </p>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <input
                        value={search}
                        onChange={(e) => { setSearch(e.target.value.toLowerCase()); setSearched(false); }}
                        onKeyDown={(e) => { if (e.key === "Enter") searchUsers(); }}
                        placeholder={t("xch.fr.searchPlaceholder")}
                        className="flex-1 px-4 py-3 text-sm outline-none"
                        style={inputStyle}
                      />
                      <button onClick={searchUsers} disabled={searching} className="px-4 py-3 text-sm rounded-full disabled:opacity-40" style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}>
                        {searching ? t("xch.fr.searching") : t("xch.fr.search")}
                      </button>
                    </div>
                    {searched && results.length === 0 && (
                      <p className="text-xs opacity-45 mt-3">{t("xch.fr.notFound")}</p>
                    )}
                    {results.length > 0 && (
                      <div className="mt-3">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder={t("xch.fr.messagePlaceholder")}
                          rows={2}
                          className="w-full px-4 py-3 text-sm outline-none resize-none mb-2"
                          style={inputStyle}
                        />
                        {results.map((user) => (
                          <div key={user.handle} className="flex items-center justify-between gap-3 p-3 rounded-xl mb-2" style={{ background: "var(--warm-bg)" }}>
                            <div>
                              <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{user.display_name}</p>
                              <p className="text-xs opacity-45">@{user.handle}</p>
                            </div>
                            <button onClick={() => sendInvite(user.handle)} disabled={invitingHandle !== null} className="text-xs px-3 py-1.5 rounded-full text-white disabled:opacity-40" style={{ background: "var(--deep-gray)" }}>
                              {invitingHandle === user.handle ? t("xch.fr.inviting") : t("xch.fr.invite")}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                    {sent.length > 0 && (
                      <p className="text-[11px] opacity-40 mt-2">
                        {t("hub.sentPending", { n: sent.length })} — {sent.map((i) => i.to_profile?.display_name || t("xch.fr.anon")).join(", ")}
                      </p>
                    )}
                  </>
                )}
              </div>
            )}

            {tab === "random" && (
              <div className="mt-4">
                {submission ? (
                  <div className="p-3 rounded-xl" style={{ background: "var(--warm-bg)" }}>
                    <div className="xch-wait__head">
                      <span className="xch-wait__pulse" aria-hidden="true" />
                      <p className="text-sm" style={{ color: "var(--deep-gray)" }}>{t("xch.rd.waitingTitle")}</p>
                    </div>
                    <p className="text-xs opacity-50 mt-1">{expiresShort(submission.expires_at, t)}</p>
                    <Link href="/exchange/random" className="text-xs underline opacity-60 hover:opacity-90 mt-2 inline-block">
                      {t("hub.detailLink")}
                    </Link>
                  </div>
                ) : (
                  <Link href="/exchange/random" className="hub-random-cta">
                    <span aria-hidden="true">🎲</span>
                    <span className="flex-1">
                      <span className="text-sm font-medium block" style={{ color: "var(--deep-gray)" }}>{t("hub.randomGo")}</span>
                      <span className="text-xs opacity-50">{t("hub.randomGoDesc")}</span>
                    </span>
                    <span className="xch-card__arrow" aria-hidden="true">→</span>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </section>

      {/* ③ 보관함 */}
      <Link href="/exchange/archive" className="diary-card hub-archive">
        <span className="hub-archive__icon" aria-hidden="true">🗂️</span>
        <span className="flex-1">
          <span className="text-sm font-medium block" style={{ color: "var(--deep-gray)" }}>{t("hub.archive")}</span>
          <span className="text-xs opacity-50">
            {sessions.length === 0 ? t("hub.archiveEmpty") : t("hub.archiveDesc", { active: active.length, past: past.length })}
          </span>
        </span>
        <span className="xch-card__arrow" aria-hidden="true">→</span>
      </Link>
    </div>
  );
}
