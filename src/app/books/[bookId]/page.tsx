"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BookCompleteModal from "@/components/book-ui/BookCompleteModal";
import BookCover from "@/components/book-ui/BookCover";
import BookProgress from "@/components/book-ui/BookProgress";
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
    <div className="pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/books" className="text-sm opacity-40 hover:opacity-70">← 책장</Link>
        <h1 className="font-serif text-xl">일기장 상세</h1>
        <Link href={`/books/${book.id}/settings`} className="text-sm opacity-50 hover:opacity-80">설정</Link>
      </div>

      <section className="diary-card p-5">
        <div className="flex gap-5">
          <BookCover title={book.title} coverStyleId={book.cover_style_id} coverVariant={book.cover_variant} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-xs opacity-45">{getBookStatusLabel(book.status)}</p>
            <h2 className="mt-1 font-serif text-2xl leading-tight">{book.title}</h2>
            <p className="mt-2 text-sm opacity-55">
              {book.status === "locked" ? "잠긴 일기장은 읽기만 가능해요." : "이 책 안에서 일기 작성과 답글 확인이 이어집니다."}
            </p>
          </div>
        </div>
        <div className="mt-5"><BookProgress book={book} /></div>
        <div className="mt-5 grid gap-2">
          {canWrite ? (
            <Link href={`/write?bookId=${book.id}`} className="rounded-full bg-[var(--soft-accent)] py-3 text-center text-sm text-white">이어 쓰기</Link>
          ) : (
            <p className="rounded-2xl bg-[rgba(255,248,232,0.72)] p-3 text-center text-sm opacity-60">
              {book.status === "locked" ? "잠긴 일기장은 더 이상 작성할 수 없어요." : "이 일기장은 가득 찼어요."}
            </p>
          )}
          <button type="button" disabled={!canComplete} onClick={() => setCompleteOpen(true)}
            className="rounded-full bg-[var(--warm-bg-deep)] py-3 text-sm disabled:opacity-40">
            {canComplete ? "일기장 완결하기" : `완결까지 ${30 - book.entry_count}개 남음`}
          </button>
        </div>
      </section>

      <section className="mt-4 diary-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-serif text-lg">일기장 넘겨보기</h3>
            <p className="mt-1 text-xs opacity-45">한 장씩 넘기면서 기록과 답장을 같이 읽을 수 있어요.</p>
          </div>
          <span className="text-xs opacity-35">{entries.length}장</span>
        </div>
        <BookReader entries={entries} />
      </section>

      <BookCompleteModal open={completeOpen} onClose={() => setCompleteOpen(false)} onSelect={completeBook} />
    </div>
  );
}
