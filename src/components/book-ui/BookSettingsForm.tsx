"use client";

import { useState } from "react";
import { ARCHIVE_VARIANTS, type CoverVariant, type DiaryBook } from "./bookTypes";

interface BookSettingsFormProps {
  book: DiaryBook;
  loading?: boolean;
  onSubmit: (payload: {
    title: string;
    cover_variant: CoverVariant;
    max_entries: 30 | 50 | 100 | 365;
  }) => void;
}

export default function BookSettingsForm({ book, loading = false, onSubmit }: BookSettingsFormProps) {
  const [title, setTitle] = useState(book.title);
  const [coverVariant, setCoverVariant] = useState<CoverVariant>(book.cover_variant ?? "ochre");
  const [maxEntries, setMaxEntries] = useState<30 | 50 | 100 | 365>(book.max_entries);

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          title: title.trim(),
          cover_variant: book.cover_style_id === "archive" ? coverVariant : null,
          max_entries: maxEntries,
        });
      }}
    >
      <div className="diary-card p-5">
        <label className="block">
          <span className="font-serif text-lg">일기장 이름</span>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value.slice(0, 40))}
            className="mt-3 w-full rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] px-4 py-3 outline-none"
          />
        </label>
      </div>

      {book.cover_style_id === "archive" && (
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
        <p className="mt-2 text-xs opacity-50">이미 쓴 개수보다 작게 줄일 수 없어요.</p>
      </div>

      <button
        type="submit"
        disabled={loading || !title.trim()}
        className="rounded-full bg-[var(--soft-accent)] py-3 text-sm font-medium text-white disabled:opacity-40"
      >
        {loading ? "저장 중…" : "설정 저장"}
      </button>
    </form>
  );
}
