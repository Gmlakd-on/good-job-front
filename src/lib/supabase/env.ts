/**
 * Supabase 환경변수 읽기 유틸.
 * 연결 위치: browser/server/admin Supabase client가 모두 같은 기준으로 키를 읽는다.
 */
export function getSupabaseUrl() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("NEXT_PUBLIC_SUPABASE_URL is missing");
  return url;
}

/**
 * 브라우저/SSR용 공개 키.
 * Supabase 최신 권장: sb_publishable_...
 * 기존 프로젝트 호환: legacy anon JWT도 fallback으로 허용한다.
 */
export function getSupabasePublicKey() {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!key) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is missing"
    );
  }

  return key;
}

/**
 * 서버 전용 관리자 키.
 * Supabase 최신 권장: sb_secret_...
 * 기존 프로젝트 호환: legacy service_role JWT도 fallback으로 허용한다.
 * 이 값은 RLS를 우회하므로 절대 NEXT_PUBLIC_로 만들면 안 된다.
 */
export function getSupabaseSecretKey() {
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!key) {
    throw new Error("SUPABASE_SECRET_KEY or SUPABASE_SERVICE_ROLE_KEY is missing");
  }

  return key;
}
