export type CoverStyleId = "stone" | "archive" | "1950" | "1980" | "1990" | "2000" | "2010";
export type CoverVariant = "red" | "blue" | "ochre" | null;
export type DiaryBookStatus = "active" | "archived" | "locked";

export interface DiaryBook {
  id: string;
  title: string;
  cover_style_id: CoverStyleId;
  cover_variant: CoverVariant;
  status: DiaryBookStatus;
  entry_count: number;
  max_entries: 30 | 50 | 100 | 365;
  created_at?: string;
  updated_at?: string;
}

export const COVER_STYLES: { id: CoverStyleId; label: string; description: string }[] = [
  { id: "stone", label: "돌판", description: "처음의 기록처럼 묵직한 석판" },
  { id: "archive", label: "고서", description: "오래 보관한 기록물 같은 책" },
  { id: "1950", label: "클래식", description: "차분한 가죽 노트" },
  { id: "1980", label: "스케치", description: "가벼운 드로잉 노트" },
  { id: "1990", label: "팝", description: "밝고 통통 튀는 표지" },
  { id: "2000", label: "키치", description: "스티커와 바인더 감성" },
  { id: "2010", label: "미니멀", description: "비워둔 듯 깔끔한 표지" },
];

export const ARCHIVE_VARIANTS: { id: Exclude<CoverVariant, null>; label: string }[] = [
  { id: "red", label: "빨강" },
  { id: "blue", label: "파랑" },
  { id: "ochre", label: "황토" },
];

export function getBookStatusLabel(status: DiaryBookStatus) {
  if (status === "locked") return "잠김";
  if (status === "archived") return "보관";
  return "작성 중";
}

export function canCompleteBook(book: Pick<DiaryBook, "entry_count">) {
  return book.entry_count >= 30;
}

export function canWriteBook(book: Pick<DiaryBook, "status" | "entry_count" | "max_entries">) {
  return book.status === "active" && book.entry_count < book.max_entries;
}
