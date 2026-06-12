"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/lib/i18n/I18nProvider";
import BookShelf from "@/components/book-ui/BookShelf";
import type { DiaryBook } from "@/components/book-ui/bookTypes";
import { getLastBookId } from "@/lib/lastBook";

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
        const res = await fetch("/api/diary-books");
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || t("shelf.loadFail"));
        }
        const data = await res.json();
        const bookList: DiaryBook[] = data.books || [];
        setBooks(bookList);

        // action=write일 때 활성 일기장이 있으면 바로 쓰기로
        if (searchParams.get("action") === "write") {
          // 마지막으로 쓰던 일기장 우선, 없으면 첫 활성 일기장
          const lastId = getLastBookId();
          const activeBook =
            bookList.find((b) => b.status === "active" && b.id === lastId) ||
            bookList.find((b) => b.status === "active");
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
        setError(err instanceof Error ? err.message : t("shelf.loadFail"));
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className="pt-4">
        <p className="font-hand text-lg opacity-45">{t("shelf.sorting")}</p>
      </div>
    );
  }

  return (
    <div className="pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/" className="text-sm opacity-40 hover:opacity-70">← {t("common.back.home")}</Link>
        <h1 className="font-serif text-xl">{t("shelf.title")}</h1>
        <Link href="/books/new" className="rounded-full bg-[var(--soft-accent)] px-3 py-1 text-sm text-white">
          {t("shelf.newBook")}
        </Link>
      </div>

      {error ? (
        <div className="diary-card p-5 text-center">
          <p className="text-sm text-[var(--warm-red)]">{error}</p>
        </div>
      ) : books.length === 0 ? (
        <div className="empty-shelf">
          {/* 빈 선반 + 점선 유령 책: "여기에 첫 권이 꽂힐 자리"를 보여준다 */}
          <svg className="empty-shelf__art" width="180" height="120" viewBox="0 0 180 120" fill="none" aria-hidden="true">
            <g className="empty-shelf__ghost">
              <rect x="70" y="22" width="40" height="74" rx="5"
                stroke="rgba(196,85,58,0.55)" strokeWidth="2" strokeDasharray="5 5" fill="rgba(255,247,237,0.6)" />
              <path d="M90 50v18M81 59h18" stroke="rgba(196,85,58,0.55)" strokeWidth="2" strokeLinecap="round" />
            </g>
            <rect x="14" y="98" width="152" height="10" rx="3" fill="#a07c56" />
            <rect x="14" y="98" width="152" height="4" rx="2" fill="#b8946a" />
            <path d="M30 14l2.2 5 5 2.2-5 2.2-2.2 5-2.2-5-5-2.2 5-2.2 2.2-5z" fill="rgba(217,164,86,0.7)" />
            <circle cx="150" cy="36" r="2.5" fill="rgba(217,164,86,0.55)" />
          </svg>
          <p className="empty-shelf__title">{t("shelf.emptyTitle")}</p>
          <p className="empty-shelf__sub">{t("shelf.emptySub1")}<br />{t("shelf.emptySub2")}</p>
          <Link href="/books/new" className="empty-shelf__cta">
            {t("shelf.emptyCta")}
          </Link>
        </div>
      ) : (
        <BookShelf books={books} />
      )}
    </div>
  );
}
