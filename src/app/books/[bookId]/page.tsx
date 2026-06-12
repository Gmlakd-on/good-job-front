"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BookCompleteModal from "@/components/book-ui/BookCompleteModal";
import BookCover from "@/components/book-ui/BookCover";
import BookReader from "@/components/book-ui/BookReader";
import {
  canCompleteBook,
  canWriteBook,
  getBookStatusLabel,
  type DiaryBook,
} from "@/components/book-ui/bookTypes";

interface DiaryEntry {
  id: string;
  content: string;
  created_at: string;
  weather_code?: string | null;
  weather_label?: string | null;
  diary_emotions: { emotion_code?: string; emotion_label: string }[];
  replies?: { content?: string; persona?: string }[];
}

export default function BookDetailPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<DiaryBook | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completeOpen, setCompleteOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      try {
        const [bookRes, diariesRes] = await Promise.all([
          fetch(`/api/diary-books/${bookId}`),
          fetch(`/api/diaries?book_id=${bookId}`),
        ]);

        if (!bookRes.ok) throw new Error("일기장을 찾을 수 없어요.");

        const bookData = await bookRes.json();
        setBook(bookData.book);

        if (diariesRes.ok) {
          const diariesData = await diariesRes.json();
          setEntries(diariesData.diaries || []);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "조회에 실패했어요.");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [bookId, router]);

  async function completeBook(mode: "archived" | "locked") {
    if (!book) return;

    try {
      const res = await fetch(`/api/diary-books/${book.id}/complete`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ complete_mode: mode }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "완결에 실패했어요.");
      }

      const data = await res.json();
      setBook(data.book);
    } catch (err) {
      setError(err instanceof Error ? err.message : "완결에 실패했어요.");
    } finally {
      setCompleteOpen(false);
    }
  }

  if (loading) return <p className="pt-4 font-hand text-lg opacity-45">일기장 펼치는 중…</p>;
  if (error || !book) {
    return (
      <div className="pt-4 diary-card p-5 text-center">
        <p className="text-sm text-[var(--warm-red)]">{error || "일기장을 찾을 수 없어요."}</p>
        <Link href="/books" className="mt-3 inline-block text-sm opacity-55 hover:opacity-80">← 책장</Link>
      </div>
    );
  }

  const canWrite = canWriteBook(book);
  const canComplete = canCompleteBook(book);

  return (
    <div className="book-detail-page book-detail-page--reference">
      <div className="book-detail-topbar">
        <Link href="/books">← 책장</Link>
        <h1>일기장 상세</h1>
        <Link href={`/books/${book.id}/settings`}>설정</Link>
      </div>

      <div className="book-detail-grid">
        {/* 왼쪽: 표지와 다음 행동만 — 진행률은 표시하지 않는다 */}
        <section className="book-detail-side">
          <BookCover title={book.title} coverStyleId={book.cover_style_id} coverVariant={book.cover_variant} size="md" />
          <span className="book-detail-side__status">{getBookStatusLabel(book.status)}</span>
          <h2>{book.title}</h2>
          <p>
            {book.status === "locked"
              ? "잠긴 일기장은 읽기만 가능해요."
              : "이 책 안에서 일기 작성과 답글 확인이 이어집니다."}
          </p>

          {canWrite ? (
            <Link href={`/write?bookId=${book.id}`} className="book-detail-side__write">이어 쓰기</Link>
          ) : (
            <p className="book-detail-side__locked">
              {book.status === "locked" ? "잠긴 일기장은 더 이상 작성할 수 없어요." : "이 일기장은 가득 찼어요."}
            </p>
          )}
          {canComplete && (
            <button type="button" onClick={() => setCompleteOpen(true)} className="book-detail-side__complete">
              일기장 완결하기
            </button>
          )}
        </section>

        {/* 오른쪽: 표지에 맞는 속지 위에서 기록과 답장을 한 장씩 넘겨 읽는다 */}
        <section className="book-detail-reader-panel">
          <div className="book-detail-reader-panel__head">
            <div>
              <h3>일기장 넘겨보기</h3>
              <p>한 장씩 넘기면서 기록과 답장을 같이 읽을 수 있어요.</p>
            </div>
            <span>{entries.length}장</span>
          </div>
          <BookReader entries={entries} coverStyleId={book.cover_style_id} />
        </section>
      </div>

      <BookCompleteModal open={completeOpen} onClose={() => setCompleteOpen(false)} onSelect={completeBook} />
    </div>
  );
}
