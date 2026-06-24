export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";
import type { DirectOAuthProvider } from "@/lib/auth/redirect";

const STATE_COOKIE = "gj_direct_oauth_state";
const NONCE_COOKIE = "gj_direct_oauth_nonce";
const NEXT_COOKIE = "gj_direct_oauth_next";
const PROVIDER_COOKIE = "gj_direct_oauth_provider";

const DELETE_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
  maxAge: 0,
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

function getSafeNextPath(value?: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function getDirectOAuthProvider(value?: string | null): DirectOAuthProvider | null {
  if (value === "google" || value === "kakao") return value;
  return null;
}

function getClientCredentials(provider: DirectOAuthProvider) {
  if (provider === "google") {
    return {
      clientId: process.env.GOOGLE_OAUTH_CLIENT_ID,
      clientSecret: process.env.GOOGLE_OAUTH_CLIENT_SECRET,
      missingEnvName: "GOOGLE_OAUTH_CLIENT_ID / GOOGLE_OAUTH_CLIENT_SECRET",
    };
  }

  return {
    clientId: process.env.KAKAO_REST_API_KEY || process.env.KAKAO_OAUTH_CLIENT_ID,
    clientSecret: process.env.KAKAO_CLIENT_SECRET || process.env.KAKAO_OAUTH_CLIENT_SECRET,
    missingEnvName: "KAKAO_REST_API_KEY / KAKAO_CLIENT_SECRET",
  };
}

function noStore(response: NextResponse) {
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

function clearOAuthCookies(response: NextResponse) {
  response.cookies.set(STATE_COOKIE, "", DELETE_COOKIE_OPTIONS);
  response.cookies.set(NONCE_COOKIE, "", DELETE_COOKIE_OPTIONS);
  response.cookies.set(NEXT_COOKIE, "", DELETE_COOKIE_OPTIONS);
  response.cookies.set(PROVIDER_COOKIE, "", DELETE_COOKIE_OPTIONS);
}

function redirectToAuthError(request: NextRequest, message: string) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", "auth_failed");
  url.searchParams.set("message", message);

  const response = noStore(NextResponse.redirect(url));
  clearOAuthCookies(response);
  return response;
}

async function exchangeCodeForProviderTokens({
  provider,
  code,
  redirectUri,
  clientId,
  clientSecret,
}: {
  provider: DirectOAuthProvider;
  code: string;
  redirectUri: string;
  clientId: string;
  clientSecret?: string;
}) {
  const endpoint =
    provider === "google"
      ? "https://oauth2.googleapis.com/token"
      : "https://kauth.kakao.com/oauth/token";

  const body = new URLSearchParams({
    client_id: clientId,
    code,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
  });

  if (clientSecret) {
    body.set("client_secret", clientSecret);
  }

  const tokenResponse = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
    },
    body,
    cache: "no-store",
  });

  const tokens = (await tokenResponse.json()) as {
    id_token?: string;
    access_token?: string;
    error?: string;
    error_description?: string;
  };

  return { tokenResponse, tokens };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const providerError =
    searchParams.get("error_description") || searchParams.get("error");

  if (providerError) {
    return redirectToAuthError(request, providerError);
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const provider = getDirectOAuthProvider(request.cookies.get(PROVIDER_COOKIE)?.value);

  if (!provider) {
    return redirectToAuthError(
      request,
      "OAuth provider 정보가 만료되었어요. 다시 로그인해주세요."
    );
  }

  if (!code) {
    return redirectToAuthError(
      request,
      `${PROVIDER_LABEL[provider]} 인증 코드가 돌아오지 않았어요. Redirect URI 설정을 확인해주세요.`
    );
  }

  const expectedState = request.cookies.get(STATE_COOKIE)?.value;
  const nonce = request.cookies.get(NONCE_COOKIE)?.value;
  const next = getSafeNextPath(request.cookies.get(NEXT_COOKIE)?.value);

  if (!state || !expectedState || state !== expectedState) {
    return redirectToAuthError(request, "OAuth state 검증에 실패했어요.");
  }

  if (!nonce) {
    return redirectToAuthError(
      request,
      "OAuth nonce가 만료되었어요. 다시 로그인해주세요."
    );
  }

  const { clientId, clientSecret, missingEnvName } = getClientCredentials(provider);

  if (!clientId || (provider === "google" && !clientSecret)) {
    return redirectToAuthError(
      request,
      `${PROVIDER_LABEL[provider]} OAuth 환경변수 ${missingEnvName}가 누락되었어요.`
    );
  }

  const baseUrl = getBaseUrl(request);
  const redirectUri = `${baseUrl}/oauth/callback`;
  const { tokenResponse, tokens } = await exchangeCodeForProviderTokens({
    provider,
    code,
    redirectUri,
    clientId,
    clientSecret,
  });

  if (!tokenResponse.ok || !tokens.id_token) {
    const fallbackMessage =
      provider === "kakao"
        ? "Kakao token 교환에 실패했어요. Kakao OpenID Connect가 ON인지 확인해주세요."
        : "Google token 교환에 실패했어요.";

    return redirectToAuthError(
      request,
      tokens.error_description || tokens.error || fallbackMessage
    );
  }

  const response = noStore(NextResponse.redirect(new URL(next, request.url)));

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.signInWithIdToken({
    provider,
    token: tokens.id_token,
    access_token: tokens.access_token,
    nonce,
  });

  clearOAuthCookies(response);

  if (error) {
    return redirectToAuthError(request, error.message);
  }

  return response;
}
