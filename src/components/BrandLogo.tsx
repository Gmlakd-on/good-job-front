import Image from "next/image";
import type { Language } from "@/lib/i18n/dictionary";

const LOGO_ASSETS: Record<Language, { src: string; width: number; height: number }> = {
  ko: {
    src: "/brand/logo-ko.png",
    width: 614,
    height: 240,
  },
  en: {
    src: "/brand/logo-en.png",
    width: 767,
    height: 240,
  },
};

interface BrandLogoProps {
  language: Language;
  className?: string;
  priority?: boolean;
}

export default function BrandLogo({ language, className = "", priority = false }: BrandLogoProps) {
  const asset = LOGO_ASSETS[language];

  return (
    <span className={`brand-logo ${className}`.trim()} aria-hidden="true">
      <Image
        className="brand-logo__image"
        src={asset.src}
        alt=""
        width={asset.width}
        height={asset.height}
        sizes="(max-width: 767px) 112px, 184px"
        priority={priority}
      />
    </span>
  );
}
