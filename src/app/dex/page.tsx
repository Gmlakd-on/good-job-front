"use client";

/**
 * 나의 도감 — 나를 알아가는 작은 질문들. (레퍼런스 UI 반영 v2)
 * ① 오늘의 질문 히어로 카드: 질문 크게 + "나를 더 깊이 이해하는 시간" + 진행(n/100) + 🔥 연속 기록.
 * ② 나의 답변 카드: 자유 입력 → [도감에 기록하기] CTA, "다른 질문 보기 ›".
 * ③ 최근 기록: 날짜와 함께 최근에 답한 질문이 쌓임. [전체 보기]로 전체 목록(수정 가능) 펼침.
 *
 * 저장: localStorage v3 — { text, at(ISO) } 형태로 날짜를 함께 기록해 연속 일수를 계산.
 *       v2(문자열) 데이터는 첫 로드 시 자동 마이그레이션. 계정 동기화는 후속 작업.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DEX_QUESTIONS } from "@/lib/dex/questions";

const STORAGE_KEY = "dex_answers_v3";
const LEGACY_KEY = "dex_answers_v2";

interface AnswerRecord {
  text: string;
  at: string; // ISO 저장 시각 — 최근 기록/연속 일수 계산용
}

type Answers = Record<number, AnswerRecord>;

function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Answers;

    // v2(문자열) → v3 마이그레이션: 날짜 정보가 없으므로 today로 보정하지 않고 빈 날짜 대신 저장 시점 기록
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) {
      const old = JSON.parse(legacy) as Record<number, string>;
      const migrated: Answers = {};
      for (const [k, v] of Object.entries(old)) {
        if (typeof v === "string" && v.trim()) migrated[Number(k)] = { text: v, at: "" };
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
      return migrated;
    }
    return {};
  } catch {
    return {};
  }
}

function saveAnswers(a: Answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(a));
  } catch {
    /* 저장 불가 환경은 조용히 무시 */
  }
}

/** 미답변 질문 중 날짜 시드로 하나 선택 (매일 같은 질문, 답하면 다음으로) */
function pickToday(answers: Answers, offset: number): number | null {
  const unanswered = DEX_QUESTIONS.map((_, i) => i).filter((i) => !answers[i]?.text?.trim());
  if (unanswered.length === 0) return null;
  const today = new Date();
  const seed = today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate();
  return unanswered[(seed + offset) % unanswered.length];
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** 오늘(또는 어제)부터 거꾸로 이어지는 답변 일수 */
function calcStreak(answers: Answers): number {
  const days = new Set(
    Object.values(answers)
      .filter((a) => a.at)
      .map((a) => dayKey(a.at)),
  );
  if (days.size === 0) return 0;

  const cursor = new Date();
  // 오늘 아직 안 썼으면 어제부터 센다
  if (!days.has(dayKey(cursor.toISOString()))) cursor.setDate(cursor.getDate() - 1);

  let streak = 0;
  while (days.has(`${cursor.getFullYear()}-${cursor.getMonth()}-${cursor.getDate()}`)) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatDate(iso: string, lang: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return lang === "en"
    ? d.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

const UPCOMING_TESTS = ["🎨 나의 감정 팔레트", "🌙 수면 성향 테스트", "🧭 위로 언어 찾기", "🍀 행운의 루틴"];

export default function DexPage() {
  const router = useRouter();
  const { t, language } = useI18n();
  const [answers, setAnswers] = useState<Answers>({});
  const [hydrated, setHydrated] = useState(false);
  const [offset, setOffset] = useState(0);
  const [draft, setDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  useEffect(() => {
    // localStorage는 클라이언트에서만 — hydration 후 1회 로드
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAnswers(loadAnswers());
    setHydrated(true);
  }, []);

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v.text?.trim()).length,
    [answers],
  );
  const streak = useMemo(() => calcStreak(answers), [answers]);
  const todayIdx = useMemo(() => (hydrated ? pickToday(answers, offset) : null), [answers, offset, hydrated]);

  /** 최근 기록: 저장 시각 내림차순 상위 5개 */
  const recent = useMemo(
    () =>
      Object.entries(answers)
        .filter(([, a]) => a.text?.trim())
        .sort(([, a], [, b]) => (b.at || "").localeCompare(a.at || ""))
        .slice(0, 5)
        .map(([idx, a]) => ({ idx: Number(idx), ...a })),
    [answers],
  );

  const submitAnswer = () => {
    if (todayIdx === null || draft.trim().length === 0) return;
    const next: Answers = { ...answers, [todayIdx]: { text: draft.trim(), at: new Date().toISOString() } };
    setAnswers(next);
    saveAnswers(next);
    setDraft("");
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const prev = answers[editingIdx];
    const next: Answers = {
      ...answers,
      [editingIdx]: { text: editDraft.trim(), at: prev?.at || new Date().toISOString() },
    };
    setAnswers(next);
    saveAnswers(next);
    setEditingIdx(null);
  };

  return (
    <div className="pt-2 pb-8 dex2">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("common.back.home")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>🌱 {t("dex.title")}</h1>
        <div className="w-8" />
      </div>
      <p className="text-center text-sm opacity-45 mb-6">{t("dex.subtitle")}</p>

      {/* ① 오늘의 질문 히어로 */}
      <section className="dex2-hero mb-4" aria-labelledby="dex-today-q">
        {hydrated && todayIdx === null ? (
          <div role="status">
            <p className="dex2-hero__eyebrow">{t("dex.todayQ")}</p>
            <p id="dex-today-q" className="dex2-hero__q">🏆 {t("dex.allAnswered")}</p>
          </div>
        ) : (
          <>
            <p className="dex2-hero__eyebrow">
              {t("dex.todayQ")}{todayIdx !== null ? ` · #${todayIdx + 1}` : ""}
            </p>
            <p id="dex-today-q" className="dex2-hero__q">
              {todayIdx !== null ? DEX_QUESTIONS[todayIdx] : "…"}
            </p>
            <p className="dex2-hero__sub">{t("dex.heroSub")}</p>
          </>
        )}
        <div className="dex2-hero__meta">
          <span className="dex2-hero__count">{t("dex.count", { n: answeredCount })}</span>
          <div
            className="dex2-hero__bar"
            role="progressbar"
            aria-label={t("dex.q100")}
            aria-valuenow={answeredCount}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="dex2-hero__fill" style={{ width: `${answeredCount}%` }} />
          </div>
          {streak > 0 && <span className="dex2-chip">🔥 {t("dex.streak", { n: streak })}</span>}
        </div>
      </section>

      {/* ② 나의 답변 */}
      {hydrated && todayIdx !== null && (
        <section className="diary-card p-5 mb-4">
          <p className="text-sm font-medium mb-2" style={{ color: "var(--deep-gray)" }}>{t("dex.myAnswer")}</p>
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value.slice(0, 500))}
            placeholder={t("dex.answerHint")}
            rows={4}
            aria-label={t("dex.myAnswer")}
            className="w-full px-4 py-3 text-sm outline-none resize-none"
            style={{ borderRadius: "var(--radius-md)", background: "var(--paper-white)", border: "1px solid var(--border-subtle)", color: "var(--text-primary)" }}
          />
          <p className="text-right text-xs opacity-40 mt-1">{draft.length} / 500</p>
          <button
            onClick={submitAnswer}
            disabled={draft.trim().length === 0}
            className="btn-primary w-full py-3 text-sm disabled:opacity-40 mt-2"
          >
            {savedFlash ? `✓ ${t("dex.answered")}` : `🪶 ${t("dex.record")}`}
          </button>
          <button
            onClick={() => { setOffset((o) => o + 1); setDraft(""); }}
            className="block mx-auto mt-3 text-sm opacity-55 hover:opacity-85"
          >
            {t("dex.skip")} ›
          </button>
        </section>
      )}

      {/* ③ 최근 기록 */}
      <section className="diary-card p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{t("dex.recent")}</p>
          <button onClick={() => setBrowsing((v) => !v)} className="text-xs opacity-55 hover:opacity-85">
            {browsing ? t("dex.browseClose") : `${t("dex.viewAll")} ›`}
          </button>
        </div>
        <p className="text-xs opacity-45 mb-3">{t("dex.recentDesc")}</p>

        {!browsing && (
          recent.length === 0 ? (
            <p className="text-sm opacity-45">{t("dex.notAnswered")}</p>
          ) : (
            <ul className="dex2-recent">
              {recent.map((r) => (
                <li key={r.idx} className="dex2-recent__item">
                  <span className="dex2-recent__date">{formatDate(r.at, language)}</span>
                  <span className="dex2-recent__q">{DEX_QUESTIONS[r.idx]}</span>
                </li>
              ))}
            </ul>
          )
        )}

        {browsing && (
          <div className="dex-list mt-1">
            {DEX_QUESTIONS.map((q, i) => {
              const a = answers[i]?.text?.trim();
              return (
                <div key={i} className={`dex-list__item ${a ? "dex-list__item--done" : ""}`}>
                  <p className="dex-list__q">
                    <span className="dex-list__num">#{i + 1}</span> {q}
                  </p>
                  {editingIdx === i ? (
                    <div className="mt-2">
                      <textarea
                        value={editDraft}
                        onChange={(e) => setEditDraft(e.target.value.slice(0, 500))}
                        rows={2}
                        aria-label={`#${i + 1}`}
                        className="w-full px-3 py-2 text-sm outline-none resize-none"
                        style={{ borderRadius: "var(--radius-md)", background: "var(--paper-white)", color: "var(--text-primary)" }}
                      />
                      <div className="flex gap-2 mt-2">
                        <button onClick={saveEdit} className="btn-primary px-4 py-1.5 text-xs">{t("dd.save")}</button>
                        <button onClick={() => setEditingIdx(null)} className="px-4 py-1.5 text-xs rounded-full" style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}>{t("common.cancel")}</button>
                      </div>
                    </div>
                  ) : a ? (
                    <p className="dex-list__a">
                      {a}
                      <button onClick={() => { setEditingIdx(i); setEditDraft(a); }} className="dex-list__edit">
                        {t("dex.edit")}
                      </button>
                    </p>
                  ) : (
                    <p className="dex-list__a dex-list__a--empty">{t("dex.notAnswered")}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <p className="text-xs opacity-35 mt-4">{t("dex.localNote")}</p>
      </section>

      {/* ④ 재미 테스트 (준비 중) */}
      <section className="diary-card p-5">
        <p className="text-sm font-medium mb-1" style={{ color: "var(--deep-gray)" }}>{t("dex.tests")}</p>
        <p className="text-xs opacity-45 mb-4">{t("dex.testsDesc")}</p>
        <div className="dex-tests">
          {UPCOMING_TESTS.map((name) => (
            <div key={name} className="dex-test" aria-disabled="true">
              <p className="text-sm" style={{ color: "var(--deep-gray)" }}>{name}</p>
              <span className="dex-test__soon">{t("dex.comingSoon")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
