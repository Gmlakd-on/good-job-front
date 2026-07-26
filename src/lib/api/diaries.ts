export interface DiaryListRow {
  id: string;
  content: string;
  status: string;
  created_at: string;
  diary_emotions: { emotion_code: string }[];
  replies: { id: string; persona?: string; content?: string }[];
}

interface DiaryPageResponse {
  diaries?: DiaryListRow[];
  pageInfo?: {
    nextCursor?: string | null;
    hasNextPage?: boolean;
  };
  error?: string;
}

export interface DiaryPage {
  diaries: DiaryListRow[];
  nextCursor: string | null;
  hasNextPage: boolean;
}

export async function fetchDiaryPage(input: {
  cursor?: string | null;
  limit?: number;
  bookId?: string;
  signal?: AbortSignal;
} = {}): Promise<DiaryPage> {
  const params = new URLSearchParams();
  params.set("limit", String(input.limit ?? 30));
  if (input.cursor) params.set("cursor", input.cursor);
  if (input.bookId) params.set("book_id", input.bookId);

  const response = await fetch(`/api/diaries?${params.toString()}`, {
    cache: "no-store",
    signal: input.signal,
  });
  const data = (await response.json().catch(() => ({}))) as DiaryPageResponse;

  if (!response.ok) {
    throw new Error(data.error || "일기 목록 조회에 실패했어요.");
  }

  return {
    diaries: data.diaries ?? [],
    nextCursor: data.pageInfo?.nextCursor ?? null,
    hasNextPage: data.pageInfo?.hasNextPage === true,
  };
}
