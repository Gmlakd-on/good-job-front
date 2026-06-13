"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
} from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { CoverStyleId } from "./bookTypes";

interface CoverDef {
  id: CoverStyleId;
  labelKey: DictKey;
  descKey: DictKey;
  src: string;
}

const COVERS: CoverDef[] = [
  {
    id: "stone",
    labelKey: "cover.stone.label",
    descKey: "cover.stone.desc",
    src: "/covers/stone.png",
  },
  {
    id: "archive",
    labelKey: "cover.archive.label",
    descKey: "cover.archive.desc",
    src: "/covers/archive.png",
  },
  {
    id: "1950",
    labelKey: "cover.1950.label",
    descKey: "cover.1950.desc",
    src: "/covers/classic.png",
  },
  {
    id: "1980",
    labelKey: "cover.1980.label",
    descKey: "cover.1980.desc",
    src: "/covers/sketch.png",
  },
  {
    id: "1990",
    labelKey: "cover.1990.label",
    descKey: "cover.1990.desc",
    src: "/covers/pop.png",
  },
  {
    id: "2000",
    labelKey: "cover.2000.label",
    descKey: "cover.2000.desc",
    src: "/covers/kitsch.png",
  },
  {
    id: "2010",
    labelKey: "cover.2010.label",
    descKey: "cover.2010.desc",
    src: "/covers/minimal.png",
  },
];

interface CoverShelfProps {
  selected: CoverStyleId | null;
  onSelect: (id: CoverStyleId) => void;
}

const shelfStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "visible",
};

const railStyle: CSSProperties = {
  display: "flex",
  gap: "clamp(18px, 2.2vw, 28px)",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "hidden",
  padding: "14px 54px 26px",
  boxSizing: "border-box",
  scrollBehavior: "smooth",
  scrollSnapType: "none",
  overscrollBehaviorX: "contain",
  WebkitOverflowScrolling: "touch",
  touchAction: "pan-x",
  cursor: "grab",
};

const boardStyle: CSSProperties = {
  height: 12,
  margin: "-8px 10px 0",
  borderRadius: 999,
  background: "linear-gradient(180deg, #b08a64, #8c6a48 70%, #715438)",
  boxShadow:
    "0 6px 14px rgba(62, 46, 30, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
};

const imageBoxStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  height: "clamp(156px, 14vw, 204px)",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
};

const imageStyle: CSSProperties = {
  width: "auto",
  height: "100%",
  maxWidth: "100%",
  objectFit: "contain",
  objectPosition: "center bottom",
  filter: "drop-shadow(0 10px 16px rgba(42, 36, 32, 0.18))",
};

const labelStyle: CSSProperties = {
  fontFamily: '"Noto Serif KR", Georgia, serif',
  fontSize: "clamp(18px, 1.5vw, 24px)",
  fontWeight: 700,
  lineHeight: 1.35,
  pointerEvents: "none",
};

const descStyle: CSSProperties = {
  minHeight: "1.6em",
  color: "var(--text-muted, #8f8378)",
  fontSize: "clamp(13px, 1vw, 16px)",
  lineHeight: 1.5,
  textAlign: "center",
  pointerEvents: "none",
};

const arrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "42%",
  zIndex: 5,
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(122, 86, 56, 0.18)",
  background: "rgba(255, 252, 246, 0.96)",
  color: "var(--text-secondary, #6b5a4c)",
  boxShadow: "0 4px 12px rgba(42, 36, 32, 0.14)",
  cursor: "pointer",
};

function getCardStyle(isSelected: boolean): CSSProperties {
  return {
    flex: "0 0 clamp(200px, 22vw, 260px)",
    width: "clamp(200px, 22vw, 260px)",
    minHeight: "clamp(296px, 30vw, 340px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    padding: "clamp(18px, 2vw, 24px) clamp(14px, 1.6vw, 20px) 24px",
    borderRadius: 24,
    border: isSelected
      ? "1.5px solid rgba(196, 85, 58, 0.82)"
      : "1px solid rgba(122, 86, 56, 0.12)",
    background: isSelected
      ? "linear-gradient(180deg, rgba(255, 247, 237, 0.98), rgba(255, 252, 247, 0.94))"
      : "rgba(255, 252, 246, 0.86)",
    color: "var(--text-primary, #3f3027)",
    boxShadow: isSelected
      ? "0 0 0 2px rgba(196, 85, 58, 0.10), 0 12px 26px rgba(42, 36, 32, 0.10)"
      : "0 2px 8px rgba(42, 36, 32, 0.04)",
    transform: isSelected ? "translateY(-4px)" : "none",
    transition:
      "transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    cursor: "pointer",
    userSelect: "none",
  };
}

export default function CoverShelf({ selected, onSelect }: CoverShelfProps) {
  const { t } = useI18n();
  const railRef = useRef<HTMLDivElement>(null);
  const ignoreNextClickRef = useRef(false);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setCanLeft(rail.scrollLeft > 4);
    setCanRight(maxLeft > 4 && rail.scrollLeft < maxLeft - 4);
  }, []);

  const centerCover = useCallback(
    (id: CoverStyleId, smooth = true) => {
      const rail = railRef.current;
      if (!rail) return;

      const target = rail.querySelector<HTMLElement>(`[data-cover-id="${id}"]`);
      if (!target) return;

      const railRect = rail.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      const nextLeft =
        rail.scrollLeft +
        targetRect.left -
        railRect.left -
        (rail.clientWidth - targetRect.width) / 2;

      const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);

      rail.scrollTo({
        left: Math.max(0, Math.min(nextLeft, maxLeft)),
        behavior: smooth ? "smooth" : "auto",
      });

      window.requestAnimationFrame(updateArrows);
    },
    [updateArrows]
  );

  const selectCover = useCallback(
    (id: CoverStyleId) => {
      onSelect(id);
      centerCover(id, true);
    },
    [centerCover, onSelect]
  );

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    updateArrows();

    const resizeObserver = new ResizeObserver(() => {
      updateArrows();
    });

    resizeObserver.observe(rail);

    const handleScroll = () => {
      updateArrows();
    };

    const handleWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) return;

      const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
      if (maxLeft <= 4) return;

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;

      if (!delta) return;

      const nextLeft = Math.max(0, Math.min(rail.scrollLeft + delta, maxLeft));

      if (Math.abs(nextLeft - rail.scrollLeft) < 1) return;

      event.preventDefault();
      rail.scrollLeft = nextLeft;
      updateArrows();
    };

    rail.addEventListener("scroll", handleScroll, { passive: true });
    rail.addEventListener("wheel", handleWheel, { passive: false });

    return () => {
      resizeObserver.disconnect();
      rail.removeEventListener("scroll", handleScroll);
      rail.removeEventListener("wheel", handleWheel);
    };
  }, [updateArrows]);

  useEffect(() => {
    if (!selected) return;

    const raf = window.requestAnimationFrame(() => {
      centerCover(selected, false);
    });

    return () => {
      window.cancelAnimationFrame(raf);
    };
  }, [centerCover, selected]);

  const getScrollStep = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 280;

    const firstCard = rail.querySelector<HTMLElement>("[data-cover-id]");
    if (!firstCard) return 280;

    return firstCard.offsetWidth + 28;
  }, []);

  const scrollByDir = useCallback(
    (dir: -1 | 1) => {
      const rail = railRef.current;
      if (!rail) return;

      rail.scrollBy({
        left: dir * getScrollStep(),
        behavior: "smooth",
      });

      window.requestAnimationFrame(updateArrows);
    },
    [getScrollStep, updateArrows]
  );

  const handleMouseDown = (event: ReactMouseEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;
    if (event.button !== 0) return;

    const startX = event.clientX;
    const startLeft = rail.scrollLeft;
    const previousBodySelect = document.body.style.userSelect;
    let moved = false;

    const handleMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;

      if (Math.abs(dx) <= 8 && !moved) return;

      moved = true;
      ignoreNextClickRef.current = true;

      document.body.style.userSelect = "none";
      rail.style.cursor = "grabbing";
      rail.scrollLeft = startLeft - dx;

      moveEvent.preventDefault();
      updateArrows();
    };

    const finish = () => {
      document.removeEventListener("mousemove", handleMove);
      document.removeEventListener("mouseup", finish);
      document.body.style.userSelect = previousBodySelect;
      rail.style.cursor = "grab";

      if (moved) {
        window.setTimeout(() => {
          ignoreNextClickRef.current = false;
        }, 80);
      } else {
        ignoreNextClickRef.current = false;
      }

      updateArrows();
    };

    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", finish, { once: true });
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const currentIndex = Math.max(
      0,
      COVERS.findIndex((cover) => cover.id === selected)
    );

    const nextIndex =
      event.key === "ArrowLeft"
        ? Math.max(0, currentIndex - 1)
        : Math.min(COVERS.length - 1, currentIndex + 1);

    selectCover(COVERS[nextIndex].id);
  };

  return (
    <div style={shelfStyle}>
      <button
        type="button"
        aria-label={t("book.cover.scrollLeft")}
        disabled={!canLeft}
        onClick={() => scrollByDir(-1)}
        style={{
          ...arrowBaseStyle,
          left: 8,
          opacity: canLeft ? 1 : 0.25,
          pointerEvents: canLeft ? "auto" : "none",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        aria-label={t("book.cover.scrollRight")}
        disabled={!canRight}
        onClick={() => scrollByDir(1)}
        style={{
          ...arrowBaseStyle,
          right: 8,
          opacity: canRight ? 1 : 0.25,
          pointerEvents: canRight ? "auto" : "none",
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      <div
        ref={railRef}
        role="radiogroup"
        aria-label={t("book.cover.shelfAria")}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        style={railStyle}
      >
        {COVERS.map((cover) => {
          const isSelected = selected === cover.id;

          return (
            <button
              key={cover.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              data-cover-id={cover.id}
              tabIndex={
                isSelected || (!selected && cover.id === COVERS[0].id) ? 0 : -1
              }
              onClick={() => {
                if (ignoreNextClickRef.current) return;
                selectCover(cover.id);
              }}
              style={getCardStyle(isSelected)}
            >
              <span style={imageBoxStyle}>
                <Image
                  src={cover.src}
                  alt={t(cover.labelKey)}
                  width={180}
                  height={240}
                  sizes="260px"
                  priority={cover.id === selected || cover.id === "archive"}
                  draggable={false}
                  style={imageStyle}
                />
              </span>

              <span style={labelStyle}>{t(cover.labelKey)}</span>
              <span style={descStyle}>{t(cover.descKey)}</span>
            </button>
          );
        })}

        <span
          aria-hidden="true"
          style={{
            flex: "0 0 12px",
            pointerEvents: "none",
          }}
        />
      </div>

      <div style={boardStyle} aria-hidden="true" />
    </div>
  );
}