"use client";

import { useState } from "react";
import CoverShelf from "./CoverShelf";
import { ARCHIVE_VARIANTS, COVER_STYLES, type CoverStyleId, type CoverVariant } from "./bookTypes";

interface BookCreateFormProps {
  loading?: boolean;
  onSubmit: (payload: {
    title: string;
    cover_style_id: CoverStyleId;
    cover_variant: CoverVariant;
    max_entries: 30 | 50 | 100 | 365;
  }) => void;
}

export default function BookCreateForm({ loading = false, onSubmit }: BookCreateFormProps) {
  const [title, setTitle] = useState("");
  const [coverStyleId, setCoverStyleId] = useState<CoverStyleId>("archive");
  const [coverVariant, setCoverVariant] = useState<CoverVariant>("ochre");
  const [maxEntries, setMaxEntries] = useState<30 | 50 | 100 | 365>(30);

  const normalizedVariant = coverStyleId === "archive" ? coverVariant : null;
  const selectedStyle = COVER_STYLES.find((s) => s.id === coverStyleId);

  return (
    <div className="grid gap-5">
      {/* 1. Cover shelf selection */}
      <div className="cover-shelf-wrapper">
        <p className="font-serif text-lg mb-1 px-1">표지를 골라주세요</p>
        <p className="text-sm opacity-55 mb-4 px-1">한 권을 다 쓸 때까지 유지되는 표지예요.</p>
        <CoverShelf selected={coverStyleId} onSelect={setCoverStyleId} />
        {selectedStyle && (
          <p className="mt-3 text-center text-sm opacity-60">{selectedStyle.description}</p>
        )}
      </div>

      {/* 2. Archive variant */}
      {coverStyleId === "archive" && (
        <div className="diary-card p-5">
          <p className="font-serif text-lg">고서 색상</p>
          <div className="mt-3 flex gap-2">
            {ARCHIVE_VARIANTS.map((variant) => (
              <button
                key={variant.id}
                type="button"
                onClick={() => setCoverVariant(variant.id)}
                className={`archive-swatch archive-swatch--${variant.id} ${coverVariant === variant.id ? "archive-swatch--active" : ""}`}
              >
                {variant.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 3. Title */}
      <div className="diary-card p-5">
        <label className="block">
          <span className="font-serif text-lg">일기장 이름</span>
          <p className="mt-1 text-sm opacity-55">
            {selectedStyle
              ? `${selectedStyle.label} 표지에 어울리는 이름을 지어주세요.`
              : "일기장 이름을 지어주세요."}
          </p>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 40))}
            placeholder={getPlaceholder(coverStyleId)}
            className="mt-3 w-full rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] px-4 py-3 outline-none"
          />
        </label>
      </div>

      {/* 4. Max entries */}
      <div className="diary-card p-5">
        <label className="block">
          <span className="font-serif text-lg">한 권 분량</span>
          <select
            value={maxEntries}
            onChange={(event) => setMaxEntries(Number(event.target.value) as 30 | 50 | 100 | 365)}
            className="mt-3 w-full rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] px-4 py-3 outline-none"
          >
            <option value={30}>30개</option>
            <option value={50}>50개</option>
            <option value={100}>100개</option>
            <option value={365}>365개</option>
          </select>
        </label>
        <p className="mt-2 text-xs opacity-50">최소 30개를 써야 완결할 수 있어요.</p>
      </div>

      {/* 5. Submit */}
      <button
        type="button"
        disabled={loading || !title.trim()}
        onClick={() => {
          if (!title.trim()) return;
          onSubmit({
            title: title.trim(),
            cover_style_id: coverStyleId,
            cover_variant: normalizedVariant,
            max_entries: maxEntries,
          });
        }}
        className="rounded-full bg-[var(--soft-accent)] py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? "만드는 중…" : "일기장 만들기"}
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
