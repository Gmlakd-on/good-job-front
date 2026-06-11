/**
 * 사용자 입력 텍스트 정제
 */

/** HTML 특수문자 이스케이프 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/** 일기 내용 정제 — 저장 전 적용 */
export function sanitizeDiaryContent(content: string): string {
  return content
    .trim()
    .replace(/\r\n/g, "\n") // Windows 줄바꿈 통일
    .replace(/\r/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n") // 과도한 빈 줄 제거 (최대 3줄)
    .replace(/\s+$/gm, ""); // 각 줄 끝 공백 제거
}

/** 닉네임 정제 — 위험 문자 제거 */
export function sanitizeNickname(nickname: string): string {
  return nickname
    .trim()
    .replace(/[<>'"&]/g, "")
    .slice(0, 20);
}

/** 텍스트 미리보기 생성 */
export function truncate(text: string, maxLength: number = 60): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "…";
}
