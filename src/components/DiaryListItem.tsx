"use client";

import Link from "next/link";
import { EMOTIONS, PERSONAS } from "@/types";
import { formatRelative } from "@/lib/date";

interface DiaryListItemProps {
  id: string;
  content: string;
  emotionCodes: string[];
  hasReply: boolean;
  replyPersona?: string;
  createdAt: string;
}

export default function DiaryListItem({
  id,
  content,
  emotionCodes,
  hasReply,
  replyPersona,
  createdAt,
}: DiaryListItemProps) {
  const dateStr = formatRelative(createdAt);
  const preview = content.length > 70 ? content.slice(0, 70) + "…" : content;
  const persona = replyPersona ? PERSONAS.find((p) => p.code === replyPersona) : null;

  const emotionLabels = emotionCodes
    .map((code) => EMOTIONS.find((e) => e.code === code)?.label)
    .filter(Boolean);

  return (
    <Link href={`/diary/${id}`}>
      <article
        className="group mb-2 transition-all cursor-pointer"
        style={{
          padding: "16px 16px 14px",
          borderRadius: "var(--radius-sm)",
          background: "var(--paper-white)",
          border: "1px solid var(--border-hairline)",
          borderLeft: hasReply
            ? "3px solid var(--cloth-sage)"
            : "3px solid var(--paper-kraft)",
        }}
      >
        {/* Date row */}
        <div className="flex items-center justify-between mb-2">
          <time
            className="text-xs"
            style={{ color: "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}
          >
            {dateStr}
          </time>
          <div className="flex items-center gap-2">
            {/* Emotion labels instead of emojis */}
            {emotionLabels.length > 0 && (
              <span
                className="text-xs"
                style={{ color: "var(--text-muted)" }}
              >
                {emotionLabels.slice(0, 2).join(", ")}
              </span>
            )}
            {hasReply && (
              <span
                className="text-xs font-medium"
                style={{
                  padding: "2px 8px",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--cloth-sage)",
                  color: "white",
                }}
              >
                {persona ? `${persona.name} 답글` : "답글"}
              </span>
            )}
          </div>
        </div>

        {/* Content preview */}
        <p
          className="text-sm leading-relaxed group-hover:text-[var(--text-primary)] transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          {preview}
        </p>
      </article>
    </Link>
  );
}
