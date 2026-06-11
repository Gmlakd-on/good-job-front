export const DATABASE_SETUP_ERROR_MESSAGE =
  "데이터베이스 설정이 아직 적용되지 않았어요. Supabase SQL Editor에서 diary_books migration을 먼저 실행해주세요.";

export const ADMIN_KEY_ERROR_MESSAGE =
  "서버 관리자 키가 설정되지 않았어요. Vercel 환경변수에 SUPABASE_SECRET_KEY 또는 SUPABASE_SERVICE_ROLE_KEY를 추가해주세요.";

type ErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

function toErrorLike(error: unknown): ErrorLike {
  if (!error || typeof error !== "object") return {};
  return error as ErrorLike;
}

export function isMissingDatabaseSetupError(error: unknown): boolean {
  const err = toErrorLike(error);
  const code = err.code ?? "";
  const text = `${err.message ?? ""} ${err.details ?? ""} ${err.hint ?? ""}`.toLowerCase();

  return (
    code === "42P01" || // undefined_table
    code === "42703" || // undefined_column
    code === "PGRST200" ||
    code === "PGRST204" ||
    text.includes("diary_books") ||
    text.includes("diary_book_id") ||
    text.includes("relation") && text.includes("does not exist") ||
    text.includes("column") && text.includes("does not exist")
  );
}

export function isMissingAdminKeyError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : toErrorLike(error).message ?? "";
  return (
    message.includes("SUPABASE_SECRET_KEY") ||
    message.includes("SUPABASE_SERVICE_ROLE_KEY")
  );
}
