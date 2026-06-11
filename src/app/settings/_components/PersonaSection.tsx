"use client";

import { useState } from "react";
import { useToast } from "@/components/Toast";
import { PERSONAS } from "@/types";

interface PersonaSectionProps {
  initialPersona: string;
}

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
      <div className="grid grid-cols-1 gap-2">
        {PERSONAS.map((p) => {
          const isActive = preferredPersona === p.code;
          return (
            <button
              key={p.code}
              onClick={() => handleSelect(p.code, p.name)}
              className="flex items-center gap-3 p-3 rounded-xl transition-all text-left"
              style={{
                background: isActive ? "var(--soft-accent)" : "var(--warm-bg)",
                border: isActive ? "2px solid var(--soft-accent-hover)" : "2px solid transparent",
              }}
            >
              <span className="text-xl">{p.emoji}</span>
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: isActive ? "white" : "var(--deep-gray)" }}
                >
                  {p.name}
                </p>
                <p
                  className="text-xs"
                  style={{
                    color: isActive ? "rgba(255,255,255,0.7)" : "var(--deep-gray)",
                    opacity: isActive ? 1 : 0.4,
                  }}
                >
                  {p.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs opacity-30 mt-2">
        일기 작성 시 기본으로 선택돼요. 그날 마음에 따라 바꿀 수도 있어요.
      </p>
    </div>
  );
}
