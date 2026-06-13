// edge → nodejs: @supabase/ssr의 쿠키 세팅이 Edge Runtime에서 불안정
// 특히 OAuth redirect 후 세션 쿠키가 클라이언트에 정상 반영되지 않는 문제를 피하기 위해 nodejs 사용
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

function getSafeNextPath(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const next = getSafeNextPath(searchParams.get("next"));
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") || searchParams.get("error");

  // OAuth 공급자가 에러를 보낸 경우
  if (providerError) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "auth_failed");
    url.searchParams.set("message", providerError);
    return NextResponse.redirect(url);
  }

  if (!code) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "auth_failed");
    url.searchParams.set(
      "message",
      "인증 코드가 돌아오지 않았어요. Redirect URL 설정을 확인해주세요."
    );
    return NextResponse.redirect(url);
  }

  // 응답 객체를 먼저 만들고, Supabase가 이 응답에 세션 쿠키를 직접 설정하게 한다.
  const response = NextResponse.redirect(new URL(next, request.url));

  const supabase = createServerClient(
    getSupabaseUrl(),
    getSupabasePublicKey(),
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    const url = new URL("/auth", request.url);
    url.searchParams.set("error", "auth_failed");
    url.searchParams.set("message", error.message);
    return NextResponse.redirect(url);
  }

  return response;
}