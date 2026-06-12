"use client";

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

type InviteRow = {
  id: string;
  message: string | null;
  from_profile?: ExchangeProfileSearchResult | null;
  to_profile?: ExchangeProfileSearchResult | null;
};

type ConnectMode = "friend" | "random" | "code";

function dayIndexNow(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1;
}

function expiresShort(iso: string, t: (key: DictKey, values?: Record<string, string | number>) => string): string {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return t("xch.rd.expiresSoon");

  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;

  return h > 0 ? t("xch.rd.expiresHM", { h, m }) : t("xch.rd.expiresM", { m });
}

export default function ExchangeHubPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<ExchangeSessionWithPartner[]>([]);
  const [hasOffer, setHasOffer] = useState(false);
  const [submission, setSubmission] = useState<ExchangeRandomSubmission | null>(null);
  const [profile, setProfile] = useState<ExchangeProfile | null>(null);
  const [received, setReceived] = useState<InviteRow[]>([]);
  const [sent, setSent] = useState<InviteRow[]>([]);
  const [mode, setMode] = useState<ConnectMode>("friend");
  const [search, setSearch] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<ExchangeProfileSearchResult[]>([]);
  const [message, setMessage] = useState("");
  const [invitingHandle, setInvitingHandle] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");

  const copy = language === "en"
    ? {
      back: "← Home",
      title: "Exchange Diary",
      addFriend: "+ Add friend",
      writeToday: "Write today’s exchange diary",
      myTurn: "It’s my turn today",
      waiting: "Waiting for your partner’s entry",
      safe: "Exchange safely for 3 days.",
      safeDesc: "If you finish within 3 days including today, the connection remains safe.",
      cancelLocked: "You can end this connection after {days} more day(s).",
      cancelOpen: "You can end this connection now. A reason is optional.",
      emptyTitle: "No current exchange diary yet",
      emptyDesc: "Start with a friend, a random match, or an invite code.",
      newConnection: "Create a new connection",
      friendTitle: "Exchange with a friend",
      friendDesc: "Invite someone you know and write one-on-one.",
      randomTitle: "Random exchange",
      randomDesc: "Quietly exchange with someone new.",
      codeTitle: "Enter invite code",
      codeDesc: "Enter the code your friend sent and begin.",
      lockTitle: "Only one exchange can be active at a time",
      lockDesc: "After this exchange ends, you can make a new connection. Random matching can be delayed when there is no special reason to stop.",
      archive: "Archive",
      archiveEmpty: "No saved exchanges yet",
      archiveDesc: "Active {active} · Past {past}",
      archiveAll: "View full archive",
      guideTitle: "AI exchange guide ✨",
      guideDesc: "We suggest small ideas for today’s conversation and replies.",
      guideQuestion: "What was the warmest moment of your day?",
      guideButton: "View AI reply tone ideas",
      pendingSent: "Pending invites: {count}",
      receivedTitle: "Received invitation",
      profileNeeded: "Set up your exchange profile before inviting friends.",
      profileGo: "Go to friend settings",
      randomWaiting: "Waiting for a random match",
      randomGo: "Go to random exchange",
      codeGuide: "Invite-code entry is managed from the friend page.",
    }
    : {
      back: "← 홈으로",
      title: "교환일기",
      addFriend: "+ 친구 추가",
      writeToday: "오늘의 교환일기 쓰기",
      myTurn: "오늘 내 차례예요",
      waiting: "상대의 기록을 기다리는 중이에요",
      safe: "교환은 3일 동안 이어져요.",
      safeDesc: "오늘을 포함해 3일 내에 마무리하면 안전해요.",
      cancelLocked: "마무리는 {days}일 뒤부터 가능해요.",
      cancelOpen: "마무리는 지금 가능해요. 안전 사유는 언제든 남길 수 있어요.",
      emptyTitle: "진행 중인 교환일기가 없어요",
      emptyDesc: "친구 초대, 랜덤 교환, 초대 코드로 새로운 연결을 만들어보세요.",
      newConnection: "새 연결 만들기",
      friendTitle: "친구와 교환하기",
      friendDesc: "아는 사람을 초대해서 1:1로 교환해요.",
      randomTitle: "랜덤 교환하기",
      randomDesc: "새로운 한 사람과 조용히 교환해요.",
      codeTitle: "초대 코드 입력",
      codeDesc: "친구가 보낸 코드를 입력하고 교환을 시작해요.",
      lockTitle: "교환은 한 번에 한 명과만 가능해요",
      lockDesc: "현재 진행 중인 교환이 끝나야 새로운 연결을 만들 수 있어요. 특별한 이유 없는 중단은 매칭 페널티가 생길 수 있어요.",
      archive: "보관함",
      archiveEmpty: "아직 보관된 교환일기가 없어요",
      archiveDesc: "진행 {active}권 · 지난 {past}권",
      archiveAll: "보관함 전체 보기",
      guideTitle: "AI 교환 가이드 ✨",
      guideDesc: "오늘의 대화와 응답의 톤 아이디어를 제안해요.",
      guideQuestion: "오늘 하루 중 가장 따뜻했던 순간은 언제였나요?",
      guideButton: "AI 추천 답장 톤 보기",
      pendingSent: "보낸 초대 대기 {count}건",
      receivedTitle: "받은 초대",
      profileNeeded: "친구를 초대하려면 교환 프로필을 먼저 설정해주세요.",
      profileGo: "친구 설정으로 이동",
      randomWaiting: "랜덤 매칭을 기다리는 중이에요",
      randomGo: "랜덤 교환으로 이동",
      codeGuide: "초대 코드 입력은 친구 관리 페이지에서 진행할 수 있어요.",
    };

  const load = useCallback(async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      router.push("/auth");
      return;
    }

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
    load();
  }, [load]);

  const { active, past } = useMemo(() => ({
    active: sessions.filter((session) => ACTIVE_STATUSES.includes(session.status)),
    past: sessions.filter((session) => !ACTIVE_STATUSES.includes(session.status)),
  }), [sessions]);

  const slot = active[0] ?? null;
  const slotDay = slot ? Math.min(Math.max(dayIndexNow(slot.started_at), 1), 7) : 0;
  const slotRawDay = slot ? dayIndexNow(slot.started_at) : 0;
  const cancelRemain = slot ? Math.max(MIN_DAYS_BEFORE_TERMINATE - slotRawDay + 1, 0) : 0;
  const partnerName = slot?.partner_display_name || t("xch.fr.anon");
  const archiveDescription = sessions.length === 0
    ? copy.archiveEmpty
    : copy.archiveDesc.replace("{active}", String(active.length)).replace("{past}", String(past.length));

  const searchUsers = async () => {
    setStatusText("");
    const query = search.trim().toLowerCase();

    if (query.length < 2) {
      setStatusText(t("xch.fr.searchMin"));
      return;
    }

    setSearching(true);
    const response = await fetch(`/api/exchange/users?handle=${encodeURIComponent(query)}`, { cache: "no-store" });
    const data = await response.json();

    if (response.ok) {
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

    const response = await fetch("/api/exchange/friend-invites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to_handle: toHandle, message }),
    });
    const data = await response.json();

    if (response.ok) {
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
    setBusy(true);
    setStatusText("");

    const response = await fetch(`/api/exchange/friend-invites/${inviteId}/${action}`, { method: "POST" });
    const data = await response.json();

    if (response.ok) {
      if (data.session?.id) {
        router.push(`/exchange/${data.session.id}`);
        return;
      }

      setStatusText(action === "accept" ? t("xch.fr.accepted") : t("xch.fr.declined"));
      await load();
    } else {
      setStatusText(data.error || t("xch.manage.fallbackFail"));
    }

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
    <main className="exchange-hub-page exchange-hub-page--reference">
      <header className="exchange-reference-header">
        <button type="button" onClick={() => router.push("/")} className="exchange-reference-header__back">
          {copy.back}
        </button>
        <h1>{copy.title}</h1>
        <Link href="/exchange/friends" className="exchange-reference-header__add">
          {copy.addFriend}
        </Link>
      </header>

      {hasOffer && !slot && (
        <Link href="/exchange/random" className="exchange-offer-banner">
          <span aria-hidden="true">🎲</span>
          <span>
            <strong>{language === "ko" ? "새로운 랜덤 교환 제안이 도착했어요" : "A new random exchange offer arrived"}</strong>
            <em>{language === "ko" ? "놓치기 전에 확인해보세요." : "Check it before it expires."}</em>
          </span>
          <b aria-hidden="true">→</b>
        </Link>
      )}

      {statusText && <p className="exchange-status" role="status">{statusText}</p>}

      <section className="exchange-current-card">
        <div className="exchange-current-card__profile">
          <span className="exchange-current-card__avatar" aria-hidden="true">
            {slot ? partnerName.slice(0, 1) : "?"}
          </span>
          <div>
            <div className="exchange-current-card__title-row">
              <h2>{slot ? `${partnerName}${language === "ko" ? "님과의 교환일기" : "’s exchange diary"}` : copy.emptyTitle}</h2>
              {slot && <span>Day {slotDay}</span>}
            </div>
            <p className="exchange-current-card__turn">⏱ {slot ? copy.myTurn : copy.emptyDesc}</p>
            <p className="exchange-current-card__safe">🛡 {copy.safe}</p>
            <p className="exchange-current-card__safe-desc">{slot ? copy.safeDesc : copy.lockDesc}</p>
          </div>
        </div>

        <div className="exchange-current-card__cta">
          {slot ? (
            <Link href={`/exchange/${slot.id}`}>{copy.writeToday} <span aria-hidden="true">›</span></Link>
          ) : (
            <button type="button" onClick={() => setMode("friend")}>{copy.friendTitle} <span aria-hidden="true">›</span></button>
          )}
          <p>{slot && cancelRemain > 0 ? copy.cancelLocked.replace("{days}", String(cancelRemain)) : slot ? copy.cancelOpen : copy.waiting}</p>
        </div>

        <div className="exchange-current-card__art" aria-hidden="true">
          <span className="exchange-art-book">📖</span>
          <span className="exchange-art-envelope">💌</span>
          <span className="exchange-art-pencil">✎</span>
          <span className="exchange-art-sparkle exchange-art-sparkle--one">✦</span>
          <span className="exchange-art-sparkle exchange-art-sparkle--two">✣</span>
        </div>
      </section>

      <section className="exchange-connect-section" aria-label={copy.newConnection}>
        <h2>{copy.newConnection}</h2>
        <div className="exchange-connect-grid">
          <button type="button" onClick={() => setMode("friend")} className={`exchange-connect-card ${mode === "friend" ? "exchange-connect-card--active" : ""}`}>
            <span className="exchange-connect-card__icon" aria-hidden="true">👭</span>
            <span>
              <strong>{copy.friendTitle}</strong>
              <em>{copy.friendDesc}</em>
            </span>
            <b aria-hidden="true">→</b>
          </button>
          <button type="button" onClick={() => setMode("random")} className={`exchange-connect-card exchange-connect-card--green ${mode === "random" ? "exchange-connect-card--active" : ""}`}>
            <span className="exchange-connect-card__icon" aria-hidden="true">🌱</span>
            <span>
              <strong>{copy.randomTitle}</strong>
              <em>{copy.randomDesc}</em>
            </span>
            <b aria-hidden="true">→</b>
          </button>
          <button type="button" onClick={() => setMode("code")} className={`exchange-connect-card exchange-connect-card--gold ${mode === "code" ? "exchange-connect-card--active" : ""}`}>
            <span className="exchange-connect-card__icon" aria-hidden="true">&lt;/&gt;</span>
            <span>
              <strong>{copy.codeTitle}</strong>
              <em>{copy.codeDesc}</em>
            </span>
            <b aria-hidden="true">→</b>
          </button>
        </div>
      </section>

      <section className="exchange-action-panel">
        {slot ? (
          <div className="exchange-lock-note">
            <span aria-hidden="true">🔒</span>
            <div>
              <strong>{copy.lockTitle}</strong>
              <p>{copy.lockDesc}</p>
            </div>
            <Link href="/exchange/archive">{language === "ko" ? "자세히 보기" : "Learn more"} ›</Link>
          </div>
        ) : mode === "friend" ? (
          <div className="exchange-friend-panel">
            <div className="exchange-panel-head">
              <h3>{copy.friendTitle}</h3>
              <div className="exchange-pending-chips">
                {received.length > 0 && <span>{copy.receivedTitle} {received.length}</span>}
                {sent.length > 0 && <span>{copy.pendingSent.replace("{count}", String(sent.length))}</span>}
              </div>
            </div>

            {received.map((invite) => (
              <article key={invite.id} className="exchange-invite-card">
                <p>{t("xch.fr.inviteFrom", { name: invite.from_profile?.display_name || t("xch.fr.anon") })}</p>
                {invite.message && <span>{invite.message}</span>}
                <div>
                  <button type="button" onClick={() => respondInvite(invite.id, "accept")} disabled={busy}>{t("xch.fr.accept")}</button>
                  <button type="button" onClick={() => respondInvite(invite.id, "decline")} disabled={busy}>{t("xch.fr.decline")}</button>
                </div>
              </article>
            ))}

            {!profile ? (
              <p className="exchange-profile-needed">
                {copy.profileNeeded} <Link href="/exchange/friends">{copy.profileGo}</Link>
              </p>
            ) : (
              <>
                <div className="exchange-search-row">
                  <input
                    value={search}
                    onChange={(event) => {
                      setSearch(event.target.value.toLowerCase());
                      setSearched(false);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") searchUsers();
                    }}
                    placeholder={t("xch.fr.searchPlaceholder")}
                  />
                  <button type="button" onClick={searchUsers} disabled={searching}>
                    {searching ? t("xch.fr.searching") : t("xch.fr.search")}
                  </button>
                </div>
                {searched && results.length === 0 && <p className="exchange-empty-result">{t("xch.fr.notFound")}</p>}
                {results.length > 0 && (
                  <div className="exchange-result-list">
                    <textarea
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={t("xch.fr.messagePlaceholder")}
                      rows={2}
                    />
                    {results.map((user) => (
                      <article key={user.handle}>
                        <div>
                          <strong>{user.display_name}</strong>
                          <span>@{user.handle}</span>
                        </div>
                        <button type="button" onClick={() => sendInvite(user.handle)} disabled={invitingHandle !== null}>
                          {invitingHandle === user.handle ? t("xch.fr.inviting") : t("xch.fr.invite")}
                        </button>
                      </article>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        ) : mode === "random" ? (
          <div className="exchange-random-panel">
            {submission ? (
              <>
                <span className="exchange-random-panel__pulse" aria-hidden="true" />
                <div>
                  <strong>{copy.randomWaiting}</strong>
                  <p>{expiresShort(submission.expires_at, t)}</p>
                </div>
                <Link href="/exchange/random">{copy.randomGo} ›</Link>
              </>
            ) : (
              <>
                <span aria-hidden="true">🎲</span>
                <div>
                  <strong>{copy.randomTitle}</strong>
                  <p>{copy.randomDesc}</p>
                </div>
                <Link href="/exchange/random">{copy.randomGo} ›</Link>
              </>
            )}
          </div>
        ) : (
          <div className="exchange-code-panel">
            <span aria-hidden="true">📮</span>
            <div>
              <strong>{copy.codeTitle}</strong>
              <p>{copy.codeGuide}</p>
            </div>
            <Link href="/exchange/friends">{copy.codeTitle} ›</Link>
          </div>
        )}
      </section>

      <section className="exchange-bottom-grid">
        <Link href="/exchange/archive" className="exchange-archive-card">
          <span aria-hidden="true">🗂️</span>
          <div>
            <h2>{copy.archive}</h2>
            <p>{archiveDescription}</p>
            {slot && <em>{partnerName} · Day {slotDay}</em>}
          </div>
          <strong>{copy.archiveAll} ›</strong>
        </Link>

        <article className="exchange-guide-card">
          <div>
            <h2>{copy.guideTitle}</h2>
            <p>{copy.guideDesc}</p>
            <blockquote>“{copy.guideQuestion}”</blockquote>
            <Link href={slot ? `/exchange/${slot.id}` : "/exchange/random"}>{copy.guideButton} →</Link>
          </div>
          <span aria-hidden="true">🌱</span>
        </article>
      </section>
    </main>
  );
}
