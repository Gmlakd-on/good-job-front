"use client";

import { useState } from "react";

interface ReminderTimePickerProps {
  diaryId?: string;
  onSaved?: () => void;
}

const PRESET_HOURS = [
  { label: "내일 아침 9시", hours: null, preset: "tomorrow_9" },
  { label: "내일 저녁 8시", hours: null, preset: "tomorrow_20" },
  { label: "3일 후", hours: 72, preset: null },
  { label: "일주일 후", hours: 168, preset: null },
];

export default function ReminderTimePicker({ diaryId, onSaved }: ReminderTimePickerProps) {
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSelect = async (preset: (typeof PRESET_HOURS)[0]) => {
    setSaving(true);

    let scheduledAt: Date;
    if (preset.preset === "tomorrow_9") {
      scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      scheduledAt.setHours(9, 0, 0, 0);
    } else if (preset.preset === "tomorrow_20") {
      scheduledAt = new Date();
      scheduledAt.setDate(scheduledAt.getDate() + 1);
      scheduledAt.setHours(20, 0, 0, 0);
    } else {
      scheduledAt = new Date();
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
        setSaved(true);
        onSaved?.();
      }
    } catch {
      // 무시
    }

    setSaving(false);
  };

  if (saved) {
    return (
      <div className="text-center py-3 animate-fade-in-up">
        <p className="text-sm opacity-60">알림을 설정했어요 🔔</p>
        <p className="text-xs opacity-40 mt-1">그때 다시 만나요</p>
      </div>
    );
  }

  if (!show) {
    return (
      <button
        onClick={() => setShow(true)}
        className="w-full text-center py-3 text-sm opacity-40 hover:opacity-60 transition-opacity"
      >
        이 답글, 다음에 다시 꺼내볼까요? 🔔
      </button>
    );
  }

  return (
    <div className="animate-fade-in-up">
      <p className="text-sm opacity-60 text-center mb-3">언제 다시 이 답글을 꺼내볼까요?</p>
      <div className="grid grid-cols-2 gap-2">
        {PRESET_HOURS.map((preset) => (
          <button
            key={preset.label}
            onClick={() => handleSelect(preset)}
            disabled={saving}
            className="p-3 rounded-xl text-xs transition-all hover:shadow-md"
            style={{
              background: "var(--card-bg)",
              color: "var(--deep-gray)",
              opacity: saving ? 0.5 : 1,
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => setShow(false)}
        className="w-full text-center text-xs opacity-30 mt-2 hover:opacity-50"
      >
        다음에 할게요
      </button>
    </div>
  );
}
