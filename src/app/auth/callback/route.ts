export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

function getSafeNextPath(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function redirectToRequestOrigin(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.url));
}

function authErrorRedirect(request: NextRequest, message?: string | null) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", "auth_failed");
  if (message) url.searchParams.set("message", message);
  return NextResponse.redirect(url);
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const next = getSafeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const providerError = searchParams.get("error_description") || searchParams.get("error");

  if (providerError) {
    return authErrorRedirect(request, providerError);
  }

  if (!code) {
    return authErrorRedirect(request, "인증 코드가 돌아오지 않았어요. Redirect URL 설정을 확인해주세요.");
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    return authErrorRedirect(request, error.message);
  }

  return redirectToRequestOrigin(request, next);
}
