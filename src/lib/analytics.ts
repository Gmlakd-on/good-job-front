/**
 * 이벤트 추적 헬퍼
 * 현재는 console.info만 사용, 나중에 Vercel Analytics/Mixpanel/PostHog 연동
 */

type EventName =
  | "diary_created"
  | "diary_deleted"
  | "diary_edited"
  | "reply_received"
  | "feedback_submitted"
  | "report_submitted"
  | "emotion_selected"
  | "auth_login"
  | "auth_signup"
  | "auth_logout"
  | "onboarding_completed"
  | "onboarding_skipped"
  | "safety_critical_detected"
  | "safety_high_detected"
  | "moderation_blocked"
  | "diary_exported";

interface EventProperties {
  [key: string]: string | number | boolean | undefined;
}

export function trackEvent(name: EventName, properties?: EventProperties) {
  if (process.env.NODE_ENV === "development") {
    console.info(`[track] ${name}`, properties || "");
  }

  // Vercel Web Analytics (자동 연동 시)
  if (typeof window !== "undefined") {
    const w = window as unknown as Record<string, unknown>;
    if (typeof w.va === "function") {
      (w.va as (...args: unknown[]) => void)("event", name, properties);
    }
  }
}
