"use client";

import { useState } from "react";

interface ReminderTimePickerProps {
  diaryId?: string;
  onSaved?: () => void;
}

const PRESET_HOURS = [
  { label: "내일 아침 9시", icon: "🌅", hours: null, preset: "tomorrow_9" },
  { label: "내일 저녁 8시", icon: "🌙", hours: null, preset: "tomorrow_20" },
  { label: "3일 후", icon: "🗓️", hours: 72, preset: null },
  { label: "일주일 후", icon: "🌱", hours: 168, preset: null },
];

export default function ReminderTimePicker({ diaryId, onSaved }: ReminderTimePickerProps) {
  const [savingLabel, setSavingLabel] = useState("");
  const [savedLabel, setSavedLabel] = useState("");

  const handleSelect = async (preset: (typeof PRESET_HOURS)[0]) => {
    setSavingLabel(preset.label);

    const scheduledAt = new Date();
    if (preset.preset === "tomorrow_9") {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      scheduledAt.setHours(9, 0, 0, 0);
    } else if (preset.preset === "tomorrow_20") {
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      scheduledAt.setHours(20, 0, 0, 0);
    } else {
      scheduledAt.setHours(scheduledAt.getHours() + (preset.hours || 24));
    }

    try {
      const res = await fetch("/api/reminders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          diary_id: diaryId || null,
          scheduled_at: scheduledAt.toISOString(),
        }),
      });

      if (res.ok) {
        setSavedLabel(preset.label);
        onSaved?.();
      }
    } finally {
      setSavingLabel("");
    }
  };

  return (
    <section className="memory-reminder" aria-label="답글 다시 보기 알림 설정">
      <h2>이 말을 언제 다시 꺼내볼까요?</h2>
      <div className="memory-reminder__grid">
        {PRESET_HOURS.map((preset) => {
          const isSaving = savingLabel === preset.label;
          const isSaved = savedLabel === preset.label;
          return (
            <button
              key={preset.label}
              type="button"
              onClick={() => handleSelect(preset)}
              disabled={Boolean(savingLabel)}
              className={isSaved ? "memory-reminder__option memory-reminder__option--saved" : "memory-reminder__option"}
            >
              <span aria-hidden>{preset.icon}</span>
              {isSaving ? "설정 중..." : isSaved ? "설정 완료" : preset.label}
            </button>
          );
        })}
      </div>
      <p className="memory-reminder__hint">💛 설정한 시간에 알림으로 이 말을 다시 만나볼 수 있어요.</p>
    </section>
  );
}
