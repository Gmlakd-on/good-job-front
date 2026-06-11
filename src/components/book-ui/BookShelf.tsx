import Link from "next/link";
import BookCard from "./BookCard";
import type { DiaryBook } from "./bookTypes";

interface BookShelfProps {
  books: DiaryBook[];
}

export default function BookShelf({ books }: BookShelfProps) {
  if (books.length === 0) {
    return (
      <div
        className="text-center"
        style={{
          padding: "48px 24px",
          borderRadius: "var(--radius-sm)",
          border: "1px dashed var(--border-medium)",
          background: "transparent",
        }}
      >
        <p className="font-serif text-lg" style={{ color: "var(--text-primary)" }}>
          아직 일기장이 없어요
        </p>
        <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>
          첫 일기장을 만들고 표지를 골라보세요.
        </p>
        <Link
          href="/books/new"
          className="mt-5 inline-flex text-sm font-medium text-white"
          style={{
            padding: "12px 24px",
            borderRadius: "var(--radius-sm)",
            background: "var(--ink-dark)",
          }}
        >
          첫 일기장 만들기
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {books.map((book) => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}
