"use client";

import { useRef, useState, useCallback, useEffect } from "react";
import Image from "next/image";
import type { CoverStyleId } from "./bookTypes";

// ── Cover data ──────────────────────────────────────
interface CoverDef {
  id: CoverStyleId;
  label: string;
  subtitle: string;
  description: string;
  src: string;
  bgScene: string;
}

const COVERS: CoverDef[] = [
  {
    id: "stone", label: "돌판", subtitle: "STONE",
    description: "처음의 기록처럼 묵직한 석판",
    src: "/covers/stone.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #4a4540 0%, #2a2520 60%, #1a1815 100%)",
  },
  {
    id: "archive", label: "고서", subtitle: "ARCHIVE",
    description: "오래 보관한 기록물 같은 책",
    src: "/covers/archive.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #5c4a30 0%, #3a2a18 60%, #1a1208 100%)",
  },
  {
    id: "1950", label: "클래식", subtitle: "CLASSIC",
    description: "시간을 품은 우아한 가죽 노트",
    src: "/covers/classic.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #4a3828 0%, #2a1e14 60%, #18100a 100%)",
  },
  {
    id: "1980", label: "스케치", subtitle: "SKETCH",
    description: "가벼운 드로잉 노트",
    src: "/covers/sketch.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #d8cbb0 0%, #b8a888 60%, #908068 100%)",
  },
  {
    id: "1990", label: "팝", subtitle: "POP",
    description: "밝고 통통 튀는 파스텔",
    src: "/covers/pop.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #f0c8d8 0%, #d898b0 60%, #b07088 100%)",
  },
  {
    id: "2000", label: "키치", subtitle: "KITSCH",
    description: "스티커와 꾸미기 감성",
    src: "/covers/kitsch.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #ffe082 0%, #e8b040 60%, #c08820 100%)",
  },
  {
    id: "2010", label: "미니멀", subtitle: "MINIMAL",
    description: "비워둔 듯 깔끔한 노트",
    src: "/covers/minimal.png",
    bgScene: "radial-gradient(ellipse at 50% 80%, #e0ddd4 0%, #c0bdb4 60%, #98958e 100%)",
  },
];

// ── Sound manager ────────────────────────────────────
function useSounds() {
  const ctxRef = useRef<AudioContext | null>(null);

  const getCtx = useCallback(() => {
    if (!ctxRef.current) {
      ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return ctxRef.current;
  }, []);

  const playHover = useCallback(() => {
    try {
      const ctx = getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.08);
    } catch { /* silent */ }
  }, [getCtx]);

  const playSelect = useCallback(() => {
    try {
      const ctx = getCtx();
      [440, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + i * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.08 + 0.15);
        osc.start(ctx.currentTime + i * 0.08);
        osc.stop(ctx.currentTime + i * 0.08 + 0.15);
      });
    } catch { /* silent */ }
  }, [getCtx]);

  return { playHover, playSelect };
}

// ── Props ────────────────────────────────────────────
interface CoverShelfProps {
  selected: CoverStyleId | null;
  onSelect: (id: CoverStyleId) => void;
}

// ── Component ────────────────────────────────────────
export default function CoverShelf({ selected, onSelect }: CoverShelfProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [hovered, setHovered] = useState<CoverStyleId | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const { playHover, playSelect } = useSounds();

  const activeCover = COVERS.find((c) => c.id === (hovered || selected));
  const bgScene = activeCover?.bgScene || "radial-gradient(ellipse at 50% 80%, #3a352e 0%, #2a2520 60%, #1a1815 100%)";

  // Scroll selected into view
  useEffect(() => {
    if (!selected || !trackRef.current) return;
    const idx = COVERS.findIndex((c) => c.id === selected);
    if (idx >= 0) {
      const el = trackRef.current.children[idx] as HTMLElement | undefined;
      el?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [selected]);

  // Drag-vs-tap
  const dragRef = useRef({ down: false, startX: 0, scrollLeft: 0, moved: false });

  function handlePointerDown(e: React.PointerEvent) {
    const track = trackRef.current;
    if (!track) return;
    dragRef.current = { down: true, startX: e.pageX - track.offsetLeft, scrollLeft: track.scrollLeft, moved: false };
  }
  function handlePointerMove(e: React.PointerEvent) {
    if (!dragRef.current.down || !trackRef.current) return;
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - dragRef.current.startX) * 1.35;
    if (Math.abs(walk) > 8) dragRef.current.moved = true;
    trackRef.current.scrollLeft = dragRef.current.scrollLeft - walk;
  }
  function handlePointerUp() {
    dragRef.current.down = false;
    setTimeout(() => { dragRef.current.moved = false; }, 80);
  }

  const handleHover = useCallback((id: CoverStyleId) => {
    setHovered(id);
    if (soundEnabled) playHover();
  }, [soundEnabled, playHover]);

  const handleSelect = useCallback((id: CoverStyleId) => {
    if (dragRef.current.moved) return;
    onSelect(id);
    if (soundEnabled) playSelect();
  }, [onSelect, soundEnabled, playSelect]);

  return (
    <div className="cshelf">
      {/* Background scene */}
      <div className="cshelf__bg" style={{ background: bgScene }} />

      {/* Floating particles */}
      <div className="cshelf__particles" aria-hidden>
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="cshelf__particle"
            style={{
              left: `${15 + i * 14}%`,
              animationDelay: `${i * 0.7}s`,
              animationDuration: `${3 + i * 0.5}s`,
            }}
          />
        ))}
      </div>

      {/* Center info */}
      <div className="cshelf__center-info">
        <p className="cshelf__center-label">
          {activeCover?.label || "참 잘했어요"}
        </p>
        <p className="cshelf__center-desc">
          {activeCover?.description || "기록장을 골라주세요"}
        </p>
      </div>

      {/* Sound toggle */}
      <button
        type="button"
        className="cshelf__sound-btn"
        onClick={() => setSoundEnabled(!soundEnabled)}
        aria-label={soundEnabled ? "사운드 끄기" : "사운드 켜기"}
      >
        {soundEnabled ? "🔊" : "🔇"}
      </button>

      {/* Book track */}
      <div className="cshelf__stage">
        <div
          ref={trackRef}
          className="cshelf__track"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          style={{ touchAction: "pan-x" }}
          role="listbox"
          aria-label="표지 선택"
        >
          {COVERS.map((cover) => {
            const isActive = selected === cover.id;
            const isHover = hovered === cover.id;
            const isLifted = isActive || isHover;

            return (
              <button
                key={cover.id}
                type="button"
                role="option"
                aria-selected={isActive}
                className={`cshelf__slot ${isActive ? "active" : ""}`}
                onMouseEnter={() => handleHover(cover.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => handleSelect(cover.id)}
              >
                {/* Cover image — transparent PNG shown as-is */}
                <div
                  className="cshelf__cover-img-wrap"
                  style={{
                    transform: isActive
                      ? "translateY(-40px) scale(1.15)"
                      : isHover
                        ? "translateY(-24px) scale(1.08)"
                        : "translateY(0) scale(1)",
                  }}
                >
                  <Image
                    src={cover.src}
                    alt={`${cover.label} 표지`}
                    width={180}
                    height={260}
                    className="cshelf__cover-img"
                    draggable={false}
                    priority
                  />

                  {/* Shadow underneath — grows when lifted */}
                  <div
                    className="cshelf__img-shadow"
                    style={{
                      opacity: isActive ? 0.4 : isHover ? 0.25 : 0.12,
                      transform: isActive
                        ? "scaleX(0.85) scaleY(0.5) translateY(8px)"
                        : isHover
                          ? "scaleX(0.9) scaleY(0.6) translateY(4px)"
                          : "scaleX(0.95) scaleY(0.7)",
                    }}
                  />
                </div>

                {/* Label */}
                <span className={`cshelf__label ${isLifted ? "lifted" : ""}`}>
                  {cover.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Shelf ledge */}
        <div className="cshelf__ledge">
          <div className="cshelf__ledge-hl" />
        </div>
      </div>
    </div>
  );
}
