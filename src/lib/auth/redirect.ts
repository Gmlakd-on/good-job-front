const DEFAULT_NEXT_PATH = "/";

export type DirectOAuthProvider = "google" | "kakao";

export function getAuthRedirectOrigin() {
  // OAuth redirect는 사용자가 지금 접속한 도메인으로 돌려보내는 게 가장 안전하다.
  // NEXT_PUBLIC_SITE_URL이 예전 Vercel preview/deployment URL로 남아 있으면
  // 로그인 후 DEPLOYMENT_NOT_FOUND가 발생할 수 있으므로 브라우저 origin을 우선한다.
  if (typeof window !== "undefined" && window.location.origin) {
    return window.location.origin;
  }

  return process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") || "";
}

export function getSafeNextPath(value?: string | null) {
  if (!value) return DEFAULT_NEXT_PATH;
  if (!value.startsWith("/") || value.startsWith("//")) return DEFAULT_NEXT_PATH;
  return value;
}

export function buildAuthCallbackUrl(origin: string, nextPath: string) {
  return `${origin}/auth/callback?next=${encodeURIComponent(getSafeNextPath(nextPath))}`;
}

export function buildDirectOAuthStartUrl(
  provider: DirectOAuthProvider,
  origin: string,
  nextPath: string
) {
  const url = new URL("/oauth/consent", origin || "http://localhost:3000");
  url.searchParams.set("provider", provider);
  url.searchParams.set("next", getSafeNextPath(nextPath));
  return `${url.pathname}${url.search}`.startsWith("/oauth") && origin
    ? url.toString()
    : `/oauth/consent?provider=${provider}&next=${encodeURIComponent(getSafeNextPath(nextPath))}`;
}

export function buildGoogleOAuthStartUrl(origin: string, nextPath: string) {
  return buildDirectOAuthStartUrl("google", origin, nextPath);
}

export function buildKakaoOAuthStartUrl(origin: string, nextPath: string) {
  return buildDirectOAuthStartUrl("kakao", origin, nextPath);
}
