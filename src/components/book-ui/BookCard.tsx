import Link from "next/link";
import BookCover from "./BookCover";
import BookProgress from "./BookProgress";
import { canWriteBook, getBookStatusLabel, type DiaryBook } from "./bookTypes";

interface BookCardProps {
  book: DiaryBook;
}

export default function BookCard({ book }: BookCardProps) {
  const canWrite = canWriteBook(book);

  return (
    <article
      className="transition-all"
      style={{
        padding: "16px",
        borderRadius: "var(--radius-sm)",
        background: "var(--paper-white)",
        border: "1px solid var(--border-hairline)",
        boxShadow: "var(--shadow-card)",
      }}
    >
      <div className="flex gap-4">
        <BookCover
          title={book.title}
          coverStyleId={book.cover_style_id}
          coverVariant={book.cover_variant}
          size="sm"
        />
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex items-start justify-between gap-2">
            <div>
              <h2 className="font-serif text-base leading-tight font-semibold">{book.title}</h2>
              <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                {getBookStatusLabel(book.status)}
              </p>
            </div>
            <span
              className="text-xs font-medium"
              style={{
                padding: "2px 8px",
                borderRadius: "var(--radius-xs)",
                background: "var(--paper-cream)",
                color: "var(--text-secondary)",
                fontVariantNumeric: "tabular-nums",
              }}
            >
              {book.entry_count}/{book.max_entries}
            </span>
          </div>
          <BookProgress book={book} />
          <div className="mt-4 flex gap-2">
            <Link
              href={`/books/${book.id}`}
              className="text-xs font-medium transition-colors"
              style={{
                padding: "8px 16px",
                borderRadius: "var(--radius-xs)",
                background: "var(--paper-aged)",
                color: "var(--text-primary)",
              }}
            >
              열어보기
            </Link>
            {canWrite && (
              <Link
                href={`/write?bookId=${book.id}`}
                className="text-xs font-medium text-white transition-colors"
                style={{
                  padding: "8px 16px",
                  borderRadius: "var(--radius-xs)",
                  background: "var(--ink-dark)",
                }}
              >
                이어 쓰기
              </Link>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
