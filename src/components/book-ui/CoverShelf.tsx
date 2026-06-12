"use client";

/**
 * 표지 선반.
 * - 기존: 2~4열 고정 그리드 → 변경: 좌우로 자유롭게 스크롤되는 실제 '선반'.
 * - 터치/트랙패드: 손가락·휠로 좌우 스크롤(snap). 마우스 환경: 좌우 화살표 버튼 표시.
 * - 키보드: ←/→ 로 표지 이동 선택 (radiogroup 패턴).
 * - 라벨/설명은 i18n 사전을 통해 언어 설정에 따라 번역된다.
 */
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
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
  { id: "stone",   labelKey: "cover.stone.label", descKey: "cover.stone.desc", src: "/covers/stone.png" },
  { id: "archive", labelKey: "cover.archive.label", descKey: "cover.archive.desc", src: "/covers/archive.png" },
  { id: "1950",    labelKey: "cover.1950.label", descKey: "cover.1950.desc", src: "/covers/classic.png" },
  { id: "1980",    labelKey: "cover.1980.label", descKey: "cover.1980.desc", src: "/covers/sketch.png" },
  { id: "1990",    labelKey: "cover.1990.label", descKey: "cover.1990.desc", src: "/covers/pop.png" },
  { id: "2000",    labelKey: "cover.2000.label", descKey: "cover.2000.desc", src: "/covers/kitsch.png" },
  { id: "2010",    labelKey: "cover.2010.label", descKey: "cover.2010.desc", src: "/covers/minimal.png" },
];

interface CoverShelfProps {
  selected: CoverStyleId | null;
  onSelect: (id: CoverStyleId) => void;
}

export default function CoverShelf({ selected, onSelect }: CoverShelfProps) {
  const { t } = useI18n();
  const railRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  // 화살표 활성 상태 갱신 (스크롤 위치/리사이즈 기준)
  const updateArrows = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    setCanLeft(rail.scrollLeft > 4);
    setCanRight(rail.scrollLeft + rail.clientWidth < rail.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateArrows();
    const rail = railRef.current;
    if (!rail) return;
    rail.addEventListener("scroll", updateArrows, { passive: true });
    window.addEventListener("resize", updateArrows);
    return () => {
      rail.removeEventListener("scroll", updateArrows);
      window.removeEventListener("resize", updateArrows);
    };
  }, [updateArrows]);

  /**
   * 표지를 레일 가운데로 — 레일의 가로 스크롤만 움직인다.
   * (주의: scrollIntoView는 페이지(세로) 스크롤까지 함께 움직여서,
   *  홈/일기장 만들기 페이지가 접속하자마자 선반 위치로 점프하는 버그의 원인이었음.
   *  반드시 rail.scrollTo로 가로축만 제어할 것.)
   */
  const centerCover = useCallback((id: CoverStyleId, smooth: boolean) => {
    const rail = railRef.current;
    if (!rail) return;
    const el = rail.querySelector<HTMLElement>(`[data-cover-id="${id}"]`);
    if (!el) return;
    const railRect = rail.getBoundingClientRect();
    const elRect = el.getBoundingClientRect();
    const target =
      rail.scrollLeft + (elRect.left - railRect.left) - (rail.clientWidth - elRect.width) / 2;
    rail.scrollTo({
      left: Math.max(0, Math.min(target, rail.scrollWidth - rail.clientWidth)),
      behavior: smooth ? "smooth" : "auto",
    });
  }, []);

  // 선택된 표지가 보이도록 마운트 시 레일만 정렬 (페이지 스크롤은 건드리지 않음)
  useEffect(() => {
    if (selected) centerCover(selected, false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollByDir = (dir: -1 | 1) => {
    railRef.current?.scrollBy({ left: dir * 220, behavior: "smooth" });
  };

  // 키보드 ←/→ 선택 이동
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const current = Math.max(0, COVERS.findIndex((c) => c.id === selected));
    const next = event.key === "ArrowLeft"
      ? Math.max(0, current - 1)
      : Math.min(COVERS.length - 1, current + 1);
    const cover = COVERS[next];
    onSelect(cover.id);
    centerCover(cover.id, true);
  };

  return (
    <div
      className={`cover-shelf ${canLeft ? "cover-shelf--can-left" : ""} ${canRight ? "cover-shelf--can-right" : ""}`}
    >
      <button
        type="button"
        className="cover-shelf__arrow cover-shelf__arrow--left"
        aria-label={t("book.cover.scrollLeft")}
        disabled={!canLeft}
        onClick={() => scrollByDir(-1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
      </button>
      <button
        type="button"
        className="cover-shelf__arrow cover-shelf__arrow--right"
        aria-label={t("book.cover.scrollRight")}
        disabled={!canRight}
        onClick={() => scrollByDir(1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 18l6-6-6-6" /></svg>
      </button>

      <div
        ref={railRef}
        className="cover-shelf__rail"
        role="radiogroup"
        aria-label={t("book.cover.shelfAria")}
        onKeyDown={handleKeyDown}
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
              tabIndex={isSelected || (!selected && cover.id === COVERS[0].id) ? 0 : -1}
              className={`cover-shelf__item ${isSelected ? "cover-shelf__item--selected" : ""}`}
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
                  sizes="188px"
                  priority={cover.id === selected || cover.id === "stone"}
                />
              </span>
              <span className="cover-shelf__label">{t(cover.labelKey)}</span>
              <span className="cover-shelf__description">{t(cover.descKey)}</span>
            </button>
          );
        })}
      </div>

      {/* 책들이 올려진 나무 선반 보드 */}
      <div className="cover-shelf__board" aria-hidden="true" />
    </div>
  );
}
