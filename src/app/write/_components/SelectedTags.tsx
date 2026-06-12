"use client";

import Image from "next/image";
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
        if (!p) return null;
        return (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-white"
            style={{ borderRadius: "var(--radius-full)", background: "var(--soft-sky)" }}
          >
            <Image
              src={p.imageSrc}
              alt=""
              width={18}
              height={18}
              className="rounded-full object-cover"
              sizes="18px"
              aria-hidden="true"
            />
            {p.name}
          </span>
        );
      })()}
    </div>
  );
}
