import type { CoverStyleId } from "@/components/book-ui/bookTypes";

const DRAFT_KEY = "cjh_draft_book";

export interface DraftBook {
  coverStyleId: CoverStyleId;
  diaryName: string;
  firstLine: string;
  createdAt: string;
}

// ── In-memory fallback ──────────────────────────────
// iPad Safari 개인정보 보호 모드에서 localStorage가 quota 에러를 던질 수 있다.
// 그 경우에도 세션 내에서는 기록장을 만들 수 있도록 메모리 폴백을 둔다.
let memoryDraft: DraftBook | null = null;

function isLocalStorageAvailable(): boolean {
  try {
    const k = "__cjh_test__";
    localStorage.setItem(k, "1");
    localStorage.removeItem(k);
    return true;
  } catch {
    return false;
  }
}

export function saveDraftBook(draft: DraftBook): void {
  memoryDraft = draft;
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  } catch {
    // quota exceeded 등 — 메모리 폴백으로 동작
  }
}

export function getDraftBook(): DraftBook | null {
  if (memoryDraft) return memoryDraft;
  if (!isLocalStorageAvailable()) return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DraftBook;
  } catch {
    return null;
  }
}

export function clearDraftBook(): void {
  memoryDraft = null;
  if (!isLocalStorageAvailable()) return;
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {
    // noop
  }
}

/** Submit draft via atomic from-draft API */
export async function submitDraftBook(
  draft: DraftBook,
): Promise<{ bookId: string; diaryId: string | null }> {
  const res = await fetch("/api/diary-books/from-draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      title: draft.diaryName,
      cover_style_id: draft.coverStyleId,
      cover_variant: draft.coverStyleId === "archive" ? "ochre" : null,
      first_line: draft.firstLine || null,
    }),
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    throw new Error(data?.error || "기록장 생성에 실패했어요.");
  }

  if (!data?.book?.id) {
    throw new Error("기록장 생성 응답이 올바르지 않아요.");
  }

  clearDraftBook();
  return {
    bookId: data.book.id as string,
    diaryId: data.diary_id ?? null,
  };
}
