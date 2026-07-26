"use client";

/**
 * 작성 중 임시저장 관리.
 *
 * 민감한 일기 원문을 장기간 유지하는 localStorage 대신 현재 탭 수명에만
 * 유지되는 sessionStorage를 사용한다. 서버 autosave가 가능한 제출 이후
 * 편집 흐름은 서버 저장을 우선하며, 이 저장소는 새 일기 작성 중 탭 새로고침
 * 복구만 담당한다.
 */

const PREFIX = "diary_draft:";
const SAVE_INTERVAL = 3000;
const DRAFT_TTL_MS = 2 * 60 * 60 * 1000;

export interface DraftData {
  content: string;
  emotions: string[];
  weather?: string | null;
  persona: string;
  editorState?: unknown;
  updatedAt: number;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function hasSavedEditorState(editorState: unknown): boolean {
  if (!editorState || typeof editorState !== "object") return false;
  const strokes = (editorState as { strokes?: unknown }).strokes;
  return Array.isArray(strokes) && strokes.length > 0;
}

function hasDraftContent(data: Omit<DraftData, "updatedAt">): boolean {
  return (
    data.content.trim().length > 0 ||
    data.emotions.length > 0 ||
    Boolean(data.weather) ||
    hasSavedEditorState(data.editorState)
  );
}

function removeDraft(storage: Storage, key: string): void {
  try {
    storage.removeItem(key);
  } catch {
    // Storage may be blocked by the browser.
  }
}

export function loadDraft(bookId: string): DraftData | null {
  const storage = getStorage();
  if (!storage) return null;

  const key = PREFIX + bookId;

  try {
    const raw = storage.getItem(key);
    if (!raw) return null;

    const data = JSON.parse(raw) as DraftData;
    if (
      typeof data.updatedAt !== "number" ||
      Date.now() - data.updatedAt > DRAFT_TTL_MS
    ) {
      removeDraft(storage, key);
      return null;
    }

    return data;
  } catch {
    removeDraft(storage, key);
    return null;
  }
}

export function saveDraft(
  bookId: string,
  data: Omit<DraftData, "updatedAt">,
): void {
  const storage = getStorage();
  if (!storage) return;

  try {
    storage.setItem(
      PREFIX + bookId,
      JSON.stringify({ ...data, updatedAt: Date.now() }),
    );
  } catch {
    // Quota exceeded or storage blocked. Server autosave remains available.
  }
}

export function clearDraft(bookId: string): void {
  const storage = getStorage();
  if (!storage) return;
  removeDraft(storage, PREFIX + bookId);
}

export function startDraftTimer(
  bookId: string,
  getData: () => Omit<DraftData, "updatedAt">,
  onSave?: (savedAt: number) => void,
): () => void {
  const timer = window.setInterval(() => {
    const data = getData();
    if (!hasDraftContent(data)) return;

    saveDraft(bookId, data);
    onSave?.(Date.now());
  }, SAVE_INTERVAL);

  return () => window.clearInterval(timer);
}

export function clearExpiredDrafts(): void {
  const storage = getStorage();
  if (!storage) return;

  const now = Date.now();
  const keysToRemove: string[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(PREFIX)) continue;

      try {
        const raw = storage.getItem(key);
        const parsed = raw
          ? (JSON.parse(raw) as { updatedAt?: unknown })
          : null;

        if (
          typeof parsed?.updatedAt !== "number" ||
          now - parsed.updatedAt > DRAFT_TTL_MS
        ) {
          keysToRemove.push(key);
        }
      } catch {
        keysToRemove.push(key);
      }
    }
  } catch {
    return;
  }

  keysToRemove.forEach((key) => removeDraft(storage, key));
}

export function clearAllDrafts(): void {
  const storage = getStorage();
  if (!storage) return;

  const keysToRemove: string[] = [];

  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (key?.startsWith(PREFIX)) keysToRemove.push(key);
    }
  } catch {
    return;
  }

  keysToRemove.forEach((key) => removeDraft(storage, key));
}
