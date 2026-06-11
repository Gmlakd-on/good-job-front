"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BookShelf from "@/components/book-ui/BookShelf";
import type { DiaryBook } from "@/components/book-ui/bookTypes";

export default function BooksPage() {
  const router = useRouter();
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
        const res = await fetch("/api/diary-books");
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || "일기장 조회에 실패했어요.");
        }
        const data = await res.json();
        const bookList: DiaryBook[] = data.books || [];
        setBooks(bookList);

        // action=write일 때 활성 일기장이 있으면 바로 쓰기로
        if (searchParams.get("action") === "write") {
          const activeBook = bookList.find((b) => b.status === "active");
          if (activeBook) {
            router.replace(`/write?bookId=${activeBook.id}`);
            return;
          }
          // 활성 일기장 없으면 새 일기장 생성으로
          if (bookList.length === 0 || !bookList.some((b) => b.status === "active")) {
            router.replace("/books/new");
            return;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "일기장 조회에 실패했어요.");
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="pt-4">
        <p className="font-hand text-lg opacity-45">책장 정리 중…</p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm opacity-40 hover:opacity-70">← 홈</Link>
        <h1 className="font-serif text-xl">내 일기장</h1>
        <Link href="/books/new" className="rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm text-white">
          새 책
        </Link>
      </div>

      {error ? (
        <div className="diary-card p-5 text-center">
          <p className="text-sm text-[var(--warm-red)]">{error}</p>
        </div>
      ) : books.length === 0 ? (
        <div className="diary-card p-8 text-center">
          <p className="font-serif text-lg mb-2">아직 일기장이 없어요</p>
          <p className="text-sm opacity-55 mb-4">첫 번째 일기장을 만들어볼까요?</p>
          <Link href="/books/new" className="stamp-button inline-block rounded-full px-6 py-2 text-sm">
            새 일기장 만들기
          </Link>
        </div>
      ) : (
        <BookShelf books={books} />
      )}
    </div>
  );
}
