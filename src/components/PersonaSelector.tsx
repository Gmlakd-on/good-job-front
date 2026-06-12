"use client";

import Image from "next/image";
import { PERSONAS, type PersonaOption } from "@/types";

interface PersonaSelectorProps {
  selected: string;
  onChange: (code: string) => void;
}

export default function PersonaSelector({ selected, onChange }: PersonaSelectorProps) {
  const freePersonas = PERSONAS.filter((p) => p.tier === "free");
  const proPersonas = PERSONAS.filter((p) => p.tier === "pro");

  return (
    <div className="stagger-children">
      <p
        className="font-serif text-lg mb-1"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
      >
        어떤 존재가 내 일기를 읽어줄까요?
      </p>
      <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
        오늘 하루를 읽고 짧게 답글을 남길 존재를 고르는 거예요
      </p>

      <div className="grid grid-cols-1 gap-2.5">
        {freePersonas.map((persona) => (
          <PersonaCard
            key={persona.code}
            persona={persona}
            isSelected={selected === persona.code}
            onSelect={() => onChange(persona.code)}
          />
        ))}
      </div>

      {proPersonas.length > 0 && (
        <>
          <div className="mt-6 mb-3 flex items-center gap-2">
            <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
            <span
              className="text-xs font-medium px-2"
              style={{ color: "var(--text-muted)" }}
            >
              프리미엄
            </span>
            <div className="h-px flex-1" style={{ background: "var(--border-subtle)" }} />
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {proPersonas.map((persona) => (
              <PersonaCard
                key={persona.code}
                persona={persona}
                isSelected={selected === persona.code}
                onSelect={() => onChange(persona.code)}
                locked
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PersonaCard({
  persona,
  isSelected,
  onSelect,
  locked = false,
}: {
  persona: PersonaOption;
  isSelected: boolean;
  onSelect: () => void;
  locked?: boolean;
}) {
  const theme = persona.theme;

  return (
    <button
      type="button"
      onClick={locked ? undefined : onSelect}
      aria-pressed={isSelected}
      aria-disabled={locked}
      className="flex w-full items-center gap-3 text-left transition-all duration-300"
      style={{
        padding: "14px 16px",
        borderRadius: "var(--radius-md)",
        background: isSelected
          ? theme.replyBgGradient
          : locked
            ? "var(--bg-card)"
            : "var(--bg-card)",
        boxShadow: isSelected
          ? `0 8px 24px ${theme.replyAccent}30, inset 0 1px 0 rgba(255,255,255,0.6)`
          : "var(--shadow-sm)",
        border: isSelected
          ? `1.5px solid ${theme.replyAccent}55`
          : "1.5px solid var(--border-subtle)",
        color: isSelected ? theme.replyInk : "var(--text-primary)",
        transform: isSelected ? "scale(1.02)" : "scale(1)",
        opacity: locked ? 0.55 : 1,
        cursor: locked ? "not-allowed" : "pointer",
      }}
    >
      <span
        className="relative flex-shrink-0 overflow-hidden flex items-center justify-center"
        style={{
          width: 46,
          height: 46,
          borderRadius: "50%",
          background: isSelected
            ? `${theme.replyAccent}22`
            : "var(--cream-deep)",
          boxShadow: `0 0 0 1px ${theme.replyAccent}24`,
        }}
      >
        <Image
          src={persona.imageSrc}
          alt={`${persona.name} 아이콘`}
          width={46}
          height={46}
          className="h-full w-full object-cover"
          sizes="46px"
        />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium">{persona.name}</p>
          {locked && (
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{
                background: "var(--cream-deep)",
                color: "var(--text-muted)",
              }}
            >
              PRO
            </span>
          )}
        </div>
        <p
          className="truncate text-xs mt-0.5"
          style={{ opacity: isSelected ? 0.75 : 0.55 }}
        >
          {persona.description}
        </p>
      </div>

      {!locked && (
        <div className="flex items-center gap-1 ml-auto flex-shrink-0">
          <div
            className="w-2.5 h-2.5 rounded-full transition-all duration-300"
            style={{
              background: theme.replyAccent,
              opacity: isSelected ? 1 : 0.3,
              transform: isSelected ? "scale(1.3)" : "scale(1)",
            }}
          />
        </div>
      )}

      {isSelected && (
        <svg className="flex-shrink-0" width="20" height="20" viewBox="0 0 20 20" fill="none">
          <circle cx="10" cy="10" r="10" fill={`${theme.replyAccent}33`} />
          <path d="M6 10.5L9 13.5L14 7.5" stroke={theme.replyAccent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </button>
  );
}
