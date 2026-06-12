"use client";

import Image from "next/image";
import { useState } from "react";
import type { CSSProperties } from "react";
import { useToast } from "@/components/Toast";
import { PERSONAS } from "@/types";

interface PersonaSectionProps {
  initialPersona: string;
}

type PersonaStyle = CSSProperties & {
  "--persona-accent": string;
  "--persona-gradient": string;
  "--persona-ink": string;
  "--persona-selected-shadow": string;
};

export default function PersonaSection({ initialPersona }: PersonaSectionProps) {
  const { showToast } = useToast();
  const [preferredPersona, setPreferredPersona] = useState(initialPersona);

  async function handleSelect(code: string, name: string) {
    setPreferredPersona(code);
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ preferred_persona: code }),
    });
    if (res.ok) {
      showToast(`${name}으로 설정했어요.`, "success");
    }
  }

  return (
    <div className="diary-card p-5 mb-4">
      <p className="text-xs opacity-40 mb-3">기본 답글 작성자</p>
      <div className="persona-selector__grid" role="radiogroup" aria-label="기본 답글 작성자 선택">
        {PERSONAS.map((p) => {
          const isActive = preferredPersona === p.code;
          const style: PersonaStyle = {
            "--persona-accent": p.theme.replyAccent,
            "--persona-gradient": p.theme.replyBgGradient,
            "--persona-ink": p.theme.replyInk,
            "--persona-selected-shadow": `0 12px 28px ${p.theme.replyAccent}28, inset 0 1px 0 rgba(255,255,255,0.62)`,
          };

          return (
            <button
              key={p.code}
              type="button"
              onClick={() => handleSelect(p.code, p.name)}
              role="radio"
              aria-checked={isActive}
              className={`persona-card persona-card--settings ${isActive ? "persona-card--selected" : ""}`}
              style={style}
            >
              <span className="persona-card__check" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.18" />
                  <path d="M6 10.5L9 13.5L14 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <span className="persona-card__avatar">
                <Image
                  src={p.imageSrc}
                  alt={`${p.name} 프로필`}
                  width={120}
                  height={120}
                  className="persona-card__image"
                  sizes="120px"
                />
              </span>
              <span className="persona-card__body">
                <span className="persona-card__name">{p.name}</span>
                <span className="persona-card__description">{p.description}</span>
              </span>
            </button>
          );
        })}
      </div>
      <p className="text-xs opacity-30 mt-3">
        일기 작성 시 기본으로 선택돼요. 그날 마음에 따라 바꿀 수도 있어요.
      </p>
    </div>
  );
}
