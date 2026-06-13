"use client";

/**
 * 표지 선반.
 * - 터치: 기본 좌우 스와이프
 * - 마우스: 드래그해서 좌우 이동
 * - 휠: 선반 위에서 세로 휠을 좌우 스크롤로 변환
 * - 버튼: 좌우 화살표로 카드 단위 이동
 * - 키보드: ←/→ 로 표지 선택 이동
 */
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
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

type DragState = {
  active: boolean;
  startX: number;
  startScrollLeft: number;
  moved: boolean;
  pointerId: number | null;
};

export default function CoverShelf({ selected, onSelect }: CoverShelfProps) {
  const { t } = useI18n();
  const railRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState>({
    active: false,
    startX: 0,
    startScrollLeft: 0,
    moved: false,
    pointerId: null,
  });
  const suppressClickRef = useRef(false);

  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateArrows = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;

    const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);
    setCanLeft(rail.scrollLeft > 4);
    setCanRight(maxLeft > 4 && rail.scrollLeft < maxLeft - 4);
  }, []);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail) return;

    const handleScroll = () => updateArrows();
    const handleResize = () => updateArrows();

    updateArrows();

    const raf = window.requestAnimationFrame(() => {
      updateArrows();
    });

    rail.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize);

    return () => {
      window.cancelAnimationFrame(raf);
      rail.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
    };
  }, [updateArrows]);

  const centerCover = useCallback(
    (id: CoverStyleId, smooth: boolean) => {
      const rail = railRef.current;
      if (!rail) return;

      const el = rail.querySelector<HTMLElement>(`[data-cover-id="${id}"]`);
      if (!el) return;

      const railRect = rail.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();

      const target =
        rail.scrollLeft +
        (elRect.left - railRect.left) -
        (rail.clientWidth - elRect.width) / 2;

      const maxLeft = Math.max(0, rail.scrollWidth - rail.clientWidth);

      rail.scrollTo({
        left: Math.max(0, Math.min(target, maxLeft)),
        behavior: smooth ? "smooth" : "auto",
      });

      window.requestAnimationFrame(updateArrows);
    },
    [updateArrows]
  );

  useEffect(() => {
    if (!selected) return;

    const raf = window.requestAnimationFrame(() => {
      centerCover(selected, false);
    });

    return () => window.cancelAnimationFrame(raf);
    // selected가 바뀔 때마다 강제 중앙 정렬하면 사용자가 직접 스크롤 중일 때 튈 수 있어 최초/외부 변경만 부드럽게 처리
  }, [centerCover, selected]);

  const getScrollStep = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return 288;

    const firstItem = rail.querySelector<HTMLElement>("[data-cover-id]");
    if (!firstItem) return 288;

    const styles = window.getComputedStyle(rail);
    const gap =
      Number.parseFloat(styles.columnGap) ||
      Number.parseFloat(styles.gap) ||
      0;

    return firstItem.offsetWidth + gap;
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

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();

    const current = Math.max(
      0,
      COVERS.findIndex((cover) => cover.id === selected)
    );

    const next =
      event.key === "ArrowLeft"
        ? Math.max(0, current - 1)
        : Math.min(COVERS.length - 1, current + 1);

    const cover = COVERS[next];

    onSelect(cover.id);
    centerCover(cover.id, true);
  };

  const handleWheel = (event: ReactWheelEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;

    const maxLeft = rail.scrollWidth - rail.clientWidth;
    if (maxLeft <= 4) return;

    // 트랙패드의 순수 가로 제스처는 브라우저 기본 동작에 맡김
    if (Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;

    const delta = event.deltaY;
    if (!delta) return;

    const wantsRight = delta > 0;
    const canMove = wantsRight
      ? rail.scrollLeft < maxLeft - 2
      : rail.scrollLeft > 2;

    if (!canMove) return;

    event.preventDefault();

    rail.scrollBy({
      left: delta,
      behavior: "auto",
    });

    updateArrows();
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    if (!rail) return;

    // 터치는 브라우저 기본 swipe가 더 자연스러워서 마우스 드래그만 직접 처리
    if (event.pointerType === "touch") return;
    if (event.button !== 0) return;

    dragRef.current = {
      active: true,
      startX: event.clientX,
      startScrollLeft: rail.scrollLeft,
      moved: false,
      pointerId: event.pointerId,
    };

    rail.setPointerCapture?.(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const drag = dragRef.current;

    if (!rail || !drag.active) return;

    const dx = event.clientX - drag.startX;

    if (Math.abs(dx) > 4) {
      drag.moved = true;
      suppressClickRef.current = true;
    }

    if (drag.moved) {
      event.preventDefault();
    }

    rail.scrollLeft = drag.startScrollLeft - dx;
    updateArrows();
  };

  const endDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    const rail = railRef.current;
    const drag = dragRef.current;

    if (!drag.active) return;

    if (rail && drag.pointerId !== null) {
      rail.releasePointerCapture?.(drag.pointerId);
    }

    const moved = drag.moved;

    dragRef.current = {
      active: false,
      startX: 0,
      startScrollLeft: 0,
      moved: false,
      pointerId: null,
    };

    if (moved) {
      window.setTimeout(() => {
        suppressClickRef.current = false;
      }, 0);
    } else {
      suppressClickRef.current = false;
    }

    updateArrows();
  };

  const handleClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!suppressClickRef.current) return;

    event.preventDefault();
    event.stopPropagation();
  };

  return (
    <div
      className={`cover-shelf ${canLeft ? "cover-shelf--can-left" : ""} ${
        canRight ? "cover-shelf--can-right" : ""
      }`}
      style={{ overflow: "visible" }}
    >
      <button
        type="button"
        className="cover-shelf__arrow cover-shelf__arrow--left"
        aria-label={t("book.cover.scrollLeft")}
        disabled={!canLeft}
        onClick={() => scrollByDir(-1)}
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
        className="cover-shelf__arrow cover-shelf__arrow--right"
        aria-label={t("book.cover.scrollRight")}
        disabled={!canRight}
        onClick={() => scrollByDir(1)}
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
        className="cover-shelf__rail cover-carousel"
        role="radiogroup"
        aria-label={t("book.cover.shelfAria")}
        onKeyDown={handleKeyDown}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={handleClickCapture}
        style={{
          touchAction: "pan-x",
          overflowX: "auto",
          overflowY: "hidden",
          WebkitOverflowScrolling: "touch",
          userSelect: "none",
        }}
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
              className={`cover-shelf__item cover-card ${
                isSelected ? "cover-shelf__item--selected" : ""
              }`}
              onClick={() => {
                onSelect(cover.id);
                centerCover(cover.id, true);
              }}
            >
              <span className="cover-shelf__image-box">
                <Image
                  src={cover.src}
                  alt={t(cover.labelKey)}
                  width={180}
                  height={240}
                  className="cover-shelf__image"
                  sizes="260px"
                  priority={cover.id === selected || cover.id === "stone"}
                  draggable={false}
                />
              </span>

              <span className="cover-shelf__label cover-card-title">
                {t(cover.labelKey)}
              </span>

              <span className="cover-shelf__description cover-card-description">
                {t(cover.descKey)}
              </span>
            </button>
          );
        })}

        {/* 마지막 표지도 완전히 보이도록 끝 여백 확보 */}
        <span
          aria-hidden="true"
          style={{
            flex: "0 0 clamp(48px, 14vw, 280px)",
            pointerEvents: "none",
          }}
        />
      </div>

      <div className="cover-shelf__board" aria-hidden="true" />
    </div>
  );
}