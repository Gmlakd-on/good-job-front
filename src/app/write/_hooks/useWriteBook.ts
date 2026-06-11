"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface BookData {
  id: string;
  name: string;
  cover_style_id: string;
  default_persona: string;
  entry_count: number;
  max_entries: number;
}

export function useWriteBook(bookId: string | null) {
  const router = useRouter();
  const [book, setBook] = useState<BookData | null>(null);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    async function loadBook() {
      if (!bookId) {
        router.replace("/books");
        return;
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.replace("/auth");
        return;
      }

      setAuthenticated(true);

      try {
        const res = await fetch(`/api/diary-books/${bookId}`);
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) {
          router.replace("/auth");
          return;
        }
        if (!res.ok || !data.book) {
          router.replace("/books");
          return;
        }
        setBook(data.book);
      } catch {
        router.replace("/books");
      } finally {
        setLoading(false);
      }
    }
    loadBook();
  }, [bookId, router]);

  return { book, loading, authenticated };
}
