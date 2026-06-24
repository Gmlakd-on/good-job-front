"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import BookShelf from "@/components/book-ui/BookShelf";
import type { DiaryBook } from "@/components/book-ui/bookTypes";
import { getLastBookId } from "@/lib/lastBook";
import { apiGetJson } from "@/lib/apiCache";

export default function BooksPage() {
  const router = useRouter();
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const [books, setBooks] = useState<DiaryBook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBooks() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push("/auth");
        return;
      }

      try {
        const data = await apiGetJson<{ books?: DiaryBook[] }>("/api/diary-books", { ttlMs: 10_000 });
        const bookList: DiaryBook[] = data.books || [];
        setBooks(bookList);

        if (searchParams.get("action") === "write") {
          const lastId = getLastBookId();
          const activeBook =
            bookList.find((book) => book.status === "active" && book.id === lastId) ||
            bookList.find((book) => book.status === "active");
          if (activeBook) {
            router.replace(`/write?bookId=${activeBook.id}`);
            return;
          }
          if (bookList.length === 0 || !bookList.some((book) => book.status === "active")) {
            router.replace("/books/new");
            return;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : t("shelf.loadFail"));
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [router, searchParams, t]);

  if (loading) {
    return (
      <div className="books-page books-page--loading">
        <p>{t("shelf.sorting")}</p>
      </div>
    );
  }

  return (
    <div className="books-page">
      <div className="books-page__topbar">
        <Link href="/" className="books-page__back">← 홈으로</Link>
        <h1 className="sr-only">내 일기장</h1>
        <Link href="/books/new" className="books-page__new-book">
          <span aria-hidden="true">＋</span> 새 책
        </Link>
      </div>

      {error ? (
        <div className="books-page__empty-card" role="alert">
          <p>{error}</p>
        </div>
      ) : books.length === 0 ? (
        <div className="books-page__empty-card">
          <p className="books-page__empty-title">아직 꽂힌 일기장이 없어요.</p>
          <p>첫 일기장을 만들고 오늘의 마음을 한 권씩 모아보세요.</p>
          <Link href="/books/new">첫 일기장 만들기</Link>
        </div>
      ) : (
        <BookShelf books={books} />
      )}
    </div>
  );
}
