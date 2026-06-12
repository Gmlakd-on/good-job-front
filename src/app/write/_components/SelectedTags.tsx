"use client";

import { EMOTIONS, PERSONAS, WEATHER_OPTIONS } from "@/types";

interface SelectedTagsProps {
  emotions: string[];
  weather?: string | null;
  persona?: string;
  compact?: boolean;
}

export default function SelectedTags({ emotions, weather, persona, compact = false }: SelectedTagsProps) {
  const selectedWeather = weather
    ? WEATHER_OPTIONS.find((item) => item.code === weather)
    : null;

  return (
    <div className={`flex flex-wrap gap-2 ${compact ? "mb-2" : "mb-4"}`}>
      {selectedWeather && (
        <span
          className="px-3 py-1 text-xs font-medium text-white"
          style={{ borderRadius: "var(--radius-full)", background: "var(--cloth-indigo)" }}
        >
          {selectedWeather.emoji} {selectedWeather.label}
        </span>
      )}

      {emotions.map((code) => {
        const e = EMOTIONS.find((item) => item.code === code);
        return (
          <span
            key={code}
            className="px-3 py-1 text-xs font-medium"
            style={{
              borderRadius: "var(--radius-full)",
              background: "var(--chami-gold-soft)",
              color: "var(--warm-brown)",
            }}
          >
            {e?.emoji} {e?.label}
          </span>
        );
      })}
      {persona && (() => {
        const p = PERSONAS.find((item) => item.code === persona);
        return (
          <span
            className="px-3 py-1 text-xs font-medium text-white"
            style={{ borderRadius: "var(--radius-full)", background: "var(--soft-sky)" }}
          >
            {p?.emoji} {p?.name}
          </span>
        );
      })()}
    </div>
  );
}
