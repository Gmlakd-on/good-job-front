"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BookCreateForm from "@/components/book-ui/BookCreateForm";
import type { CoverStyleId, CoverVariant } from "@/components/book-ui/bookTypes";

type ApiErrorResponse = {
  error?: string;
  details?: unknown;
};

function formatDetails(details: unknown) {
  if (!details) return "";

  try {
    return JSON.stringify(details, null, 2);
  } catch {
    return String(details);
  }
}

export default function NewBookPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [errorDetails, setErrorDetails] = useState("");

  async function handleSubmit(payload: {
    title: string;
    cover_style_id: CoverStyleId;
    cover_variant: CoverVariant;
    max_entries: 30 | 50 | 100 | 365;
  }) {
    setLoading(true);
    setError("");
    setErrorDetails("");

    try {
      const res = await fetch("/api/diary-books", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = (await res.json().catch(() => null)) as ApiErrorResponse & {
        book?: { id?: string };
      } | null;

      if (!res.ok) {
        const message = data?.error || `일기장 생성에 실패했어요. (${res.status})`;
        const details = formatDetails(data?.details);
        throw Object.assign(new Error(message), { details });
      }

      if (!data?.book?.id) {
        throw new Error("일기장 생성 응답이 올바르지 않아요.");
      }

      router.push(`/write?bookId=${data.book.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "일기장 생성에 실패했어요.");
      setErrorDetails(
        err && typeof err === "object" && "details" in err
          ? String((err as { details?: string }).details || "")
          : "",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-4">
      <div className="mb-5 flex items-center justify-between">
        <Link href="/books" className="text-sm opacity-40 hover:opacity-70">
          ← 책장
        </Link>
        <h1 className="font-serif text-xl">새 일기장</h1>
        <span className="w-10" />
      </div>

      {error && (
        <div className="mb-4 rounded-2xl border border-[var(--warm-red)] bg-[rgba(186,74,59,0.08)] p-3 text-sm text-[var(--warm-red)]">
          <p>{error}</p>
          {errorDetails && (
            <details className="mt-3 rounded-xl bg-white/70 p-3 text-xs text-[rgba(62,50,42,0.72)]">
              <summary className="cursor-pointer font-medium">개발자 오류 정보 보기</summary>
              <pre className="mt-2 max-h-44 overflow-auto whitespace-pre-wrap break-words">
                {errorDetails}
              </pre>
            </details>
          )}
        </div>
      )}

      <BookCreateForm loading={loading} onSubmit={handleSubmit} />
    </div>
  );
}
