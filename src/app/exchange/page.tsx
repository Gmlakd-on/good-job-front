"use client";

import Image from "next/image";
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
  const [friendModalOpen, setFriendModalOpen] = useState(false);
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
      cancelLocked: "You can end this connection after {days} more day(s).",
      cancelOpen: "You can end this connection now. A reason is optional.",
      emptyTitle: "No current exchange diary yet",
      emptyDesc: "Create a new connection through a friend invitation or random exchange.",
      newConnection: "Create a new connection",
      friendTitle: "Invite a friend",
      friendDesc: "Search a friend ID and start a one-on-one diary.",
      randomTitle: "Random exchange",
      randomDesc: "Quietly exchange with someone new.",
      archive: "Archive",
      archiveEmpty: "No saved exchanges yet",
      archiveDesc: "Active {active} · Past {past}",
      archiveAll: "View full archive",
      pendingSent: "Pending invites: {count}",
      receivedTitle: "Received invitation",
      profileNeeded: "Set up your exchange profile before inviting friends.",
      profileGo: "Go to friend settings",
      randomWaiting: "Waiting for a random match",
      randomGo: "Go to random exchange",
      modalTitle: "Invite a friend",
      modalDesc: "Enter your friend’s ID and send an invitation.",
      close: "Close",
    }
    : {
      back: "← 홈으로",
      title: "교환일기",
      addFriend: "+ 친구 추가",
      writeToday: "오늘의 교환일기 쓰기",
      myTurn: "오늘 내 차례예요",
      waiting: "상대의 기록을 기다리는 중이에요",
      cancelLocked: "마무리는 {days}일 뒤부터 가능해요.",
      cancelOpen: "마무리는 지금 가능해요. 안전 사유는 언제든 남길 수 있어요.",
      emptyTitle: "진행 중인 교환일기가 없어요",
      emptyDesc: "친구 초대나 랜덤 교환으로 새로운 연결을 만들어보세요.",
      newConnection: "새 연결 만들기",
      friendTitle: "친구 초대",
      friendDesc: "친구 아이디를 검색해 1:1 교환을 시작해요.",
      randomTitle: "랜덤 교환",
      randomDesc: "새로운 한 사람과 조용히 교환해요.",
      archive: "보관함",
      archiveEmpty: "아직 보관된 교환일기가 없어요",
      archiveDesc: "진행 {active}권 · 지난 {past}권",
      archiveAll: "보관함 전체 보기",
      pendingSent: "보낸 초대 대기 {count}건",
      receivedTitle: "받은 초대",
      profileNeeded: "친구를 초대하려면 교환 프로필을 먼저 설정해주세요.",
      profileGo: "친구 설정으로 이동",
      randomWaiting: "랜덤 매칭을 기다리는 중이에요",
      randomGo: "랜덤 교환으로 이동",
      modalTitle: "친구와 교환하기",
      modalDesc: "친구 아이디를 검색하고 초대장을 보내보세요.",
      close: "닫기",
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
    void load();
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
      setFriendModalOpen(false);
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

  const openFriendModal = () => {
    setFriendModalOpen(true);
    setStatusText("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.loading")}</p>
      </div>
    );
  }

  return (
    <main className="exchange-hub-page exchange-hub-page--reference exchange-hub-page--polished">
      <header className="exchange-reference-header">
        <button type="button" onClick={() => router.push("/")} className="exchange-reference-header__back">
          {copy.back}
        </button>
        <h1>{copy.title}</h1>
        <button type="button" onClick={openFriendModal} className="exchange-reference-header__add">
          {copy.addFriend}
        </button>
      </header>

      {hasOffer && !slot && (
        <Link href="/exchange/random" className="exchange-offer-banner">
          <Image src="/home-icons/exchange.png" alt="" width={48} height={48} />
          <span>
            <strong>{language === "ko" ? "새로운 랜덤 교환 제안이 도착했어요" : "A new random exchange offer arrived"}</strong>
            <em>{language === "ko" ? "놓치기 전에 확인해보세요." : "Check it before it expires."}</em>
          </span>
          <b aria-hidden="true">→</b>
        </Link>
      )}

      {statusText && <p className="exchange-status" role="status">{statusText}</p>}

      <section className="exchange-current-card exchange-current-card--compact">
        <div className="exchange-current-card__profile">
          <span className="exchange-current-card__avatar" aria-hidden="true">
            {slot ? partnerName.slice(0, 1) : "?"}
          </span>
          <div>
            <div className="exchange-current-card__title-row">
              <h2>{slot ? `${partnerName}${language === "ko" ? "님과의 교환일기" : "’s exchange diary"}` : copy.emptyTitle}</h2>
              {slot && <span>Day {slotDay}</span>}
            </div>
            <p className="exchange-current-card__turn">{slot ? copy.myTurn : copy.emptyDesc}</p>
            {slot && (
              <p className="exchange-current-card__safe-desc">
                {cancelRemain > 0 ? copy.cancelLocked.replace("{days}", String(cancelRemain)) : copy.cancelOpen}
              </p>
            )}
          </div>
        </div>

        {slot && (
          <div className="exchange-current-card__cta exchange-current-card__cta--small">
            <Link href={`/exchange/${slot.id}`}>{copy.writeToday} <span aria-hidden="true">›</span></Link>
            <p>{copy.waiting}</p>
          </div>
        )}

        <div className="exchange-current-card__image" aria-hidden="true">
          <Image src="/home-icons/exchange.png" alt="" width={168} height={168} priority />
        </div>
      </section>

      <section className="exchange-connect-section" aria-label={copy.newConnection}>
        <h2>{copy.newConnection}</h2>
        <div className="exchange-connect-grid exchange-connect-grid--two">
          <button type="button" onClick={openFriendModal} className="exchange-connect-card exchange-connect-card--active">
            <span className="exchange-connect-card__image" aria-hidden="true">
              <Image src="/home-icons/exchange.png" alt="" width={56} height={56} />
            </span>
            <span>
              <strong>{copy.friendTitle}</strong>
              <em>{copy.friendDesc}</em>
            </span>
            <b aria-hidden="true">→</b>
          </button>
          <Link href="/exchange/random" className="exchange-connect-card exchange-connect-card--green">
            <span className="exchange-connect-card__image" aria-hidden="true">
              <Image src="/home-icons/refresh-card.png" alt="" width={56} height={56} />
            </span>
            <span>
              <strong>{submission ? copy.randomWaiting : copy.randomTitle}</strong>
              <em>{submission ? expiresShort(submission.expires_at, t) : copy.randomDesc}</em>
            </span>
            <b aria-hidden="true">→</b>
          </Link>
        </div>
      </section>

      <section className="exchange-bottom-grid exchange-bottom-grid--single">
        <Link href="/exchange/archive" className="exchange-archive-card">
          <span className="exchange-archive-card__image" aria-hidden="true">
            <Image src="/home-icons/exchange.png" alt="" width={54} height={54} />
          </span>
          <div>
            <h2>{copy.archive}</h2>
            <p>{archiveDescription}</p>
            {slot && <em>{partnerName} · Day {slotDay}</em>}
          </div>
          <strong>{copy.archiveAll} ›</strong>
        </Link>
      </section>

      {friendModalOpen && (
        <div className="exchange-friend-modal" role="dialog" aria-modal="true" aria-labelledby="exchange-friend-modal-title">
          <div className="exchange-friend-modal__backdrop" onClick={() => setFriendModalOpen(false)} />
          <section className="exchange-friend-modal__card">
            <header>
              <div>
                <p>{copy.friendTitle}</p>
                <h2 id="exchange-friend-modal-title">{copy.modalTitle}</h2>
                <span>{copy.modalDesc}</span>
              </div>
              <button type="button" onClick={() => setFriendModalOpen(false)} aria-label={copy.close}>×</button>
            </header>

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
                      if (event.key === "Enter") void searchUsers();
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
                    {results.map((friend) => (
                      <article key={friend.handle}>
                        <div>
                          <strong>{friend.display_name}</strong>
                          <span>@{friend.handle}</span>
                        </div>
                        <button type="button" onClick={() => sendInvite(friend.handle)} disabled={invitingHandle !== null}>
                          {invitingHandle === friend.handle ? t("xch.fr.inviting") : t("xch.fr.invite")}
                        </button>
                      </article>
                    ))}
                  </div>
                )}

                {sent.length > 0 && <p className="exchange-empty-result">{copy.pendingSent.replace("{count}", String(sent.length))}</p>}
              </>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
