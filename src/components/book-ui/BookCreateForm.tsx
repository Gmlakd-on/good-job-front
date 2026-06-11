"use client";

/**
 * 일기장 만들기 폼.
 * 변경점:
 * - '고서 색상' 선택 제거: 표지 이미지가 색상에 따라 바뀌지 않아 의미 없는 선택이었음.
 *   cover_variant는 항상 null로 전송 (백엔드 CoverVariant 타입이 null 허용).
 * - 표지 선반은 좌우 스크롤형 CoverShelf 사용.
 * - 데스크톱(≥768px)에서는 이름/분량 입력을 2열로 배치해 세로 depth를 줄임.
 * - 모든 라벨은 언어 설정(useI18n)에 따라 번역.
 */
import { useState } from "react";
import CoverShelf from "./CoverShelf";
import { COVER_STYLES, type CoverStyleId, type CoverVariant } from "./bookTypes";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";

interface BookCreateFormProps {
  loading?: boolean;
  onSubmit: (payload: {
    title: string;
    cover_style_id: CoverStyleId;
    cover_variant: CoverVariant;
    max_entries: 30 | 50 | 100 | 365;
  }) => void;
}

const COVER_LABEL_KEYS: Record<CoverStyleId, DictKey> = {
  stone: "cover.stone.label",
  archive: "cover.archive.label",
  "1950": "cover.1950.label",
  "1980": "cover.1980.label",
  "1990": "cover.1990.label",
  "2000": "cover.2000.label",
  "2010": "cover.2010.label",
};

const COVER_DESC_KEYS: Record<CoverStyleId, DictKey> = {
  stone: "cover.stone.desc",
  archive: "cover.archive.desc",
  "1950": "cover.1950.desc",
  "1980": "cover.1980.desc",
  "1990": "cover.1990.desc",
  "2000": "cover.2000.desc",
  "2010": "cover.2010.desc",
};

export default function BookCreateForm({ loading = false, onSubmit }: BookCreateFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [coverStyleId, setCoverStyleId] = useState<CoverStyleId>("archive");
  const [maxEntries, setMaxEntries] = useState<30 | 50 | 100 | 365>(30);

  const selectedStyle = COVER_STYLES.find((s) => s.id === coverStyleId);

  return (
    <div className="grid gap-5">
      {/* 1. 표지 선반 */}
      <div className="cover-shelf-wrapper">
        <p className="font-serif text-lg mb-1 px-1">{t("book.cover.heading")}</p>
        <p className="text-sm opacity-55 mb-3 px-1">{t("book.cover.sub")}</p>
        <CoverShelf selected={coverStyleId} onSelect={setCoverStyleId} />
        {selectedStyle && (
          <p className="cover-shelf__selected-desc">{t(COVER_DESC_KEYS[coverStyleId])}</p>
        )}
      </div>

      {/* 2. 이름 + 분량 (데스크톱 2열) */}
      <div className="book-create__fields">
        <div className="diary-card p-5">
          <label className="block">
            <span className="font-serif text-lg">{t("book.title.label")}</span>
            <p className="mt-1 text-sm opacity-55">
              {selectedStyle
                ? t("book.title.sub", { cover: t(COVER_LABEL_KEYS[coverStyleId]) })
                : t("book.title.subDefault")}
            </p>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value.slice(0, 40))}
              placeholder={getPlaceholder(coverStyleId)}
              className="mt-3 w-full rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] px-4 py-3 outline-none"
            />
          </label>
        </div>

        <div className="diary-card p-5">
          <label className="block">
            <span className="font-serif text-lg">{t("book.maxEntries.label")}</span>
            <select
              value={maxEntries}
              onChange={(event) => setMaxEntries(Number(event.target.value) as 30 | 50 | 100 | 365)}
              className="mt-3 w-full rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] px-4 py-3 outline-none"
            >
              {([30, 50, 100, 365] as const).map((n) => (
                <option key={n} value={n}>{t("book.maxEntries.unit", { n })}</option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs opacity-50">{t("book.maxEntries.hint")}</p>
        </div>
      </div>

      {/* 3. 만들기 */}
      <button
        type="button"
        disabled={loading || !title.trim()}
        onClick={() => {
          if (!title.trim()) return;
          onSubmit({
            title: title.trim(),
            cover_style_id: coverStyleId,
            cover_variant: null, // 색상 변형 제거: 표지 이미지에 영향이 없어 항상 null
            max_entries: maxEntries,
          });
        }}
        className="rounded-full bg-[var(--soft-accent)] py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? t("book.submitting") : t("book.submit")}
      </button>
    </div>
  );
}

function getPlaceholder(id: CoverStyleId): string {
  const map: Record<CoverStyleId, string> = {
    stone:   "예: 아주 오래된 마음, 바위 위의 기록",
    archive: "예: 지난 마음 수집본, 오래된 기록함",
    "1950":  "예: 나의 밤 기록장, 오늘의 조각",
    "1980":  "예: 그림 옆의 하루, 연필 자국",
    "1990":  "예: 오늘의 반짝임, 핑크 노트",
    "2000":  "예: 반짝 스티커북, 보라빛 하루",
    "2010":  "예: 오늘, 조용한 기록, 하루의 문장",
  };
  return map[id] || "예: 나의 일기장";
}
