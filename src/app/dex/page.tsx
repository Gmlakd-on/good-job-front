"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n/I18nProvider";
import { DEX_QUESTIONS } from "@/lib/dex/questions";

const STORAGE_KEY = "dex_answers_v2";
const CUSTOM_QUESTIONS_KEY = "dex_custom_questions_v1";

type Answers = Record<number, string>;

type TestCard = {
  description: string;
  icon: string;
  title: string;
};

function loadAnswers(): Answers {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Answers) : {};
  } catch {
    return {};
  }
}

function saveAnswers(answers: Answers) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
  } catch {
    // localStorage 사용이 불가능한 환경에서는 화면 상태만 유지한다.
  }
}

function loadCustomQuestions(): string[] {
  try {
    const raw = localStorage.getItem(CUSTOM_QUESTIONS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function saveCustomQuestions(questions: string[]) {
  try {
    localStorage.setItem(CUSTOM_QUESTIONS_KEY, JSON.stringify(questions));
  } catch {
    // localStorage 사용이 불가능한 환경에서는 화면 상태만 유지한다.
  }
}

function pickToday(questions: string[], answers: Answers, offset: number): number | null {
  const unanswered = questions.map((_, index) => index).filter((index) => !answers[index]?.trim());
  if (unanswered.length === 0) return null;

  const today = new Date();
  const seed = today.getFullYear() * 1000 + today.getMonth() * 50 + today.getDate();
  return unanswered[(seed + offset) % unanswered.length];
}

export default function DexPage() {
  const router = useRouter();
  const { language, t } = useI18n();
  const [answers, setAnswers] = useState<Answers>({});
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [offset, setOffset] = useState(0);
  const [forcedIdx, setForcedIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);
  const [browsing, setBrowsing] = useState(false);
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState("");

  const copy = language === "en"
    ? {
      back: "← Home",
      title: "My Dex",
      progressTitle: "100 Questions, 100 Answers",
      progressDesc: "Answer one question a day and collect small pieces of yourself.",
      answered: "answered",
      todayQuestion: "Today’s question",
      answerHint: "Write your thoughts freely here...",
      save: "Record in dex",
      saved: "Saved",
      next: "See another question",
      browseTitle: "Collect my answers",
      browseDesc: "Gather the answers you have written so far.",
      browseAction: "View my answers",
      closeAction: "Close answers",
      aiTitle: "AI-recommended next question",
      aiDesc: "Based on your recent answers, we picked a question that may fit you.",
      aiQuestion: "When did you feel most grateful lately?",
      aiAction: "Record with this question",
      testsTitle: "Small self-discovery cards",
      notAnswered: "Not answered yet",
      localNote: "Saved on this device for now. Account sync can be connected later.",
      allAnswered: "You answered every question. What a wonderful collection!",
      testStatus: "Coming soon",
      tests: [
        { icon: "🎨", title: "My emotion palette", description: "Express your feelings in colors." },
        { icon: "🌙", title: "Sleep tendency test", description: "Look at your sleep rhythm." },
        { icon: "💗", title: "Find my comfort language", description: "Discover words that support you." },
        { icon: "🍀", title: "Luck routine", description: "Find your tiny good-luck habits." },
      ] satisfies TestCard[],
    }
    : {
      back: "← 홈으로",
      title: "나의 도감",
      progressTitle: "100문 100답",
      progressDesc: "하루에 하나씩, 나에 대한 질문에 답해보세요.",
      answered: "답함",
      todayQuestion: "오늘의 질문",
      answerHint: "여기에 당신의 생각을 자유롭게 적어보세요...",
      save: "도감에 기록하기",
      saved: "기록 완료",
      next: "다른 질문 보기",
      browseTitle: "내 답 모아보기",
      browseDesc: "지금까지 기록한 나의 답을 한눈에 모아볼 수 있어요.",
      browseAction: "내 답 보러 가기",
      closeAction: "답변 닫기",
      aiTitle: "AI가 추천하는 다음 질문",
      aiDesc: "최근 답변을 바탕으로 당신에게 꼭 맞는 질문을 골랐어요.",
      aiQuestion: "요즘 가장 감사한 순간은 언제였나요?",
      aiAction: "이 질문으로 기록하기",
      testsTitle: "나를 알아가는 작은 카드",
      notAnswered: "아직 답하지 않았어요",
      localNote: "현재 답변은 이 기기에 저장돼요. 계정 동기화는 후속 작업으로 연결할 수 있어요.",
      allAnswered: "모든 질문을 다 채웠어요. 멋진 나의 도감이 완성됐어요!",
      testStatus: "준비 중",
      tests: [
        { icon: "🎨", title: "나의 감정 팔레트", description: "내 감정을 색으로 표현해봐요." },
        { icon: "🌙", title: "수면 성향 테스트", description: "나의 수면 패턴을 알아봐요." },
        { icon: "💗", title: "위로 언어 찾기", description: "나에게 힘이 되는 말을 찾아봐요." },
        { icon: "🍀", title: "행운의 루틴", description: "나의 행운 루틴을 발견해봐요." },
      ] satisfies TestCard[],
    };

  useEffect(() => {
    setAnswers(loadAnswers());
    setCustomQuestions(loadCustomQuestions());
    setHydrated(true);
  }, []);

  // 기본 100문 + AI 추천으로 추가된 질문 = 전체 도감 질문 (추가될 때마다 101문, 102문…으로 늘어난다)
  const allQuestions = useMemo(() => [...DEX_QUESTIONS, ...customQuestions], [customQuestions]);
  const totalQuestions = allQuestions.length;

  const answeredCount = useMemo(
    () => Object.values(answers).filter((value) => value?.trim()).length,
    [answers],
  );
  const progressPct = totalQuestions > 0 ? Math.min((answeredCount / totalQuestions) * 100, 100) : 0;
  const todayIdx = useMemo(() => {
    if (!hydrated) return null;
    if (forcedIdx !== null) return forcedIdx;
    return pickToday(allQuestions, answers, offset);
  }, [allQuestions, answers, forcedIdx, hydrated, offset]);

  const submitAnswer = () => {
    if (todayIdx === null || draft.trim().length === 0) return;

    const nextAnswers = { ...answers, [todayIdx]: draft.trim() };
    setAnswers(nextAnswers);
    saveAnswers(nextAnswers);
    setDraft("");
    setForcedIdx(null);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 2000);
  };

  // AI 추천 질문으로 바로 기록: 도감에 없는 질문이면 새 번호로 추가(100문 -> 101문)하고 그 질문을 펼친다
  const startAiQuestion = () => {
    const existingIdx = allQuestions.indexOf(copy.aiQuestion);

    if (existingIdx >= 0) {
      setForcedIdx(existingIdx);
    } else {
      const nextCustom = [...customQuestions, copy.aiQuestion];
      setCustomQuestions(nextCustom);
      saveCustomQuestions(nextCustom);
      setForcedIdx(DEX_QUESTIONS.length + nextCustom.length - 1);
    }

    setDraft("");
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => document.getElementById("dex-answer")?.focus(), 350);
  };

  const saveEdit = () => {
    if (editingIdx === null) return;

    const nextAnswers = { ...answers, [editingIdx]: editDraft.trim() };
    setAnswers(nextAnswers);
    saveAnswers(nextAnswers);
    setEditingIdx(null);
  };

  return (
    <main className="dex-page dex-page--reference">
      <header className="dex-reference-header">
        <button type="button" onClick={() => router.push("/")} className="dex-reference-header__back">
          {copy.back}
        </button>
        <h1>{copy.title}</h1>
        <div aria-hidden="true" />
      </header>

      <section className="dex-progress-hero" aria-label="100문 100답 진행률">
        <div className="dex-progress-hero__intro">
          <div>
            <h2>{language === "en" ? `${totalQuestions} Questions, ${totalQuestions} Answers` : `${totalQuestions}문 ${totalQuestions}답`}</h2>
            <p>{copy.progressDesc}</p>
          </div>
        </div>
        <div className="dex-progress-hero__bar" role="progressbar" aria-valuenow={answeredCount} aria-valuemin={0} aria-valuemax={totalQuestions}>
          <span style={{ width: `${progressPct}%` }} />
        </div>
        <strong>{answeredCount} / {totalQuestions} {copy.answered}</strong>
        <Image
          src="/illustrations/dex-progress-banner.png"
          alt=""
          width={520}
          height={174}
          className="dex-progress-hero__banner"
          priority
        />
      </section>

      <section className="dex-question-hero">
        <div className="dex-question-hero__content">
          {hydrated && todayIdx === null ? (
            <div className="dex-complete" role="status">
              <p>🏆 {copy.allAnswered}</p>
            </div>
          ) : (
            <>
              <p className="dex-question-hero__eyebrow">{copy.todayQuestion} · #{todayIdx === null ? "-" : todayIdx + 1}</p>
              <h2>{todayIdx === null ? "" : allQuestions[todayIdx]}</h2>
              <label className="sr-only" htmlFor="dex-answer">{copy.answerHint}</label>
              <textarea
                id="dex-answer"
                value={draft}
                onChange={(event) => setDraft(event.target.value.slice(0, 500))}
                placeholder={copy.answerHint}
                rows={4}
                className="dex-question-hero__textarea"
              />
              <div className="dex-question-hero__actions">
                <button type="button" onClick={submitAnswer} disabled={draft.trim().length === 0} className="dex-primary-button">
                  ✎ {savedFlash ? copy.saved : copy.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setForcedIdx(null);
                    setOffset((current) => current + 1);
                    setDraft("");
                  }}
                  className="dex-secondary-button"
                >
                  ⟳ {copy.next}
                </button>
              </div>
            </>
          )}
        </div>
        <div className="dex-question-hero__art" aria-hidden="true">
          <Image
            src="/illustrations/dex-question-banner.png"
            alt=""
            width={620}
            height={207}
            className="dex-question-hero__banner"
          />
        </div>
      </section>

      <section className="dex-feature-row" aria-label="나의 도감 바로가기">
        <article className="dex-feature-card dex-feature-card--answers">
          <div>
            <h2>{copy.browseTitle} 🍃</h2>
            <p>{copy.browseDesc}</p>
          </div>
          <button type="button" onClick={() => setBrowsing((current) => !current)}>
            {browsing ? copy.closeAction : copy.browseAction} <span aria-hidden="true">→</span>
          </button>
        </article>
        <article className="dex-feature-card dex-feature-card--ai">
          <div>
            <h2>✦ {copy.aiTitle}</h2>
            <p>{copy.aiDesc}</p>
            <blockquote>“{copy.aiQuestion}”</blockquote>
          </div>
          <button type="button" onClick={startAiQuestion}>
            ✎ {copy.aiAction}
          </button>
        </article>
      </section>

      {browsing && (
        <section className="dex-answer-drawer" aria-label="저장된 답변 목록">
          {allQuestions.map((question, index) => {
            const answer = answers[index]?.trim();

            return (
              <article key={`${index}-${question}`} className={`dex-answer-item ${answer ? "dex-answer-item--done" : ""}`}>
                <p><span>#{index + 1}</span>{question}</p>
                {editingIdx === index ? (
                  <div className="dex-answer-item__edit">
                    <textarea value={editDraft} onChange={(event) => setEditDraft(event.target.value.slice(0, 500))} rows={2} />
                    <div>
                      <button type="button" onClick={saveEdit}>{t("dd.save")}</button>
                      <button type="button" onClick={() => setEditingIdx(null)}>{t("common.cancel")}</button>
                    </div>
                  </div>
                ) : answer ? (
                  <p className="dex-answer-item__answer">
                    {answer}
                    <button
                      type="button"
                      onClick={() => {
                        setEditingIdx(index);
                        setEditDraft(answer);
                      }}
                    >
                      {t("dex.edit")}
                    </button>
                  </p>
                ) : (
                  <p className="dex-answer-item__empty">{copy.notAnswered}</p>
                )}
              </article>
            );
          })}
          <p className="dex-answer-drawer__note">{copy.localNote}</p>
        </section>
      )}

      <section className="dex-test-grid" aria-label={copy.testsTitle}>
        {copy.tests.map((test) => (
          <article key={test.title} className="dex-test-card">
            <span aria-hidden="true">{test.icon}</span>
            <div>
              <h2>{test.title}</h2>
              <p>{test.description}</p>
              <em>{copy.testStatus}</em>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}
