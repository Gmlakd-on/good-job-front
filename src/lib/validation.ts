export const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const MAX_DIARY_CONTENT_LENGTH = 3000;
export const MAX_EDITOR_STATE_BYTES = 100_000;
export const MAX_REPORT_REASON_LENGTH = 80;
export const MAX_REPORT_DETAIL_LENGTH = 1000;
export const MAX_REMINDER_MESSAGE_LENGTH = 240;
export const MAX_BOOK_TITLE_LENGTH = 40;
export const MAX_NICKNAME_LENGTH = 20;

export function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

export function byteLength(value: string): number {
  return new TextEncoder().encode(value).length;
}

export function isSafeJsonSize(value: unknown, maxBytes = MAX_EDITOR_STATE_BYTES): boolean {
  try {
    return byteLength(JSON.stringify(value)) <= maxBytes;
  } catch {
    return false;
  }
}

export function parseOptionalTrimmedString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

export function isFutureDateWithin(value: string, maxDays: number): boolean {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return false;

  const now = Date.now();
  const max = now + maxDays * 24 * 60 * 60 * 1000;
  return date.getTime() > now && date.getTime() <= max;
}
