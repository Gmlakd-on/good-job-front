import Link from "next/link";
import BookCover from "./BookCover";
import { canWriteBook, getBookStatusLabel, type DiaryBook } from "./bookTypes";

interface BookCardProps {
  book: DiaryBook;
}

function getRemainingEntries(book: DiaryBook) {
  return Math.max(book.max_entries - book.entry_count, 0);
}

function getProgressPercent(book: DiaryBook) {
  if (book.max_entries <= 0) return 0;
  return Math.min(Math.round((book.entry_count / book.max_entries) * 100), 100);
}

export default function BookCard({ book }: BookCardProps) {
  const canWrite = canWriteBook(book);
  const progressPercent = getProgressPercent(book);
  const remainingEntries = getRemainingEntries(book);

  return (
    <article className="book-card book-card--shelf">
      <div className="book-card__cover-wrap">
        <BookCover
          title={book.title}
          coverStyleId={book.cover_style_id}
          coverVariant={book.cover_variant}
          size="md"
        />
      </div>

      <div className="book-card__body">
        <div className="book-card__title-row">
          <div>
            <h2>{book.title}</h2>
            <span className="book-card__status">{getBookStatusLabel(book.status)}</span>
          </div>
          <strong className="book-card__count">{book.entry_count} / {book.max_entries}</strong>
        </div>

        <div className="book-card__progress-box" aria-label={`작성 진행률 ${book.entry_count} / ${book.max_entries}`}>
          <div className="book-card__progress-head">
            <span>작성 진행률</span>
            <strong>{book.entry_count} / {book.max_entries}</strong>
          </div>
          <div className="book-card__progress-track">
            <span style={{ width: `${progressPercent}%` }} />
          </div>
          <p>
            {remainingEntries > 0
              ? `완결하려면 ${remainingEntries}개를 더 써야 해요.`
              : "한 권을 모두 채웠어요. 참 잘했어요!"}
          </p>
        </div>

        <div className="book-card__actions">
          <Link href={`/books/${book.id}`} className="book-card__action book-card__action--ghost">
            <span aria-hidden="true">📖</span> 열어보기
          </Link>
          {canWrite && (
            <Link href={`/write?bookId=${book.id}`} className="book-card__action book-card__action--solid">
              <span aria-hidden="true">✎</span> 이어 쓰기
            </Link>
          )}
        </div>
      </div>
    </article>
  );
}
