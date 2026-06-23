"use client";

interface GoodJobStampProps {
  show?: boolean;
  size?: number;
  caption?: string;
}

export default function GoodJobStamp({
  show = true,
  size = 80,
  caption = "오늘도 기록함",
}: GoodJobStampProps) {
  if (!show) return null;

  return (
    <div className="animate-seal-press inline-flex flex-col items-center justify-center -rotate-6" aria-label="참 잘했어요 도장">
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label={caption}
      >
        {/* Outer ring — vermilion seal style */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="var(--stamp-vermilion)" strokeWidth="2.5" opacity="0.85" />
        {/* Inner ring */}
        <circle cx="50" cy="50" r="38" fill="none" stroke="var(--stamp-vermilion)" strokeWidth="1" opacity="0.35" />
        {/* Subtle fill */}
        <circle cx="50" cy="50" r="35" fill="var(--stamp-vermilion)" opacity="0.04" />
        {/* Top character */}
        <text
          x="50" y="38"
          textAnchor="middle"
          fontFamily="'Noto Serif KR', serif"
          fontSize="15"
          fontWeight="700"
          fill="var(--stamp-vermilion)"
        >
          참
        </text>
        {/* Main text */}
        <text
          x="50" y="56"
          textAnchor="middle"
          fontFamily="'Noto Serif KR', serif"
          fontSize="14"
          fontWeight="700"
          fill="var(--stamp-vermilion)"
        >
          잘했어요
        </text>
        {/* Decorative line */}
        <line x1="30" y1="66" x2="70" y2="66" stroke="var(--stamp-vermilion)" strokeWidth="0.8" opacity="0.25" />
        {/* Date-like mark */}
        <text x="50" y="78" textAnchor="middle" fontSize="8" fill="var(--stamp-vermilion)" opacity="0.4" fontFamily="'Noto Sans KR', sans-serif">
          기록 확인
        </text>
      </svg>
      <span className="sr-only">{caption}</span>
    </div>
  );
}
