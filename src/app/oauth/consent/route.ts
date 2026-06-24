export const runtime = "nodejs";

import { createHash, randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import type { DirectOAuthProvider } from "@/lib/auth/redirect";

const STATE_COOKIE = "gj_direct_oauth_state";
const NONCE_COOKIE = "gj_direct_oauth_nonce";
const NEXT_COOKIE = "gj_direct_oauth_next";
const PROVIDER_COOKIE = "gj_direct_oauth_provider";

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 10,
};

const PROVIDER_LABEL: Record<DirectOAuthProvider, string> = {
  google: "Google",
  kakao: "Kakao",
};

function getBaseUrl(request: NextRequest) {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.trim().replace(/\/$/, "") ||
    request.nextUrl.origin
  );
}

function getSafeNextPath(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function getDirectOAuthProvider(value: string | null): DirectOAuthProvider {
  return value === "kakao" ? "kakao" : "google";
}

function getClientId(provider: DirectOAuthProvider) {
  if (provider === "google") return process.env.GOOGLE_OAUTH_CLIENT_ID;
  return process.env.KAKAO_REST_API_KEY || process.env.KAKAO_OAUTH_CLIENT_ID;
}

function randomToken() {
  return randomBytes(32).toString("base64url");
}

function sha256Hex(value: string) {
  return createHash("sha256").update(value).digest("hex");
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function redirectToAuthError(request: NextRequest, message: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", "auth_failed");
  url.searchParams.set("message", message);
  return noStore(NextResponse.redirect(url));
}

function buildAuthorizationUrl({
  provider,
  clientId,
  redirectUri,
  state,
  hashedNonce,
}: {
  provider: DirectOAuthProvider;
  clientId: string;
  redirectUri: string;
  state: string;
  hashedNonce: string;
}) {
  if (provider === "google") {
    const googleUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    googleUrl.searchParams.set("client_id", clientId);
    googleUrl.searchParams.set("redirect_uri", redirectUri);
    googleUrl.searchParams.set("response_type", "code");
    googleUrl.searchParams.set("scope", "openid email profile");
    googleUrl.searchParams.set("state", state);
    googleUrl.searchParams.set("nonce", hashedNonce);
    googleUrl.searchParams.set("prompt", "select_account");
    return googleUrl;
  }

  const kakaoUrl = new URL("https://kauth.kakao.com/oauth/authorize");
  kakaoUrl.searchParams.set("client_id", clientId);
  kakaoUrl.searchParams.set("redirect_uri", redirectUri);
  kakaoUrl.searchParams.set("response_type", "code");
  kakaoUrl.searchParams.set("scope", "openid,profile_nickname,profile_image,account_email");
  kakaoUrl.searchParams.set("state", state);
  kakaoUrl.searchParams.set("nonce", hashedNonce);
  kakaoUrl.searchParams.set("prompt", "select_account");
  return kakaoUrl;
}

export async function GET(request: NextRequest) {
  const provider = getDirectOAuthProvider(request.nextUrl.searchParams.get("provider"));
  const clientId = getClientId(provider);

  if (!clientId) {
    const envName = provider === "google" ? "GOOGLE_OAUTH_CLIENT_ID" : "KAKAO_REST_API_KEY";
    return redirectToAuthError(
      request,
      `${PROVIDER_LABEL[provider]} OAuth 환경변수 ${envName}가 누락되었어요.`
    );
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/oauth/callback`;
  const next = getSafeNextPath(request.nextUrl.searchParams.get("next"));
  const state = randomToken();
  const nonce = randomToken();
  const hashedNonce = sha256Hex(nonce);

  const authorizationUrl = buildAuthorizationUrl({
    provider,
    clientId,
    redirectUri,
    state,
    hashedNonce,
  });

  const response = noStore(NextResponse.redirect(authorizationUrl));
  response.cookies.set(STATE_COOKIE, state, OAUTH_COOKIE_OPTIONS);
  response.cookies.set(NONCE_COOKIE, nonce, OAUTH_COOKIE_OPTIONS);
  response.cookies.set(NEXT_COOKIE, next, OAUTH_COOKIE_OPTIONS);
  response.cookies.set(PROVIDER_COOKIE, provider, OAUTH_COOKIE_OPTIONS);

  return response;
}
