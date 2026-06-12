"use client";

/**
 * 교환일기 세션.
 * 이번 패스 추가:
 * - 연장 투표 UI: Day 7 도달/extension_pending/상대 투표 완료 시 "계속/마무리" 카드.
 *   API의 extension {my_vote, partner_voted}를 드디어 화면에 연결 (기존엔 받기만 하고 버렸음).
 * - 관리 패널(⋯): 중단(사유 선택, 안전 사유는 패널티 없음 명시, 차단 동시 선택), 신고, 차단.
 * - day 계산을 백엔드와 동일한 공식(시작 시각 기준 24시간 창)으로 정렬 —
 *   기존 달력(toDateString) 기준은 backend day_index와 어긋날 수 있었음.
 * - 전체 i18n 연결.
 */
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import {
  MAX_EXCHANGE_ENTRY_LENGTH,
  MAX_EXCHANGE_REPORT_DETAIL_LENGTH,
  SAFE_TERMINATION_REASONS,
  TERMINATION_REASONS,
  type ExchangeEntry,
  type ExchangeSessionWithPartner,
  type ExtensionVote,
  type TerminationReasonCode,
} from "@/types/exchange";

type EntryForView = ExchangeEntry & {
  content: string | null;
  is_visible: boolean;
  is_mine: boolean;
};

type ExtensionState = { my_vote: ExtensionVote | null; partner_voted: boolean };

const ACTIVE_STATUSES = ["active_7day", "extension_pending", "extended"];

const inputStyle = {
  borderRadius: "var(--radius-md)",
  background: "var(--cream-deep)",
  color: "var(--text-primary)",
} as const;

/** 백엔드와 동일한 day 공식: 시작 시각으로부터 24시간 단위, 1부터 */
function dayIndexNow(startedAt: string): number {
  return Math.floor((Date.now() - new Date(startedAt).getTime()) / 86400000) + 1;
}

export default function ExchangeSessionPage() {
  const params = useParams<{ sessionId: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const sessionId = params.sessionId;
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState<string | null>(null);
  const [session, setSession] = useState<ExchangeSessionWithPartner | null>(null);
  const [entries, setEntries] = useState<EntryForView[]>([]);
  const [extension, setExtension] = useState<ExtensionState>({ my_vote: null, partner_voted: false });
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [saving, setSaving] = useState(false);
  const [statusText, setStatusText] = useState("");
  // 관리 패널 상태
  const [manageOpen, setManageOpen] = useState(false);
  const [managePane, setManagePane] = useState<"menu" | "terminate" | "report" | "block">("menu");
  const [termReason, setTermReason] = useState<TerminationReasonCode | null>(null);
  const [termDetail, setTermDetail] = useState("");
  const [termAlsoBlock, setTermAlsoBlock] = useState(false);
  const [reportReason, setReportReason] = useState<TerminationReasonCode | null>(null);
  const [reportDetail, setReportDetail] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push("/auth"); return; }
    setMyUserId(user.id);

    const res = await fetch(`/api/exchange/sessions/${sessionId}`, { cache: "no-store" });
    const data = await res.json();
    if (res.ok) {
      setSession(data.session);
      setEntries(data.entries || []);
      if (data.extension) setExtension(data.extension);
    } else {
      setStatusText(data.error || t("xch.session.loadFail"));
    }
    setLoading(false);
  };

  useEffect(() => {
    // 마운트 시 1회 초기 데이터 로드 — 비동기 fetch 후 상태 반영 패턴
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const partnerName = session?.partner_display_name || t("xch.session.partner");
  const partnerId = useMemo(() => {
    if (!session || !myUserId) return null;
    return session.user_a_id === myUserId ? session.user_b_id : session.user_a_id;
  }, [session, myUserId]);

  const isActive = session ? ACTIVE_STATUSES.includes(session.status) : false;
  const currentDay = useMemo(
    () => (session ? Math.min(Math.max(dayIndexNow(session.started_at), 1), 7) : 1),
    [session],
  );
  const rawDay = session ? dayIndexNow(session.started_at) : 1;

  // 백엔드 day_index(24시간 창)와 동일 기준으로 "오늘 썼는지" 판정
  const wroteToday = useMemo(
    () => entries.some((e) => e.is_mine && e.day_index === rawDay),
    [entries, rawDay],
  );
  const partnerWroteToday = useMemo(
    () => entries.some((e) => !e.is_mine && e.day_index === rawDay),
    [entries, rawDay],
  );

  /** 연장 투표 카드 노출 조건: 7일 차 이후이거나 투표가 이미 시작됐을 때 (extended 제외) */
  const showExtension =
    Boolean(session) &&
    session!.status !== "extended" &&
    isActive &&
    (rawDay >= 7 || session!.status === "extension_pending" || extension.partner_voted || Boolean(extension.my_vote));

  const dayGroups = useMemo(() => {
    const map = new Map<number, EntryForView[]>();
    for (const e of entries) {
      const list = map.get(e.day_index) ?? [];
      list.push(e);
      map.set(e.day_index, list);
    }
    return [...map.entries()].sort(([a], [b]) => b - a);
  }, [entries]);

  const count = content.length;
  const warn = count >= MAX_EXCHANGE_ENTRY_LENGTH * 0.9;

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
      setStatusText(t("xch.session.saved"));
      await load();
    } else {
      setStatusText(data.error || t("xch.session.saveFail"));
    }
    setSaving(false);
  };

  const voteExtension = async (vote: ExtensionVote) => {
    setBusy(true);
    setStatusText("");
    const res = await fetch(`/api/exchange/sessions/${sessionId}/extension-vote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ vote }),
    });
    const data = await res.json();
    if (res.ok) {
      if (data.result === "extended") setStatusText(t("xch.ext.extended"));
      else if (data.result === "ended") setStatusText(t("xch.ext.endedByVote"));
      await load();
    } else {
      setStatusText(data.error || t("xch.ext.fail"));
    }
    setBusy(false);
  };

  const blockPartner = async (): Promise<boolean> => {
    if (!partnerId) return false;
    const res = await fetch("/api/exchange/blocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ blocked_user_id: partnerId }),
    });
    // 409(이미 차단)도 사용자 입장에선 성공
    return res.ok || res.status === 409;
  };

  const terminate = async () => {
    if (!termReason) return;
    setBusy(true);
    setStatusText("");
    const res = await fetch(`/api/exchange/sessions/${sessionId}/terminate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: termReason, detail: termDetail.trim() || undefined }),
    });
    const data = await res.json();
    if (res.ok) {
      if (termAlsoBlock) await blockPartner();
      setManageOpen(false);
      setManagePane("menu");
      setStatusText(t("xch.term.done"));
      await load();
    } else {
      setStatusText(data.error || t("xch.term.fail"));
    }
    setBusy(false);
  };

  const sendReport = async () => {
    if (!partnerId || !reportReason) return;
    setBusy(true);
    setStatusText("");
    const res = await fetch("/api/exchange/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reported_user_id: partnerId,
        session_id: sessionId,
        reason: reportReason,
        detail: reportDetail.trim() || undefined,
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setManageOpen(false);
      setManagePane("menu");
      setReportReason(null);
      setReportDetail("");
      setStatusText(t("xch.report.done"));
    } else {
      setStatusText(data.error || t("xch.report.fail"));
    }
    setBusy(false);
  };

  const blockOnly = async () => {
    setBusy(true);
    setStatusText("");
    const ok = await blockPartner();
    if (ok) {
      setManageOpen(false);
      setManagePane("menu");
      setStatusText(t("xch.block.done"));
    } else {
      setStatusText(t("xch.block.fail"));
    }
    setBusy(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.session.loading")}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-2">
        <button onClick={() => router.push("/exchange")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("xch.back.exchange")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>
          {session?.partner_display_name || t("xch.title")}
        </h1>
        {session ? (
          <button
            onClick={() => { setManageOpen((v) => !v); setManagePane("menu"); }}
            aria-label={t("xch.session.manage")}
            aria-expanded={manageOpen}
            className="xch-manage-btn"
          >
            ⋯
          </button>
        ) : (
          <div className="w-16" />
        )}
      </div>

      {session && isActive && (
        <div className="xch-progress" aria-label={t("xch.card.dayAria", { n: currentDay })}>
          {Array.from({ length: 7 }, (_, i) => (
            <span
              key={i}
              className={`xch-card__dot ${i < currentDay ? "xch-card__dot--past" : ""} ${i === currentDay - 1 ? "xch-card__dot--today" : ""}`}
            />
          ))}
          <span className="xch-card__day-label">{t("xch.session.dayOf", { n: currentDay })}</span>
        </div>
      )}

      {statusText && (
        <div className="diary-card p-3 mb-4 text-sm" role="status" style={{ color: "var(--deep-gray)" }}>
          {statusText}
        </div>
      )}

      {/* ── 관리 패널 ── */}
      {manageOpen && session && (
        <section className="diary-card p-5 mb-4 xch-manage">
          {managePane === "menu" && (
            <div className="grid gap-2">
              {isActive && (
                <button onClick={() => setManagePane("terminate")} className="xch-manage__item">
                  {t("xch.term.open")}
                </button>
              )}
              <button onClick={() => setManagePane("report")} className="xch-manage__item">
                {t("xch.report.open")}
              </button>
              <button onClick={() => setManagePane("block")} className="xch-manage__item">
                {t("xch.block.open")}
              </button>
            </div>
          )}

          {managePane === "terminate" && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("xch.term.title")}</p>
              <p className="text-xs opacity-45 mb-3">{t("xch.term.desc")}</p>
              <div className="grid gap-2 mb-3" role="radiogroup" aria-label={t("xch.term.title")}>
                {TERMINATION_REASONS.map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    role="radio"
                    aria-checked={termReason === r.code}
                    onClick={() => setTermReason(r.code)}
                    className={`xch-reason ${termReason === r.code ? "xch-reason--active" : ""}`}
                  >
                    <span>{t(`xch.term.reason.${r.code}` as DictKey)}</span>
                    {SAFE_TERMINATION_REASONS.includes(r.code) && (
                      <span className="xch-reason__safe">{t("xch.term.safeTag")}</span>
                    )}
                  </button>
                ))}
              </div>
              <textarea
                value={termDetail}
                onChange={(e) => setTermDetail(e.target.value.slice(0, MAX_EXCHANGE_REPORT_DETAIL_LENGTH))}
                placeholder={t("xch.term.detailPlaceholder")}
                rows={2}
                className="w-full px-4 py-3 text-sm outline-none resize-none mb-3"
                style={inputStyle}
              />
              <label className="xch-check">
                <input
                  type="checkbox"
                  checked={termAlsoBlock}
                  onChange={(e) => setTermAlsoBlock(e.target.checked)}
                />
                <span>{t("xch.term.alsoBlock")}</span>
              </label>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={terminate}
                  disabled={busy || !termReason}
                  className="flex-1 py-3 text-sm rounded-full text-white disabled:opacity-40"
                  style={{ background: "var(--deep-gray)" }}
                >
                  {busy ? t("xch.rd.busy") : t("xch.term.confirm")}
                </button>
                <button
                  onClick={() => setManagePane("menu")}
                  className="px-5 py-3 text-sm rounded-full"
                  style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
                >
                  {t("xch.term.cancel")}
                </button>
              </div>
            </div>
          )}

          {managePane === "report" && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("xch.report.title")}</p>
              <p className="text-xs opacity-45 mb-3">{t("xch.report.desc")}</p>
              <div className="grid gap-2 mb-3" role="radiogroup" aria-label={t("xch.report.title")}>
                {TERMINATION_REASONS.filter((r) => r.code !== "personal").map((r) => (
                  <button
                    key={r.code}
                    type="button"
                    role="radio"
                    aria-checked={reportReason === r.code}
                    onClick={() => setReportReason(r.code)}
                    className={`xch-reason ${reportReason === r.code ? "xch-reason--active" : ""}`}
                  >
                    <span>{t(`xch.term.reason.${r.code}` as DictKey)}</span>
                  </button>
                ))}
              </div>
              <textarea
                value={reportDetail}
                onChange={(e) => setReportDetail(e.target.value.slice(0, MAX_EXCHANGE_REPORT_DETAIL_LENGTH))}
                placeholder={t("xch.report.detailPlaceholder")}
                rows={3}
                className="w-full px-4 py-3 text-sm outline-none resize-none mb-3"
                style={inputStyle}
              />
              <div className="flex gap-2">
                <button
                  onClick={sendReport}
                  disabled={busy || !reportReason}
                  className="btn-primary flex-1 py-3 text-sm disabled:opacity-40"
                >
                  {busy ? t("xch.rd.busy") : t("xch.report.submit")}
                </button>
                <button
                  onClick={() => setManagePane("menu")}
                  className="px-5 py-3 text-sm rounded-full"
                  style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
                >
                  {t("xch.term.cancel")}
                </button>
              </div>
            </div>
          )}

          {managePane === "block" && (
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("xch.block.open")}</p>
              <p className="text-xs opacity-45 mb-4">{t("xch.block.confirmDesc")}</p>
              <div className="flex gap-2">
                <button
                  onClick={blockOnly}
                  disabled={busy}
                  className="flex-1 py-3 text-sm rounded-full text-white disabled:opacity-40"
                  style={{ background: "var(--deep-gray)" }}
                >
                  {busy ? t("xch.rd.busy") : t("xch.block.confirm")}
                </button>
                <button
                  onClick={() => setManagePane("menu")}
                  className="px-5 py-3 text-sm rounded-full"
                  style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
                >
                  {t("xch.term.cancel")}
                </button>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── 연장 투표 ── */}
      {showExtension && (
        <section className="diary-card p-5 mb-4 xch-ext">
          <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("xch.ext.title")}</p>
          {extension.my_vote ? (
            <div role="status">
              <p className="text-sm mt-2" style={{ color: "var(--deep-gray)" }}>
                {extension.my_vote === "continue" ? t("xch.ext.votedContinue") : t("xch.ext.votedStop")}
              </p>
              <p className="text-xs opacity-50 mt-1">{t("xch.ext.waiting", { name: partnerName })}</p>
            </div>
          ) : (
            <>
              <p className="text-xs opacity-45 mb-1">{t("xch.ext.desc")}</p>
              {extension.partner_voted && (
                <p className="text-xs mt-1 mb-1" style={{ color: "var(--stamp-vermilion)" }}>
                  {t("xch.ext.partnerVoted", { name: partnerName })}
                </p>
              )}
              <div className="flex gap-2 mt-4">
                <button onClick={() => voteExtension("continue")} disabled={busy} className="btn-primary flex-1 py-3 text-sm disabled:opacity-40">
                  {t("xch.ext.continue")}
                </button>
                <button
                  onClick={() => voteExtension("stop")}
                  disabled={busy}
                  className="flex-1 py-3 text-sm rounded-full disabled:opacity-40"
                  style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
                >
                  {t("xch.ext.stop")}
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {/* ── 오늘의 작성 영역 ── */}
      {!isActive && session ? (
        <section className="diary-card p-5 mb-4 text-center">
          <p className="text-sm opacity-60">{t("xch.session.endedNotice")}</p>
        </section>
      ) : wroteToday ? (
        <section className="diary-card p-5 mb-4 xch-done">
          <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>
            {t("xch.session.wroteToday")}
          </p>
          <p className="text-xs opacity-50 mt-1">
            {partnerWroteToday
              ? t("xch.session.bothWrote", { name: partnerName })
              : t("xch.session.waitPartner", { name: partnerName })}
          </p>
        </section>
      ) : (
        <section className="diary-card p-5 mb-4">
          <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
            {t("xch.session.writeTitle")}
          </p>
          <p className="text-xs opacity-45 mb-4">{t("xch.session.writeDesc")}</p>
          <input
            value={mood}
            onChange={(e) => setMood(e.target.value)}
            placeholder={t("xch.session.moodPlaceholder")}
            className="w-full px-4 py-3 text-sm outline-none mb-3"
            style={inputStyle}
          />
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value.slice(0, MAX_EXCHANGE_ENTRY_LENGTH))}
            placeholder={t("xch.session.contentPlaceholder")}
            rows={7}
            className="w-full px-4 py-3 text-sm outline-none resize-none"
            style={inputStyle}
          />
          <div className="write-status mt-2 mb-3">
            <span />
            <span className={warn ? "write-status__count--warn" : ""}>
              {t("xch.session.chars", { n: count.toLocaleString(), max: MAX_EXCHANGE_ENTRY_LENGTH.toLocaleString() })}
            </span>
          </div>
          <button
            onClick={submitEntry}
            disabled={saving || content.trim().length === 0}
            className="btn-primary w-full py-3 text-sm disabled:opacity-40"
          >
            {saving ? t("xch.session.saving") : t("xch.session.submit")}
          </button>
        </section>
      )}

      <section className="space-y-3">
        <h2 className="text-sm font-medium px-1" style={{ color: "var(--deep-gray)" }}>{t("xch.session.history")}</h2>
        {entries.length === 0 ? (
          <div className="diary-card p-8 text-center">
            <p className="text-2xl mb-3">📖</p>
            <p className="text-sm opacity-50">{t("xch.session.empty")}</p>
            <p className="text-xs opacity-35 mt-2">{t("xch.session.emptyHint")}</p>
          </div>
        ) : (
          dayGroups.map(([day, dayEntries]) => (
            <div key={day} className="xch-day">
              <p className="xch-day__label">{t("xch.card.day", { n: day })}</p>
              {dayEntries.map((entry) => (
                <article key={entry.id} className="diary-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs opacity-45">
                      {entry.is_mine ? t("xch.session.mine") : t("xch.session.theirs", { name: partnerName })}
                    </p>
                    {entry.mood && <span className="text-xs opacity-45">{entry.mood}</span>}
                  </div>
                  {entry.is_visible ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: "var(--deep-gray)" }}>
                      {entry.content}
                    </p>
                  ) : (
                    <div className="rounded-xl p-4 text-center" style={{ background: "var(--warm-bg)" }}>
                      <p className="text-sm opacity-55">{t("xch.session.locked", { name: partnerName })}</p>
                    </div>
                  )}
                </article>
              ))}
            </div>
          ))
        )}
      </section>
    </div>
  );
}
