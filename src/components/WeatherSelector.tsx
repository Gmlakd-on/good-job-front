"use client";

import { WEATHER_OPTIONS, type WeatherOption } from "@/types";

interface WeatherSelectorProps {
  selected: string | null;
  onChange: (code: string | null) => void;
}

export default function WeatherSelector({ selected, onChange }: WeatherSelectorProps) {
  const toggle = (code: string) => {
    onChange(selected === code ? null : code);
  };

  return (
    <div className="mt-7">
      <p
        className="font-serif text-lg mb-2 font-semibold"
        id="weather-selector-label"
        style={{ color: "var(--text-primary)", letterSpacing: "-0.02em" }}
      >
        오늘의 날씨
      </p>
      <p className="text-xs mb-4" style={{ color: "var(--text-muted)" }}>
        일기장에 함께 남길 오늘의 날씨를 골라주세요. 선택하지 않아도 괜찮아요.
      </p>
      <div
        className="flex flex-wrap gap-2 stagger-children"
        role="group"
        aria-labelledby="weather-selector-label"
      >
        {WEATHER_OPTIONS.map((weather) => (
          <WeatherTag
            key={weather.code}
            weather={weather}
            isSelected={selected === weather.code}
            onToggle={() => toggle(weather.code)}
          />
        ))}
      </div>
    </div>
  );
}

function WeatherTag({
  weather,
  isSelected,
  onToggle,
}: {
  weather: WeatherOption;
  isSelected: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={isSelected}
      aria-label={`${weather.label} ${isSelected ? "선택됨" : ""}`}
      className="animate-fade-in-up transition-all"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 14px",
        borderRadius: "var(--radius-xs)",
        background: isSelected ? "var(--cloth-indigo)" : "var(--paper-cream)",
        border: isSelected
          ? "1px solid var(--cloth-indigo)"
          : "1px solid var(--border-hairline)",
        color: isSelected ? "var(--paper-white)" : "var(--text-primary)",
        fontSize: "13px",
        fontWeight: isSelected ? 600 : 400,
        cursor: "pointer",
        opacity: 0,
      }}
    >
      <span className="text-sm leading-none">{weather.emoji}</span>
      <span>{weather.label}</span>
    </button>
  );
}
