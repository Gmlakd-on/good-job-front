"use client";

/**
 * 나의 도감 — 나를 알아가는 공간.
 * ① 100문 100답: 진행 바 + "오늘의 질문" 1개 카드(미답변 중 날짜 시드로 결정적 선택,
 *    "다른 질문 보기"로 셔플 가능) + 내 답 모아보기(답한 질문 펼침/수정).
 * ② 재미 테스트: 앞으로 열릴 자리 — 준비 중 카드 그리드.
 *
 * 저장: 현재 localStorage (기기 저장). 계정 동기화는 백엔드 테이블/AP I 추가가 필요한
 * 후속 작업으로, 화면에 "이 기기에만 저장" 안내를 명시해 기대치를 관리한다.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DEX_QUESTIONS } from "@/lib/dex/questions";

const STORAGE_KEY = "dex_answers_v2"; // 질문 세트 교체 시 버전 업 — 인덱스 기반 답 매칭이 어긋나지 않게

type Answers = Record<number, string>; // 질문 인덱스 → 답

function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Answers) : {};
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
  const unanswered = DEX_QUESTIONS.map((_, i) => i).filter((i) => !answers[i]?.trim());
  if (unanswered.length === 0) return null;
  const today = new Date();
  const seed = today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate();
  return unanswered[(seed + offset) % unanswered.length];
}

const UPCOMING_TESTS = ["🎨 나의 감정 팔레트", "🌙 수면 성향 테스트", "🧭 위로 언어 찾기", "🍀 행운의 루틴"];

export default function DexPage() {
  const router = useRouter();
  const { t } = useI18n();
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
    () => Object.values(answers).filter((v) => v?.trim()).length,
    [answers],
  );
  const todayIdx = useMemo(() => (hydrated ? pickToday(answers, offset) : null), [answers, offset, hydrated]);

  const submitAnswer = () => {
    if (todayIdx === null || draft.trim().length === 0) return;
    const next = { ...answers, [todayIdx]: draft.trim() };
    setAnswers(next);
    saveAnswers(next);
    setDraft("");
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;
    const next = { ...answers, [editingIdx]: editDraft.trim() };
    setAnswers(next);
    saveAnswers(next);
    setEditingIdx(null);
  };

  return (
    <div className="pt-2 pb-8">
      <div className="flex items-center justify-between mb-1">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← {t("common.back.home")}
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>{t("dex.title")}</h1>
        <div className="w-8" />
      </div>
      <p className="text-center text-xs opacity-40 mb-6">{t("dex.subtitle")}</p>

      {/* ① 100문 100답 */}
      <section className="diary-card p-5 mb-4">
        <div className="flex items-center justify-between mb-1">
          <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>{t("dex.q100")}</p>
          <span className="text-xs opacity-45">{t("dex.progress", { n: answeredCount })}</span>
        </div>
        <p className="text-xs opacity-45 mb-3">{t("dex.q100Desc")}</p>

        <div className="dex-progress" role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={100}>
          <div className="dex-progress__fill" style={{ width: `${answeredCount}%` }} />
        </div>

        {hydrated && (todayIdx === null ? (
          <div className="dex-complete mt-4" role="status">
            <p className="text-sm" style={{ color: "var(--deep-gray)" }}>🏆 {t("dex.allAnswered")}</p>
          </div>
        ) : (
          <div className="dex-today mt-4">
            <p className="dex-today__eyebrow">{t("dex.todayQ")} · #{todayIdx + 1}</p>
            <p className="dex-today__q">{DEX_QUESTIONS[todayIdx]}</p>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, 500))}
              placeholder={t("dex.answerPlaceholder")}
              rows={3}
              className="w-full px-4 py-3 text-sm outline-none resize-none mt-3"
              style={{ borderRadius: "var(--radius-md)", background: "var(--paper-white)", color: "var(--text-primary)" }}
            />
            <div className="flex gap-2 mt-3">
              <button onClick={submitAnswer} disabled={draft.trim().length === 0} className="btn-primary flex-1 py-3 text-sm disabled:opacity-40">
                {savedFlash ? `✓ ${t("dex.answered")}` : t("dex.saveAnswer")}
              </button>
              <button onClick={() => { setOffset((o) => o + 1); setDraft(""); }} className="px-4 py-3 text-sm rounded-full" style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}>
                {t("dex.skip")}
              </button>
            </div>
          </div>
        ))}

        <button onClick={() => setBrowsing((v) => !v)} className="text-xs underline opacity-50 hover:opacity-80 mt-4">
          {browsing ? t("dex.browseClose") : t("dex.browse")}
        </button>

        {browsing && (
          <div className="dex-list mt-3">
            {DEX_QUESTIONS.map((q, i) => {
              const a = answers[i]?.trim();
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

        <p className="text-[11px] opacity-35 mt-4">{t("dex.localNote")}</p>
      </section>

      {/* ② 재미 테스트 (준비 중) */}
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
