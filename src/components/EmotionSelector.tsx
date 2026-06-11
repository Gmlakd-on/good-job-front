"use client";

import { EMOTIONS, type EmotionOption } from "@/types";

interface EmotionSelectorProps {
  selected: string[];
  onChange: (codes: string[]) => void;
}

export default function EmotionSelector({ selected, onChange }: EmotionSelectorProps) {
  const toggle = (code: string) => {
    if (selected.includes(code)) {
      onChange(selected.filter((c) => c !== code));
      return;
    }
    onChange([...selected, code]);
  };

  return (
    <div>
      <p
        className="font-serif text-lg mb-2 font-semibold"
        id="emotion-selector-label"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
      >
        오늘의 마음
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        해당하는 감정을 골라주세요.
      </p>
      <div
        className="flex flex-wrap gap-2 stagger-children"
        role="group"
        aria-labelledby="emotion-selector-label"
      >
        {EMOTIONS.map((emotion) => (
          <EmotionTag
            key={emotion.code}
            emotion={emotion}
            isSelected={selected.includes(emotion.code)}
            onToggle={() => toggle(emotion.code)}
          />
        ))}
      </div>
    </div>
  );
}

function EmotionTag({
  emotion,
  isSelected,
  onToggle,
}: {
  emotion: EmotionOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      aria-label={`${emotion.label} ${isSelected ? "선택됨" : ""}`}
      className="animate-fade-in-up transition-all"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "var(--radius-xs)",
        background: isSelected ? "var(--ink-dark)" : "var(--paper-cream)",
        border: isSelected
          ? "1px solid var(--ink-dark)"
          : "1px solid var(--border-hairline)",
        color: isSelected ? "var(--paper-white)" : "var(--text-primary)",
        fontSize: "13px",
        fontWeight: isSelected ? 600 : 400,
        cursor: "pointer",
        opacity: 0, /* filled by animation */
      }}
    >
      <span className="text-sm leading-none">{emotion.emoji}</span>
      <span>{emotion.label}</span>
    </button>
  );
}
