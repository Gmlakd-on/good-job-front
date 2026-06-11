export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function getRedirectOrigin(request: NextRequest, origin: string) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (process.env.NODE_ENV !== "development" && forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  return origin;
}

function authErrorRedirect(baseUrl: string, message?: string | null) {
  const url = new URL("/auth", baseUrl);
  url.searchParams.set("error", "auth_failed");
  if (message) url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const baseUrl = getRedirectOrigin(request, origin);
  const next = getSafeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const providerError = searchParams.get("error_description") || searchParams.get("error");

  if (providerError) {
    return authErrorRedirect(baseUrl, providerError);
  }

  if (!code) {
    return authErrorRedirect(baseUrl, "인증 코드가 돌아오지 않았어요. Redirect URL 설정을 확인해주세요.");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return authErrorRedirect(baseUrl, error.message);
  }

  return NextResponse.redirect(`${baseUrl}${next}`);
}
