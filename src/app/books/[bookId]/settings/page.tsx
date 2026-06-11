"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import BookSettingsForm from "@/components/book-ui/BookSettingsForm";
import type { CoverVariant, DiaryBook } from "@/components/book-ui/bookTypes";

export default function BookSettingsPage({ params }: { params: Promise<{ bookId: string }> }) {
  const { bookId } = use(params);
  const router = useRouter();
  const [book, setBook] = useState<DiaryBook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    async function loadBook() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      try {
        const res = await fetch(`/api/diary-books/${bookId}`);
        if (!res.ok) throw new Error("일기장을 찾을 수 없어요.");
        const data = await res.json();
        setBook(data.book);
      } catch (err) {
        setError(err instanceof Error ? err.message : "조회에 실패했어요.");
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [bookId, router]);

  async function saveSettings(payload: {
    title: string;
    cover_variant: CoverVariant;
    max_entries: 30 | 50 | 100 | 365;
  }) {
    if (!book) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/diary-books/${book.id}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "설정 저장에 실패했어요.");
      }

      const data = await res.json();
      setBook(data.book);
      setNotice("저장했어요.");
      setTimeout(() => setNotice(""), 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "설정 저장에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  if (loading && !book) {
    return <p className="pt-4 font-hand text-lg opacity-45">설정 여는 중…</p>;
  }

  if (error && !book) {
    return (
      <div className="pt-4 diary-card p-5 text-center">
        <p className="text-sm text-[var(--warm-red)]">{error}</p>
        <Link href="/books" className="mt-3 inline-block text-sm opacity-55">← 책장</Link>
      </div>
    );
  }

  if (!book) return null;

  return (
    <div className="pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href={`/books/${book.id}`} className="text-sm opacity-40 hover:opacity-70">← 상세</Link>
        <h1 className="font-serif text-xl">일기장 설정</h1>
        <span className="w-10" />
      </div>

      {notice && (
        <div className="mb-4 rounded-2xl bg-[rgba(126,155,114,0.15)] border border-[var(--warm-green)] p-3 text-sm text-[var(--warm-green)]">
          {notice}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-2xl border border-[var(--warm-red)] bg-[rgba(186,74,59,0.08)] p-3 text-sm text-[var(--warm-red)]">
          {error}
        </div>
      )}

      <BookSettingsForm book={book} loading={loading} onSubmit={saveSettings} />
    </div>
  );
}
