"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookCreateForm from "@/components/book-ui/BookCreateForm";
import type { CoverStyleId, CoverVariant } from "@/components/book-ui/bookTypes";

export default function NewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(payload: {
    title: string;
    cover_style_id: CoverStyleId;
    cover_variant: CoverVariant;
    max_entries: 30 | 50 | 100 | 365;
  }) {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/diary-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "일기장 생성에 실패했어요.");
      }

      const data = await res.json();
      router.push(`/write?bookId=${data.book.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "일기장 생성에 실패했어요.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/books" className="text-sm opacity-40 hover:opacity-70">← 책장</Link>
        <h1 className="font-serif text-xl">새 일기장</h1>
        <span className="w-10" />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-[var(--warm-red)] bg-[rgba(186,74,59,0.08)] p-3 text-sm text-[var(--warm-red)]">
          {error}
        </div>
      )}

      <BookCreateForm loading={loading} onSubmit={handleSubmit} />
    </div>
  );
}
