/**
 * 마지막으로 쓰던 일기장 기억.
 * - WritePage가 일기장을 열 때 저장하고,
 * - 하단바 "쓰기" 버튼과 /books?action=write 진입에서 우선 사용한다.
 * - 목적: 홈 → 책장 → 일기장 선택 → 쓰기 3depth를 "누르면 바로 쓴다" 1depth로 단축.
 */
const KEY = "gj.lastBookId";

export function saveLastBookId(bookId: string) {
  try {
    window.localStorage.setItem(KEY, bookId);
  } catch {
    /* 사파리 프라이빗 모드 등 — 무시 */
  }
}

export function getLastBookId(): string | null {
  try {
    return window.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function clearLastBookId() {
  try {
    window.localStorage.removeItem(KEY);
  } catch {
    /* 무시 */
  }
}
