"use client";

/**
 * IdleLogout — 비활성/이탈 자동 로그아웃 (상업 서비스 보안 요구사항)
 *
 * 정책
 *  - 마지막 사용자 활동 후 IDLE_LIMIT_MS(기본 10분) 경과 시 자동 로그아웃.
 *  - 탭/앱을 떠났다가 IDLE_LIMIT_MS 이후 복귀해도 즉시 로그아웃 (visibilitychange/focus 검사).
 *  - 마지막 활동 시각을 localStorage 로 공유 → 여러 탭이 함께 만료·갱신됨(교차 탭 동기화).
 *  - 로그아웃 60초 전 1회 안내 토스트.
 *
 * 주의(근본 방어): 클라이언트 타이머는 '표준적'이지만 그 자체로 서버 토큰을 무효화하진 않습니다.
 * 완전한 서버측 강제를 위해 Supabase 프로젝트의 세션 정책(Access Token 만료 단축 +
 * Inactivity timeout / Time-box)을 함께 설정해야 합니다. README 보안 노트 참고.
 */

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { invalidateApiCache } from "@/lib/apiCache";
import { useToast } from "@/components/Toast";

/** 비활성 허용 시간 (10분) */
export const IDLE_LIMIT_MS = 10 * 60 * 1000;
/** 로그아웃 몇 ms 전에 경고할지 (60초) */
const WARN_BEFORE_MS = 60 * 1000;
/** 만료 검사 주기 (15초) */
const CHECK_INTERVAL_MS = 15 * 1000;
/** 활동 시각 저장 최소 간격 (5초) — 과도한 localStorage 쓰기 방지 */
const ACTIVITY_WRITE_THROTTLE_MS = 5 * 1000;
/** 교차 탭 공유 키 */
const LAST_ACTIVITY_KEY = "gj:lastActivity";

export default function IdleLogout() {
  const router = useRouter();
  const { showToast } = useToast();

  const hasUserRef = useRef(false);
  const warnedRef = useRef(false);
  const lastWriteRef = useRef(0);
  const loggingOutRef = useRef(false);

  useEffect(() => {
    const supabase = createClient();

    const now = () => Date.now();

    const readLastActivity = (): number => {
      try {
        const raw = localStorage.getItem(LAST_ACTIVITY_KEY);
        const parsed = raw ? Number(raw) : NaN;
        return Number.isFinite(parsed) ? parsed : now();
      } catch {
        return now();
      }
    };

    const writeLastActivity = (ts: number) => {
      try {
        localStorage.setItem(LAST_ACTIVITY_KEY, String(ts));
      } catch {
        /* 저장 실패해도 타이머는 동작 */
      }
    };

    const resetActivity = () => {
      warnedRef.current = false;
      const ts = now();
      // 쓰기 스로틀: 5초에 한 번만 localStorage 갱신
      if (ts - lastWriteRef.current >= ACTIVITY_WRITE_THROTTLE_MS) {
        lastWriteRef.current = ts;
        writeLastActivity(ts);
      }
    };

    const performLogout = async () => {
      if (loggingOutRef.current) return;
      loggingOutRef.current = true;
      try {
        await supabase.auth.signOut();
      } catch {
        /* 네트워크 실패 시에도 로컬 세션은 정리됨 */
      }
      try {
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      } catch {
        /* noop */
      }
      invalidateApiCache();
      hasUserRef.current = false;
      showToast("10분간 활동이 없어 자동 로그아웃되었어요.", "info");
      router.replace("/");
      router.refresh();
    };

    const check = () => {
      if (!hasUserRef.current || loggingOutRef.current) return;
      const idleFor = now() - readLastActivity();

      if (idleFor >= IDLE_LIMIT_MS) {
        void performLogout();
        return;
      }
      if (idleFor >= IDLE_LIMIT_MS - WARN_BEFORE_MS && !warnedRef.current) {
        warnedRef.current = true;
        showToast("잠시 후 자동 로그아웃돼요. 계속하려면 화면을 눌러주세요.", "info");
      }
    };

    // 초기 세션 확인
    supabase.auth.getUser().then(({ data }) => {
      hasUserRef.current = Boolean(data.user);
      if (data.user) {
        resetActivity();
        // 복귀 즉시 만료 여부 판정
        check();
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      hasUserRef.current = Boolean(session?.user);
      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
        warnedRef.current = false;
        lastWriteRef.current = 0;
        resetActivity();
      }
      if (event === "SIGNED_OUT") {
        loggingOutRef.current = false;
      }
    });

    // 사용자 활동 이벤트
    const activityEvents: (keyof WindowEventMap)[] = [
      "pointerdown",
      "keydown",
      "wheel",
      "touchstart",
      "scroll",
    ];
    activityEvents.forEach((evt) =>
      window.addEventListener(evt, resetActivity, { passive: true })
    );

    // 탭 복귀/포커스 시 즉시 만료 검사
    const onVisible = () => {
      if (document.visibilityState === "visible") check();
    };
    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", check);

    const intervalId = window.setInterval(check, CHECK_INTERVAL_MS);

    return () => {
      subscription.unsubscribe();
      activityEvents.forEach((evt) => window.removeEventListener(evt, resetActivity));
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", check);
      window.clearInterval(intervalId);
    };
  }, [router, showToast]);

  return null;
}
