"use client";

export default function SafetyNotice({ variant = "onboarding" }: { variant?: "onboarding" | "crisis" | "high" }) {
  if (variant === "crisis") {
    return (
      <div
        className="relative overflow-hidden p-5"
        style={{
          borderRadius: "var(--radius-lg)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-card)",
          borderLeft: "4px solid var(--chami-heart)",
        }}
      >
        <p className="font-serif text-lg leading-relaxed" style={{ color: "var(--text-primary)" }}>
          지금 적어준 마음이 아주 무겁게 느껴져요.
        </p>
        <p className="mt-2 leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>
          이 감정을 혼자서만 견디지 않았으면 해요.
          <br />
          당장 위험하다고 느껴진다면 가까운 사람이나 지역 긴급 도움 기관에 바로 연락해 주세요.
        </p>
        <p className="mt-3 text-sm" style={{ color: "var(--text-muted)" }}>
          당신의 지금 마음은 도움을 받아도 되는 마음이에요.
        </p>
      </div>
    );
  }

  if (variant === "high") {
    return (
      <div
        className="p-4"
        style={{
          borderRadius: "var(--radius-md)",
          background: "var(--bg-card)",
          border: "1px solid var(--border-subtle)",
          boxShadow: "var(--shadow-sm)",
          borderLeft: "4px solid var(--chami-gold)",
        }}
      >
        <p className="leading-relaxed text-sm" style={{ color: "var(--text-secondary)" }}>
          적어준 마음이 많이 무거웠을 거예요.
          <br />
          혼자 오래 붙들고 있기 어렵다면, 믿을 수 있는 사람이나 전문 상담 창구에 마음을 나눠주세요.
        </p>
      </div>
    );
  }

  // 온보딩
  return (
    <div
      className="glass-card p-5 text-center"
      style={{
        borderRadius: "var(--radius-lg)",
      }}
    >
      <p className="font-serif text-lg mb-3" style={{ color: "var(--text-primary)" }}>
        참 잘했어요
      </p>
      <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
        이 서비스는 전문 상담이나 의료 진단을 대신하지 않습니다.
        <br />
        오늘의 마음을 적고, 누군가 읽었다는 짧은 답글을 받는 감정 일기장입니다.
      </p>
      <p className="text-xs mt-3 leading-relaxed" style={{ color: "var(--text-muted)" }}>
        위급하거나 스스로를 해칠 위험이 있다면
        <br />
        가까운 사람이나 지역 긴급 도움 기관에 즉시 도움을 요청해주세요.
      </p>
    </div>
  );
}
