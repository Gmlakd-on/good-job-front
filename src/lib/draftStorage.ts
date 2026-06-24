"use client";

/**
 * 작성 중 임시저장 관리.
 * 일기 작성 시 localStorage에 주기적으로 백업하고, 페이지 재진입 시 복구한다.
 * 서버 autosave(diaryId 기반)와는 별개로 동작한다.
 *
 * 저장 구조:
 *   diary_draft:{bookId} → { content, emotions, weather, persona, editorState, updatedAt }
 */

const PREFIX = "diary_draft:";
const SAVE_INTERVAL = 3000; // 3초마다 저장
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;

function hasSavedEditorState(editorState: unknown): boolean {
  if (!editorState || typeof editorState !== "object") return false;
  const strokes = (editorState as { strokes?: unknown }).strokes;
  return Array.isArray(strokes) && strokes.length > 0;
}

function hasDraftContent(data: Omit<DraftData, "updatedAt">): boolean {
  return (
    data.content.trim().length > 0 ||
    (Array.isArray(data.emotions) && data.emotions.length > 0) ||
    Boolean(data.weather) ||
    hasSavedEditorState(data.editorState)
  );
}

export interface DraftData {
  content: string;
  emotions: string[];
  weather?: string | null;
  persona: string;
  editorState?: unknown;
  updatedAt: number;
}

/** 임시저장 데이터 조회 */
export function loadDraft(bookId: string): DraftData | null {
  try {
    const raw = localStorage.getItem(PREFIX + bookId);
    if (!raw) return null;
    const data = JSON.parse(raw) as DraftData;
    // 24시간 이상 지난 초안은 무시
    if (Date.now() - data.updatedAt > DRAFT_TTL_MS) {
      localStorage.removeItem(PREFIX + bookId);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/** 임시저장 */
export function saveDraft(bookId: string, data: Omit<DraftData, "updatedAt">) {
  try {
    localStorage.setItem(
      PREFIX + bookId,
      JSON.stringify({ ...data, updatedAt: Date.now() })
    );
  } catch {
    // localStorage full or unavailable — silent fail
  }
}

/** 임시저장 삭제 (제출 완료 후) */
export function clearDraft(bookId: string) {
  try {
    localStorage.removeItem(PREFIX + bookId);
  } catch {
    // silent
  }
}

/** 주기적 자동저장 타이머 */
export function startDraftTimer(
  bookId: string,
  getData: () => Omit<DraftData, "updatedAt">,
  onSave?: (savedAt: number) => void // 저장 완료 시점을 UI(상태바)에 알린다
): () => void {
  const timer = setInterval(() => {
    const data = getData();
    if (hasDraftContent(data)) {
      saveDraft(bookId, data);
      onSave?.(Date.now());
    }
  }, SAVE_INTERVAL);

  return () => clearInterval(timer);
}

/** 만료된 임시저장만 정리 */
export function clearExpiredDrafts() {
  try {
    const keysToRemove: string[] = [];
    const now = Date.now();

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key?.startsWith(PREFIX)) continue;

      try {
        const raw = localStorage.getItem(key);
        const data = raw ? (JSON.parse(raw) as { updatedAt?: unknown }) : null;
        if (typeof data?.updatedAt !== "number" || now - data.updatedAt > DRAFT_TTL_MS) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }

    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // silent
  }
}

/** 모든 임시저장 삭제 (로그아웃 시 호출) */
export function clearAllDrafts() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((key) => localStorage.removeItem(key));
  } catch {
    // silent
  }
}
