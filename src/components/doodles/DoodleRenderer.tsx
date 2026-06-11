"use client";

import { useMemo } from "react";
import type { DoodleType, DoodleIntensity } from "@/types";

// ─── Randomization helpers ───
function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pickSlot(index: number): { top?: string; bottom?: string; left?: string; right?: string } {
  const slots = [
    { top: "8px", right: "14px" },
    { bottom: "10px", right: "16px" },
    { bottom: "8px", left: "14px" },
    { top: "10px", left: "16px" },
    { bottom: "12px", right: "48px" },
  ];
  return slots[index % slots.length];
}

// ─── Individual Doodle SVGs ───

function StampDoodle({ color, rotation }: { color: string; rotation: number }) {
  return (
    <svg
      width="48" height="48" viewBox="0 0 48 48"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="2" opacity="0.5" />
      <circle cx="24" cy="24" r="17" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <text x="24" y="21" textAnchor="middle" fontSize="8" fill={color} fontWeight="600" opacity="0.6">참</text>
      <text x="24" y="31" textAnchor="middle" fontSize="7.5" fill={color} fontWeight="600" opacity="0.6">잘했어요</text>
    </svg>
  );
}

function HandwritingDoodle({ color, text, rotation }: { color: string; text: string; rotation: number }) {
  return (
    <span
      style={{
        fontFamily: "'Gaegu', 'Nanum Pen Script', cursive",
        fontSize: "13px",
        color,
        opacity: 0.5,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
        whiteSpace: "nowrap",
        letterSpacing: "0.5px",
      }}
      aria-hidden
    >
      {text}
    </span>
  );
}

function PawDoodle({ color, rotation }: { color: string; rotation: number }) {
  return (
    <svg
      width="28" height="28" viewBox="0 0 28 28"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <circle cx="14" cy="16" r="7" fill={color} opacity="0.2" />
      <circle cx="8" cy="9" r="3.5" fill={color} opacity="0.18" />
      <circle cx="14" cy="6" r="3.5" fill={color} opacity="0.18" />
      <circle cx="20" cy="9" r="3.5" fill={color} opacity="0.18" />
    </svg>
  );
}

function ScratchDoodle({ color, rotation }: { color: string; rotation: number }) {
  return (
    <svg
      width="32" height="20" viewBox="0 0 32 20"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <line x1="2" y1="3" x2="28" y2="5" stroke={color} strokeWidth="1" opacity="0.25" strokeLinecap="round" />
      <line x1="4" y1="9" x2="30" y2="11" stroke={color} strokeWidth="1" opacity="0.2" strokeLinecap="round" />
      <line x1="1" y1="15" x2="26" y2="17" stroke={color} strokeWidth="1" opacity="0.22" strokeLinecap="round" />
    </svg>
  );
}

function FishDoodle({ color, rotation }: { color: string; rotation: number }) {
  return (
    <span
      style={{
        fontSize: "12px",
        color,
        opacity: 0.35,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
        letterSpacing: "1px",
      }}
      aria-hidden
    >
      {"~)><"}
    </span>
  );
}

function CheckDoodle({ color, rotation }: { color: string; rotation: number }) {
  return (
    <span
      style={{
        fontSize: "22px",
        color,
        opacity: 0.35,
        transform: `rotate(${rotation}deg)`,
        display: "inline-block",
        fontWeight: 500,
      }}
      aria-hidden
    >
      V
    </span>
  );
}

function UnderlineDoodle({ color }: { color: string }) {
  return (
    <svg width="100%" height="4" viewBox="0 0 200 4" preserveAspectRatio="none" aria-hidden
      style={{ position: "absolute", bottom: "44px", left: "20px", right: "80px", opacity: 0.2 }}
    >
      <path
        d="M0,2 Q10,0 20,2 Q30,4 40,2 Q50,0 60,2 Q70,4 80,2 Q90,0 100,2 Q110,4 120,2 Q130,0 140,2 Q150,4 160,2 Q170,0 180,2 Q190,4 200,2"
        fill="none" stroke={color} strokeWidth="1.5"
      />
    </svg>
  );
}

function DotDoodle({ color }: { color: string }) {
  return (
    <div
      style={{
        width: "5px",
        height: "5px",
        borderRadius: "50%",
        background: color,
        opacity: 0.35,
      }}
      aria-hidden
    />
  );
}

function CurlDoodle({ color, rotation }: { color: string; rotation: number }) {
  return (
    <svg
      width="24" height="24" viewBox="0 0 24 24"
      style={{ transform: `rotate(${rotation}deg)` }}
      aria-hidden
    >
      <path
        d="M4,20 Q4,8 12,8 Q20,8 20,14 Q20,20 14,18 Q8,16 10,12"
        fill="none" stroke={color} strokeWidth="1.5" opacity="0.25" strokeLinecap="round"
      />
    </svg>
  );
}

function MirrorDoodle({ color }: { color: string }) {
  return (
    <svg width="24" height="34" viewBox="0 0 24 34" aria-hidden>
      <ellipse cx="12" cy="13" rx="10" ry="13" fill="none" stroke={color} strokeWidth="1.5" opacity="0.15" />
      <line x1="12" y1="26" x2="12" y2="33" stroke={color} strokeWidth="1.5" opacity="0.15" strokeLinecap="round" />
    </svg>
  );
}

// ─── Doodle Renderer Map ───
function renderDoodle(
  type: DoodleType,
  color: string,
  rotation: number,
  text?: string
): React.ReactNode {
  switch (type) {
    case "stamp":       return <StampDoodle color={color} rotation={rotation} />;
    case "handwriting": return <HandwritingDoodle color={color} text={text || "잘했어 ♡"} rotation={rotation} />;
    case "paw":         return <PawDoodle color={color} rotation={rotation} />;
    case "scratch":     return <ScratchDoodle color={color} rotation={rotation} />;
    case "fish":        return <FishDoodle color={color} rotation={rotation} />;
    case "check":       return <CheckDoodle color={color} rotation={rotation} />;
    case "underline":   return <UnderlineDoodle color={color} />;
    case "dot":         return <DotDoodle color={color} />;
    case "curl":        return <CurlDoodle color={color} rotation={rotation} />;
    case "mirror":      return <MirrorDoodle color={color} />;
    default:            return null;
  }
}

// ─── Main Component ───
interface DoodleRendererProps {
  types: DoodleType[];
  color: string;
  intensity?: DoodleIntensity;
  text?: string;
}

export default function DoodleRenderer({
  types,
  color,
  intensity = "normal",
  text,
}: DoodleRendererProps) {
  const doodles = useMemo(() => {
    const count = intensity === "light" ? 1 : Math.min(types.length, 3);
    const selected = types.slice(0, count);

    return selected.map((type, i) => {
      const rotation = rand(-8, 8);
      const slot = pickSlot(i);
      const delay = 300 + i * 200; // stagger after reply appears

      return {
        key: `${type}-${i}`,
        type,
        rotation,
        slot,
        delay,
      };
    });
  }, [types, intensity]);

  return (
    <>
      {doodles.map((d) => (
        <div
          key={d.key}
          className="animate-doodle-appear"
          style={{
            position: "absolute",
            ...d.slot,
            pointerEvents: "none",
            zIndex: 1,
            animationDelay: `${d.delay}ms`,
          }}
        >
          {renderDoodle(d.type, color, d.rotation, text)}
        </div>
      ))}
    </>
  );
}
