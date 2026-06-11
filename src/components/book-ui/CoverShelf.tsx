"use client";

import Image from "next/image";
import type { CoverStyleId } from "./bookTypes";

interface CoverDef {
  id: CoverStyleId;
  label: string;
  description: string;
  src: string;
}

const COVERS: CoverDef[] = [
  {
    id: "stone",
    label: "돌판",
    description: "처음의 기록처럼 묵직한 석판",
    src: "/covers/stone.png",
  },
  {
    id: "archive",
    label: "고서",
    description: "오래 보관한 기록물 같은 책",
    src: "/covers/archive.png",
  },
  {
    id: "1950",
    label: "클래식",
    description: "시간을 품은 우아한 가죽 노트",
    src: "/covers/classic.png",
  },
  {
    id: "1980",
    label: "스케치",
    description: "가벼운 드로잉 노트",
    src: "/covers/sketch.png",
  },
  {
    id: "1990",
    label: "팝",
    description: "밝고 통통 튀는 파스텔",
    src: "/covers/pop.png",
  },
  {
    id: "2000",
    label: "키치",
    description: "스티커와 꾸미기 감성",
    src: "/covers/kitsch.png",
  },
  {
    id: "2010",
    label: "미니멀",
    description: "비워둔 듯 깔끔한 노트",
    src: "/covers/minimal.png",
  },
];

interface CoverShelfProps {
  selected: CoverStyleId | null;
  onSelect: (id: CoverStyleId) => void;
}

export default function CoverShelf({ selected, onSelect }: CoverShelfProps) {
  return (
    <div className="cover-picker" role="radiogroup" aria-label="일기장 표지 선택">
      {COVERS.map((cover) => {
        const isSelected = selected === cover.id;

        return (
          <button
            key={cover.id}
            type="button"
            role="radio"
            aria-checked={isSelected}
            className={`cover-picker__item ${isSelected ? "cover-picker__item--selected" : ""}`}
            onClick={() => onSelect(cover.id)}
          >
            <span className="cover-picker__image-box">
              <Image
                src={cover.src}
                alt={`${cover.label} 표지`}
                width={180}
                height={240}
                className="cover-picker__image"
                sizes="(max-width: 480px) 42vw, 132px"
                priority={cover.id === selected || cover.id === "stone"}
              />
            </span>
            <span className="cover-picker__label">{cover.label}</span>
            <span className="cover-picker__description">{cover.description}</span>
          </button>
        );
      })}
    </div>
  );
}
