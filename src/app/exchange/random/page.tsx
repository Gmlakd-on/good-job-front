"use client";

/**
 * 랜덤 매칭 흐름 (/exchange/random).
 * 상태 머신으로 한 페이지에서 전체 흐름을 처리한다:
 *
 *   profile 없음 → 프로필 안내
 *   랜덤 매칭 꺼짐 → 설정 안내
 *   offer(매칭 제안) 있음 → 제안 카드 (상대 미리보기 + 수락/거절)  ← 가장 긴급한 상태가 최우선
 *   active 제출 있음 → 기다리는 중 카드 (내 미리보기 + 철회)
 *   아무것도 없음 → 제출 폼 (최근 일기 선택 → 미리보기 글 다듬기 → 제출)
 *
 * UX 원칙:
 * - 미리보기 글은 "모르는 상대에게 보이는 글"이므로 제출 전에 반드시 사람이 다듬는 단계를 거친다
 *   (일기 선택 시 앞부분을 자동으로 채우되, 개인정보 주의 문구와 함께 편집 가능).
 * - 하루 1회 제한·쿨다운·중복 제출은 서버 에러를 그대로 보여주되, 폼을 잃지 않는다.
 * - 제안/대기 상태에서는 30초 간격 폴링으로 상태 변화를 따라간다(상대 수락 → 세션 이동).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { EMOTIONS } from "@/types";
import {
  MAX_PREVIEW_TEXT_LENGTH,
  type ExchangeProfile,
  type ExchangeRandomSubmission,
  type MatchOfferWithPreview,
} from "@/types/exchange";

interface DiaryForPick {
  id: string;
  content: string;
  created_at: string;
  diary_emotions?: { emotion_code: string; emotion_label: string }[];
}

const inputStyle = {
  borderRadius: "var(--radius-md)",
  background: "var(--cream-deep)",
  color: "var(--text-primary)",
} as const;

function emojiFor(code: string): string {
  return EMOTIONS.find((e) => e.code === code)?.emoji ?? "";
}

/** 만료까지 남은 시간 키/변수 — 호출부에서 t()로 번역 */
function expiresParts(iso: string): { key: "xch.rd.expiresHM" | "xch.rd.expiresM" | "xch.rd.expiresSoon"; vars?: Record<string, number> } {
  const ms = new Date(iso).getTime() - Date.now();
  if (ms <= 0) return { key: "xch.rd.expiresSoon" };
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return { key: "xch.rd.expiresHM", vars: { h, m } };
  return { key: "xch.rd.expiresM", vars: { m } };
}

export default function ExchangeRandomPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ExchangeProfile | null>(null);
  const [submission, setSubmission] = useState<ExchangeRandomSubmission | null>(null);
  const [offer, setOffer] = useState<MatchOfferWithPreview | null>(null);
  const [diaries, setDiaries] = useState<DiaryForPick[]>([]);
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [preview, setPreview] = useState("");
  const [busy, setBusy] = useState(false);
  const [statusText, setStatusText] = useState("");
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);
  // 만료 카운트다운 1분 갱신용
  const [, setTick] = useState(0);
  const pollRef = useRef<number | null>(null);

  const refreshState = useCallback(async () => {
    const [subRes, offerRes] = await Promise.all([
      fetch("/api/exchange/random/submission", { cache: "no-store" }),
      fetch("/api/exchange/random/current-offer", { cache: "no-store" }),
    ]);
    if (subRes.ok) {
      const data = await subRes.json();
      setSubmission(data.submission);
    }
    if (offerRes.ok) {
      const data = await offerRes.json();
      setOffer(data.offer);
    }
  }, []);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const [profileRes, diariesRes] = await Promise.all([
        fetch("/api/exchange/profile", { cache: "no-store" }),
        fetch("/api/diaries", { cache: "no-store" }),
      ]);
      if (profileRes.ok) {
        const data = await profileRes.json();
        setProfile(data.profile);
      }
      if (diariesRes.ok) {
        const data = await diariesRes.json();
        setDiaries((data.diaries || []).slice(0, 10));
      }
      await refreshState();
      setLoading(false);
    };
    load();
  }, [router, refreshState]);

  // 대기/제안 상태에서는 30초 폴링 + 1분 카운트다운 갱신
  useEffect(() => {
    const waiting = Boolean(submission) || Boolean(offer);
    if (!waiting) return;
    pollRef.current = window.setInterval(() => {
      refreshState();
      setTick((t) => t + 1);
    }, 30000);
    const minute = window.setInterval(() => setTick((t) => t + 1), 60000);
    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      window.clearInterval(minute);
    };
  }, [submission, offer, refreshState]);

  const pickDiary = (d: DiaryForPick) => {
    setPickedId(d.id);
    // 앞부분을 자동으로 채우되, 사람이 다듬는 단계를 거치게 한다
    setPreview(d.content.slice(0, MAX_PREVIEW_TEXT_LENGTH));
  };

  const submit = async () => {
    if (!pickedId || preview.trim().length === 0) return;
    setBusy(true);
    setStatusText("");
    const picked = diaries.find((d) => d.id === pickedId);
    const res = await fetch("/api/exchange/random/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diary_id: pickedId,
        preview_text: preview.trim(),
        emotions: picked?.diary_emotions?.map((e) => ({ code: e.emotion_code, label: e.emotion_label })) ?? [],
      }),
    });
    const data = await res.json();
    if (res.ok) {
      setSubmission(data.submission);
      setPickedId(null);
      setPreview("");
      setStatusText("");
    } else {
      setStatusText(data.error || t("xch.rd.submitFail"));
    }
    setBusy(false);
  };

  const withdraw = async () => {
    if (!submission) return;
    setBusy(true);
    setStatusText("");
    const res = await fetch(`/api/exchange/random/submission/${submission.id}`, { method: "DELETE" });
    const data = await res.json();
    if (res.ok) {
      setSubmission(null);
      setConfirmWithdraw(false);
      setStatusText(t("xch.rd.withdrawn"));
    } else {
      setStatusText(data.error || t("xch.rd.withdrawFail"));
    }
    setBusy(false);
  };

  const respond = async (action: "accept" | "decline") => {
    if (!offer) return;
    setBusy(true);
    setStatusText("");
    const res = await fetch(`/api/exchange/random/offers/${offer.id}/${action}`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      if (data.status === "matched" && data.session?.id) {
        router.push(`/exchange/${data.session.id}`);
        return;
      }
      if (data.status === "waiting") {
        setOffer({ ...offer, my_decision: "accepted" });
        setStatusText("");
      } else {
        setOffer(null);
        setSubmission(null);
        setStatusText(t("xch.rd.declined"));
      }
    } else {
      setStatusText(data.error || t("xch.manage.fallbackFail"));
    }
    setBusy(false);
  };

  const pickedDiary = useMemo(() => diaries.find((d) => d.id === pickedId) ?? null, [diaries, pickedId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">{t("xch.rd.loading")}</p>
      </div>
    );
  }

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/exchange")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("xch.back.exchange")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("xch.rd.title")}</h1>
        <div className="w-16" />
      </div>

      {statusText && (
        <div className="diary-card p-3 mb-4 text-sm" role="status" style={{ color: "var(--deep-gray)" }}>
          {statusText}
        </div>
      )}

      <section className="xch-random-safety-card" aria-label={t("xch.rd.safetyTitle")}>
        <strong>🔎 {t("xch.rd.safetyTitle")}</strong>
        <p>{t("xch.rd.safetyAccept")}</p>
        <p>{t("xch.rd.safetyControl")}</p>
      </section>

      {/* ── 0. 선행 조건 안내 ── */}
      {!profile ? (
        <div className="diary-card p-6 text-center">
          <p className="text-2xl mb-3">🎲</p>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
            {t("xch.rd.needProfile")}
          </p>
          <p className="text-xs opacity-50 mb-5">{t("xch.rd.needProfileDesc")}</p>
          <Link href="/exchange/friends" className="btn-primary px-6 py-3 text-sm inline-block">
            {t("xch.rd.makeProfile")}
          </Link>
        </div>
      ) : !profile.random_matching_enabled ? (
        <div className="diary-card p-6 text-center">
          <p className="text-2xl mb-3">🔕</p>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
            {t("xch.rd.disabled")}
          </p>
          <p className="text-xs opacity-50 mb-5">{t("xch.rd.disabledDesc")}</p>
          <Link href="/settings" className="btn-primary px-6 py-3 text-sm inline-block">
            {t("xch.rd.toSettings")}
          </Link>
        </div>
      ) : offer ? (
        /* ── 1. 매칭 제안 도착 — 가장 긴급한 상태 ── */
        <section className="diary-card p-5 xch-offer">
          <p className="xch-offer__eyebrow">{t("xch.rd.offerArrived")}</p>
          <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
            {t("xch.rd.offerTitle", { name: offer.partner_display_name })}
          </p>
          <p className="text-xs opacity-45 mb-3">{(() => { const p = expiresParts(offer.expires_at); return t("xch.rd.offerMeta", { time: t(p.key, p.vars) }); })()}</p>

          {offer.partner_emotions && offer.partner_emotions.length > 0 && (
            <div className="xch-offer__emotions">
              {offer.partner_emotions.map((e) => (
                <span key={e.code} className="xch-offer__emotion">
                  {emojiFor(e.code)} {e.label}
                </span>
              ))}
            </div>
          )}

          <blockquote className="xch-offer__preview">{offer.partner_preview_text}</blockquote>

          {offer.my_decision === "accepted" ? (
            <div className="xch-offer__waiting" role="status">
              <p className="text-sm" style={{ color: "var(--deep-gray)" }}>{t("xch.rd.acceptedWait")}</p>
              <p className="text-xs opacity-50 mt-1">
                {t("xch.rd.acceptedWaitDesc", { name: offer.partner_display_name })}
              </p>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              <button onClick={() => respond("accept")} disabled={busy} className="btn-primary flex-1 py-3 text-sm disabled:opacity-40">
                {busy ? t("xch.rd.busy") : t("xch.rd.accept")}
              </button>
              <button
                onClick={() => respond("decline")}
                disabled={busy}
                className="px-5 py-3 text-sm rounded-full disabled:opacity-40"
                style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
              >
                {t("xch.rd.declineBtn")}
              </button>
            </div>
          )}
          <p className="text-[11px] opacity-35 mt-3">{t("xch.rd.declineHint")}</p>
        </section>
      ) : submission ? (
        /* ── 2. 제출 완료, 매칭 대기 ── */
        <section className="diary-card p-5">
          <div className="xch-wait__head">
            <span className="xch-wait__pulse" aria-hidden="true" />
            <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{t("xch.rd.waitingTitle")}</p>
          </div>
          <p className="text-xs opacity-45 mt-1 mb-4">
            {(() => { const p = expiresParts(submission.expires_at); return t("xch.rd.waitingDesc", { time: t(p.key, p.vars) }); })()}
          </p>
          <p className="text-xs opacity-45 mb-2">{t("xch.rd.myPreview")}</p>
          <blockquote className="xch-offer__preview">{submission.preview_text}</blockquote>

          {confirmWithdraw ? (
            <div className="flex items-center gap-2 mt-4">
              <p className="text-xs opacity-55 flex-1">{t("xch.rd.withdrawAsk")}</p>
              <button onClick={withdraw} disabled={busy} className="text-xs px-3 py-2 rounded-full text-white disabled:opacity-40" style={{ background: "var(--deep-gray)" }}>
                {t("xch.rd.withdraw")}
              </button>
              <button onClick={() => setConfirmWithdraw(false)} className="text-xs px-3 py-2 rounded-full" style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}>
                {t("xch.rd.cancel")}
              </button>
            </div>
          ) : (
            <button onClick={() => setConfirmWithdraw(true)} className="text-xs underline opacity-50 hover:opacity-80 mt-4">
              {t("xch.rd.withdrawOpen")}
            </button>
          )}
        </section>
      ) : (
        /* ── 3. 제출 폼: 일기 고르기 → 미리보기 다듬기 → 제출 ── */
        <>
          <div className="diary-card p-5 mb-4">
            <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
              {t("xch.rd.step1")}
            </p>
            <p className="text-xs opacity-45 mb-3">
              {t("xch.rd.step1Desc")}
            </p>
            {diaries.length === 0 ? (
              <div className="rounded-xl p-5 text-center" style={{ background: "var(--warm-bg)" }}>
                <p className="text-sm opacity-55">{t("xch.rd.noDiaries")}</p>
                <Link href="/write" className="text-xs underline opacity-70 hover:opacity-100 mt-1 inline-block">
                  {t("xch.rd.writeFirst")}
                </Link>
              </div>
            ) : (
              <div className="xch-pick" role="radiogroup" aria-label={t("xch.rd.pickAria")}>
                {diaries.map((d) => {
                  const date = new Date(d.created_at);
                  const isPicked = pickedId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      role="radio"
                      aria-checked={isPicked}
                      onClick={() => pickDiary(d)}
                      className={`xch-pick__item ${isPicked ? "xch-pick__item--active" : ""}`}
                    >
                      <span className="xch-pick__date">
                        {date.getMonth() + 1}/{date.getDate()}
                        {d.diary_emotions?.slice(0, 3).map((e) => (
                          <span key={e.emotion_code}> {emojiFor(e.emotion_code)}</span>
                        ))}
                      </span>
                      <span className="xch-pick__excerpt">{d.content.slice(0, 60)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {pickedDiary && (
            <div className="diary-card p-5 mb-4">
              <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>
                {t("xch.rd.step2")}
              </p>
              <p className="text-xs opacity-45 mb-3">
                {t("xch.rd.step2Desc")}
              </p>
              <textarea
                value={preview}
                onChange={(e) => setPreview(e.target.value.slice(0, MAX_PREVIEW_TEXT_LENGTH))}
                rows={6}
                className="w-full px-4 py-3 text-sm outline-none resize-none"
                style={inputStyle}
                aria-label={t("xch.rd.previewAria")}
              />
              <div className="write-status mt-2 mb-3">
                <span />
                <span className={preview.length >= MAX_PREVIEW_TEXT_LENGTH * 0.9 ? "write-status__count--warn" : ""}>
                  {preview.length} / {MAX_PREVIEW_TEXT_LENGTH}자
                </span>
              </div>
              <button
                onClick={submit}
                disabled={busy || preview.trim().length === 0}
                className="btn-primary w-full py-3 text-sm disabled:opacity-40"
              >
                {busy ? t("xch.rd.submitting") : t("xch.rd.step3")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
