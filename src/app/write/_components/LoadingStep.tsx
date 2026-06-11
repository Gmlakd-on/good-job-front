"use client";

import { useEffect, useState } from "react";

const LOADING_MESSAGES = [
  "마음을 읽고 있어요…",
  "오늘 하루를 되돌아보는 중…",
  "따뜻한 답장을 쓰고 있어요…",
  "당신의 이야기를 들었어요…",
];

export default function LoadingStep() {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((p) => (p + 1) % LOADING_MESSAGES.length), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="write-page__loading flex flex-col items-center justify-center py-16">
      <div className="animate-chami-bounce mb-6">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="32" cy="34" r="22" fill="var(--chami-gold)" />
          <circle cx="32" cy="34" r="20" fill="var(--chami-body)" opacity="0.3" />
          <path d="M24 32c1.5-1 3-1 4 0" stroke="var(--warm-brown)" strokeWidth="2" strokeLinecap="round" />
          <path d="M36 32c1.5-1 3-1 4 0" stroke="var(--warm-brown)" strokeWidth="2" strokeLinecap="round" />
          <circle cx="22" cy="36" r="3" fill="var(--chami-blush)" opacity="0.4" />
          <circle cx="42" cy="36" r="3" fill="var(--chami-blush)" opacity="0.4" />
          <path d="M32 12V18" stroke="var(--warm-brown)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M32 10c-1.5-2-4-2-5 0s1 4 5 6c4-2 6.5-4 5-6s-3.5-2-5 0z" fill="var(--chami-heart)" />
          <line x1="44" y1="42" x2="52" y2="34" stroke="var(--warm-brown)" strokeWidth="2" strokeLinecap="round" />
        </svg>
      </div>
      <p
        className="text-base font-medium transition-opacity duration-500"
        style={{ color: "var(--text-primary)" }}
      >
        {LOADING_MESSAGES[idx]}
      </p>
      <div className="mt-4 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--chami-gold)", animationDelay: `${i * 200}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
