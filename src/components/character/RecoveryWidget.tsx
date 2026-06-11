"use client";

import { useEffect, useState } from "react";
import RecoveryCharacter from "./RecoveryCharacter";

interface RecoveryData {
  totalLogs: number;
  colorLevel: number;
}

const MESSAGES = [
  "기록을 시작하면, 색깔이 돌아오기 시작해요.",
  "첫 기록이에요. 작은 한 걸음.",
  "조금씩 윤곽이 보이기 시작해요.",
  "색이 스며들고 있어요. 천천히.",
  "반쯤 왔어요. 포기하지 않았네요.",
  "거의 다 왔어요. 끝까지 가볼까요?",
  "완성. 당신은 처음부터 이 색이었어요.",
];

function getMessage(level: number): string {
  if (level === 0) return MESSAGES[0];
  if (level >= 1) return MESSAGES[MESSAGES.length - 1];
  const idx = Math.min(
    Math.floor(level * (MESSAGES.length - 2)) + 1,
    MESSAGES.length - 2
  );
  return MESSAGES[idx];
}

export default function RecoveryWidget() {
  const [data, setData] = useState<RecoveryData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/recovery");
        if (res.ok) {
          const json = await res.json();
          setData({ totalLogs: json.totalLogs, colorLevel: json.colorLevel });
        }
      } catch {
        // silent — widget is non-critical
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading || !data) {
    return (
      <div
        className="rounded-2xl p-6"
        style={{
          background: "var(--bg-card, #fff)",
          border: "1px solid var(--border-subtle, #e8dcc8)",
          minHeight: 120,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{ color: "var(--text-muted, #a09888)", fontSize: "13px" }}
        >
          {loading ? "불러오는 중…" : ""}
        </span>
      </div>
    );
  }

  const pct = Math.round(data.colorLevel * 100);

  return (
    <div
      className="rounded-2xl p-5 flex gap-5 items-center"
      style={{
        background: "var(--bg-card, #fff)",
        border: "1px solid var(--border-subtle, #e8dcc8)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}
    >
      <RecoveryCharacter
        progress={data.colorLevel}
        width={80}
        height={120}
      />

      <div className="flex-1 min-w-0">
        <p
          className="font-serif text-base font-semibold mb-1"
          style={{
            color: "var(--text-primary, #3a322a)",
            letterSpacing: "-0.02em",
          }}
        >
          색깔을 되찾는 여정
        </p>
        <p
          className="text-sm mb-3"
          style={{ color: "var(--text-muted, #a09888)", lineHeight: 1.6 }}
        >
          {getMessage(data.colorLevel)}
        </p>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div
            className="flex-1 h-1.5 rounded-full overflow-hidden"
            style={{ background: "var(--cream-deep, #f0ece4)" }}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${pct}%`,
                background: "linear-gradient(90deg, #CECBF6, #7F77DD, #534AB7)",
                transition: "width 2s ease-in-out",
              }}
            />
          </div>
          <span
            className="text-xs font-medium"
            style={{ color: "var(--text-muted, #a09888)", minWidth: 36 }}
          >
            {pct}%
          </span>
        </div>

        <p
          className="text-xs mt-2"
          style={{ color: "var(--text-muted, #a09888)", opacity: 0.6 }}
        >
          {data.totalLogs}개의 기록
        </p>
      </div>
    </div>
  );
}
