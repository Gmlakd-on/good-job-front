import type { CoverStyleId, CoverVariant } from "./bookTypes";

interface BookSpreadProps {
  title: string;
  coverStyleId: CoverStyleId;
  coverVariant?: CoverVariant;
  leftLabel?: string;
  rightLabel?: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}

export default function BookSpread({
  title,
  coverStyleId,
  coverVariant = null,
  leftLabel = "오늘의 장",
  rightLabel = "기록",
  children,
  aside,
}: BookSpreadProps) {
  const variantClass = coverStyleId === "archive" && coverVariant ? `book-spread--archive-${coverVariant}` : "";

  return (
    <section className={["book-spread", `book-spread--${coverStyleId}`, variantClass].join(" ")}>
      <aside className="book-spread__left">
        <p className="book-spread__eyebrow">{leftLabel}</p>
        <h1 className="book-spread__title">{title}</h1>
        <div className="book-spread__aside">{aside}</div>
      </aside>
      <main className="book-spread__right">
        <p className="book-spread__eyebrow">{rightLabel}</p>
        {children}
      </main>
    </section>
  );
}
