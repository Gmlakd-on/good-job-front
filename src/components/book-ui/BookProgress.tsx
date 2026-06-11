import type { DiaryBook } from "./bookTypes";

interface BookProgressProps {
  book: DiaryBook;
  variant?: "card" | "inline";
}

export default function BookProgress({ book, variant = "card" }: BookProgressProps) {
  const percent = Math.min(100, Math.round((book.entry_count / book.max_entries) * 100));
  const canComplete = book.entry_count >= 30;
  const remaining = Math.max(0, 30 - book.entry_count);

  if (variant === "inline") {
    return (
      <div className="book-progress-inline" aria-label={`작성 진행률 ${book.entry_count} / ${book.max_entries}`}>
        <span className="book-progress-inline__count">{book.entry_count}번째 기록</span>
        <span className="book-progress-inline__bar" aria-hidden>
          <span style={{ width: `${percent}%` }} />
        </span>
        <span className="book-progress-inline__remaining">
          {canComplete ? "완결 가능" : `${remaining}개 남음`}
        </span>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.68)] p-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="font-medium">작성 진행률</span>
        <span className="opacity-60">{book.entry_count} / {book.max_entries}</span>
      </div>
      <div className="h-3 overflow-hidden rounded-full bg-[rgba(122,86,56,0.14)]">
        <div
          className="h-full rounded-full bg-[var(--soft-accent)] transition-all"
          style={{ width: `${percent}%` }}
        />
      </div>
      <p className="mt-2 text-xs opacity-55">
        {canComplete
          ? "최소 30개를 채웠어요. 원하면 보관하거나 잠글 수 있어요."
          : `완결하려면 ${remaining}개를 더 써야 해요.`}
      </p>
    </div>
  );
}
