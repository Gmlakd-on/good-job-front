"use client";

/**
 * 답장 대기 화면.
 * 변경점:
 * - 범용 스피너 → 페르소나별 대기 마이크로카피. "기다림"을 답장 받는 설렘의 일부로 만든다.
 * - 봉투에서 편지지가 천천히 오르내리는 루프 애니메이션 (CSS, prefers-reduced-motion 시 정지).
 * - WritePageClient에서 persona prop을 전달받는다. 없으면 기본 메시지 사용.
 */
import { useEffect, useState } from "react";

const PERSONA_MESSAGES: Record<string, string[]> = {
  operator_voice: [
    "참이가 조용히 읽고 있어요…",
    "함부로 말하지 않으려 단어를 고르는 중…",
    "당신 마음 옆에 잠시 앉는 중…",
  ],
  warm_teacher: [
    "선생님이 안경을 고쳐 쓰는 중…",
    "칠판 앞에서 잠시 생각하는 중…",
    "차분히 답장을 적고 있어요…",
  ],
  soonja_grandma: [
    "할머니가 돋보기를 찾는 중…",
    "아랫목에 앉아 천천히 읽는 중…",
    "꾹꾹 눌러 답장을 쓰고 계세요…",
  ],
  geonneomal_grandpa: [
    "할아버지가 마루에 앉아 읽는 중…",
    "말을 고르고 또 고르는 중…",
    "느릿느릿, 정성껏 쓰고 계세요…",
  ],
  nabi_cat: [
    "나비가 꼬리로 책장을 넘기는 중냥…",
    "햇빛 자리에서 골똘히 읽는 중냥…",
    "발도장 찍을 준비를 하는 중냥…",
  ],
  sharon_director: [
    "샤론 원장님이 가위를 내려놓는 중…",
    "거울 앞에 앉혀놓고 읽는 중…",
    "수다 대신 답장을 고르는 중…",
  ],
};

const DEFAULT_MESSAGES = [
  "마음을 읽고 있어요…",
  "오늘 하루를 되돌아보는 중…",
  "따뜻한 답장을 쓰고 있어요…",
];

export default function LoadingStep({ persona }: { persona?: string }) {
  const messages = (persona && PERSONA_MESSAGES[persona]) || DEFAULT_MESSAGES;
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % messages.length), 2600);
    return () => clearInterval(t);
  }, [messages.length]);

  return (
    <div className="reply-wait" role="status" aria-live="polite">
      <div className="reply-wait__scene" aria-hidden="true">
        <svg width="120" height="110" viewBox="0 0 120 110" fill="none">
          {/* 편지지 — 봉투 뒤에서 올라왔다 내려가는 루프 */}
          <g className="reply-wait__paper">
            <rect x="26" y="36" width="68" height="58" rx="4" fill="#FFFDF7" stroke="rgba(122,86,56,0.25)" />
            <path d="M36 50h48M36 60h48M36 70h32" stroke="rgba(122,86,56,0.3)" strokeWidth="2" strokeLinecap="round" />
            <path d="M76 70c2-3 5-3 6 0s-2 5-6 8c-4-3-7-5-6-8s4-3 6 0z" fill="rgba(196,85,58,0.6)" />
          </g>
          {/* 봉투 본체 (편지지 하단을 가림) */}
          <path d="M14 58a6 6 0 016-6h80a6 6 0 016 6v40a6 6 0 01-6 6H20a6 6 0 01-6-6V58z" fill="#F2E4CC" stroke="rgba(122,86,56,0.3)" />
          <path d="M14 60l46 26 46-26" stroke="rgba(122,86,56,0.3)" strokeWidth="1.5" fill="none" />
          {/* 봉투 덮개 */}
          <path className="reply-wait__flap" d="M16 56l44-24 44 24" fill="#EBD9BC" stroke="rgba(122,86,56,0.3)" />
          {/* 우표 느낌의 도장 */}
          <rect x="88" y="64" width="16" height="16" rx="2" fill="rgba(196,85,58,0.12)" stroke="rgba(196,85,58,0.45)" strokeDasharray="3 2" />
        </svg>
      </div>

      <p key={idx} className="reply-wait__msg">{messages[idx]}</p>

      <div className="reply-wait__dots" aria-hidden="true">
        <span className="reply-wait__dot" />
        <span className="reply-wait__dot" />
        <span className="reply-wait__dot" />
      </div>
    </div>
  );
}
