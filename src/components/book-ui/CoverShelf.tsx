"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { CoverStyleId } from "./bookTypes";
import { COVERS } from "./coverShelfData";
import {
  arrowBaseStyle,
  boardStyle,
  descStyle,
  getCardStyle,
  imageBoxStyle,
  imageStyle,
  labelStyle,
  railStyle,
  shelfStyle,
} from "./coverShelfStyles";
import { useHorizontalDragScroll } from "./hooks/useHorizontalDragScroll";

interface CoverShelfProps {
  selected: CoverStyleId | null;
  onSelect: (id: CoverStyleId) => void;
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

  const dragHandlers = useHorizontalDragScroll<HTMLDivElement>({
    scrollRef: railRef,
    onDragMove: updateArrows,
    onDragEnd: (didDrag) => {
      if (didDrag) {
        ignoreNextClickRef.current = true;
        window.setTimeout(() => {
          ignoreNextClickRef.current = false;
        }, 120);
        return;
      }

      ignoreNextClickRef.current = false;
    },
  });

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
        onKeyDown={handleKeyDown}
        style={railStyle}
        {...dragHandlers}
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