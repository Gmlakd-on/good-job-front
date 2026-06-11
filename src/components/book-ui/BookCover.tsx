import Image from "next/image";
import type { CoverStyleId, CoverVariant } from "./bookTypes";

const COVER_IMAGES: Record<CoverStyleId, { src: string; alt: string }> = {
  stone:   { src: "/covers/stone.png",   alt: "돌판 표지" },
  archive: { src: "/covers/archive.png", alt: "고서 표지" },
  "1950":  { src: "/covers/classic.png",  alt: "클래식 표지" },
  "1980":  { src: "/covers/sketch.png",   alt: "스케치 표지" },
  "1990":  { src: "/covers/pop.png",      alt: "팝 표지" },
  "2000":  { src: "/covers/kitsch.png",   alt: "키치 표지" },
  "2010":  { src: "/covers/minimal.png",  alt: "미니멀 표지" },
};

const SIZE_MAP = {
  sm: { w: 100, h: 160, cls: "w-[100px] h-[160px]" },
  md: { w: 140, h: 224, cls: "w-[140px] h-[224px]" },
  lg: { w: 200, h: 320, cls: "w-[200px] h-[320px]" },
};

interface BookCoverProps {
  title: string;
  coverStyleId: CoverStyleId;
  coverVariant?: CoverVariant;
  size?: "sm" | "md" | "lg";
  active?: boolean;
  onClick?: () => void;
}

export default function BookCover({
  coverStyleId,
  size = "md",
  active = false,
  onClick,
}: BookCoverProps) {
  const img = COVER_IMAGES[coverStyleId] || COVER_IMAGES.archive;
  const dim = SIZE_MAP[size];
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={[
        "book-cover-img relative flex-shrink-0 transition-transform duration-200",
        active ? "scale-105 -translate-y-1" : "",
        onClick ? "cursor-pointer hover:scale-105 hover:-translate-y-1" : "",
        dim.cls,
      ].join(" ")}
      style={{
        perspective: "600px",
        ...(active ? { filter: "drop-shadow(0 12px 20px rgba(0,0,0,0.35))" } : { filter: "drop-shadow(0 8px 14px rgba(0,0,0,0.25))" }),
      }}
      aria-label={onClick ? `${img.alt} 선택` : undefined}
    >
      <Image
        src={img.src}
        alt={img.alt}
        width={dim.w}
        height={dim.h}
        className="object-contain object-bottom w-full h-full pointer-events-none select-none"
        draggable={false}
        priority={size === "lg"}
      />
    </Component>
  );
}
