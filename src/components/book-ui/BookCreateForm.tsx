"use client";

import { useState } from "react";
import CoverShelf from "./CoverShelf";
import { useI18n } from "@/lib/i18n/I18nProvider";
import type { DictKey } from "@/lib/i18n/dictionary";
import type { CoverStyleId, CoverVariant } from "./bookTypes";

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

export default function BookCreateForm({
  loading = false,
  onSubmit,
}: BookCreateFormProps) {
  const { t } = useI18n();
  const [title, setTitle] = useState("");
  const [coverStyleId, setCoverStyleId] = useState<CoverStyleId>("archive");
  const [maxEntries, setMaxEntries] = useState<30 | 50 | 100 | 365>(30);

  return (
    <div
      className="book-create"
      style={{
        display: "grid",
        gap: 20,
        width: "100%",
        overflow: "visible",
      }}
    >
      <section style={{ minWidth: 0, overflow: "visible" }}>
        <p className="font-serif text-lg mb-1 px-1">{t("book.cover.heading")}</p>
        <p className="text-sm opacity-55 mb-3 px-1">{t("book.cover.sub")}</p>

        <CoverShelf selected={coverStyleId} onSelect={setCoverStyleId} />

        <p
          style={{
            marginTop: 12,
            textAlign: "center",
            fontSize: 13,
            opacity: 0.62,
          }}
        >
          {t(COVER_DESC_KEYS[coverStyleId])}
        </p>
      </section>

      <div
        style={{
          display: "grid",
          gap: 16,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))",
        }}
      >
        <div className="diary-card p-5">
          <label className="block">
            <span className="font-serif text-lg">{t("book.title.label")}</span>
            <p className="mt-1 text-sm opacity-55">
              {t("book.title.sub", { cover: t(COVER_LABEL_KEYS[coverStyleId]) })}
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
              onChange={(event) =>
                setMaxEntries(Number(event.target.value) as 30 | 50 | 100 | 365)
              }
              className="mt-3 w-full rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] px-4 py-3 outline-none"
            >
              {([30, 50, 100, 365] as const).map((n) => (
                <option key={n} value={n}>
                  {t("book.maxEntries.unit", { n })}
                </option>
              ))}
            </select>
          </label>
          <p className="mt-2 text-xs opacity-50">{t("book.maxEntries.hint")}</p>
        </div>
      </div>

      <button
        type="button"
        disabled={loading || !title.trim()}
        onClick={() => {
          if (!title.trim()) return;

          onSubmit({
            title: title.trim(),
            cover_style_id: coverStyleId,
            cover_variant: null,
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
    stone: "예: 아주 오래된 마음, 바위 위의 기록",
    archive: "예: 지난 마음 수집본, 오래된 기록함",
    "1950": "예: 나의 밤 기록장, 오늘의 조각",
    "1980": "예: 그림 옆의 하루, 연필 자국",
    "1990": "예: 오늘의 반짝임, 핑크 노트",
    "2000": "예: 반짝 스티커북, 보라빛 하루",
    "2010": "예: 오늘, 조용한 기록, 하루의 문장",
  };

  return map[id] || "예: 나의 일기장";
}