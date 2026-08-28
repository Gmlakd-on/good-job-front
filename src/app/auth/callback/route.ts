// edge → nodejs: @supabase/ssr의 쿠키 세팅이 Edge Runtime에서 불안정
// 특히 OAuth redirect 후 세션 쿠키가 클라이언트에 정상 반영되지 않는 문제를 피하기 위해 nodejs 사용
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { User } from "@supabase/supabase-js";
import { getSupabasePublicKey, getSupabaseUrl } from "@/lib/supabase/env";

type AuthMode = "login" | "signup" | null;

function getSafeNextPath(value: string | null) {
  if (!value) return "/";
  if (!value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}

function getAuthMode(value: string | null): AuthMode {
  if (value === "login" || value === "signup") return value;
  return null;
}

/**
 * Supabase의 OAuth는 로그인/회원가입 API가 분리되어 있지 않아
 * 존재하지 않는 소셜 계정으로 로그인해도 신규 auth.users가 생성될 수 있다.
 *
 * 회원가입 화면에서 기존 회원을 걸러내기 위해 현재 로그인 시각과
 * 최초 생성 시각이 사실상 같은 신규 사용자인지 확인한다.
 *
 * 이 검사는 UX 분기용이며 권한 검증 용도로 사용하지 않는다.
 */
function isFreshlyCreatedOAuthUser(user: User) {
  const createdAt = Date.parse(user.created_at);
  const lastSignInAt = Date.parse(user.last_sign_in_at ?? "");

  if (!Number.isFinite(createdAt) || !Number.isFinite(lastSignInAt)) {
    return false;
  }

  return Math.abs(lastSignInAt - createdAt) <= 15_000;
}

function buildAuthErrorUrl(
  request: NextRequest,
  message: string,
  mode: AuthMode,
) {
  const url = new URL("/auth", request.url);
  url.searchParams.set("error", "auth_failed");
  url.searchParams.set("message", message);

  if (mode) {
    url.searchParams.set("mode", mode);
  }

  return url;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const next = getSafeNextPath(searchParams.get("next"));
  const mode = getAuthMode(searchParams.get("mode"));
  const code = searchParams.get("code");
  const providerError =
    searchParams.get("error_description") || searchParams.get("error");

  if (providerError) {
    return NextResponse.redirect(
      buildAuthErrorUrl(request, providerError, mode),
    );
  }

  if (!code) {
    return NextResponse.redirect(
      buildAuthErrorUrl(
        request,
        "인증 코드가 돌아오지 않았어요. Redirect URL 설정을 확인해주세요.",
        mode,
      ),
    );
  }

  // response를 let으로 두는 이유:
  // 회원가입 화면에서 기존 회원이 들어온 경우 세션 쿠키를 발급하지 않고
  // /auth 오류 화면으로 돌려보내기 위해 응답 대상을 바꿀 수 있어야 한다.
  let response = NextResponse.redirect(new URL(next, request.url));

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
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error || !data.user) {
    return NextResponse.redirect(
      buildAuthErrorUrl(
        request,
        error?.message || "로그인 세션을 만들지 못했어요.",
        mode,
      ),
    );
  }

  // 회원가입 버튼을 눌렀는데 이미 오래전에 생성된 회원 계정이면
  // 로그인으로 통과시키지 않고 세션을 제거한 뒤 회원가입 화면에 남긴다.
  if (mode === "signup" && !isFreshlyCreatedOAuthUser(data.user)) {
    response = NextResponse.redirect(
      buildAuthErrorUrl(
        request,
        "이미 가입된 계정입니다. 회원가입이 아니라 로그인으로 이용해주세요.",
        "signup",
      ),
    );

    // 새로 발급된 Supabase 세션 및 혹시 남아 있던 현재 브라우저 세션을 제거한다.
    await supabase.auth.signOut({ scope: "local" });

    return response;
  }

  return response;
}
