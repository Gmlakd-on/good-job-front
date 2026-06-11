"use client";

/**
 * 설정 화면 공용 컨트롤 모음.
 * SettingsPage에서 분리해 페이지 컴포넌트의 책임(SRP)을 화면 흐름으로 한정한다.
 */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      style={{
        position: "relative",
        width: "48px",
        height: "28px",
        borderRadius: "99px",
        background: value ? "var(--stamp-vermilion)" : "var(--border-medium)",
        flexShrink: 0,
        minWidth: "48px",
        transition: "background 0.2s",
        WebkitTapHighlightColor: "transparent",
        cursor: "pointer",
      }}
    >
      <span
        style={{
          position: "absolute",
          top: "3px",
          left: value ? "21px" : "3px",
          width: "22px",
          height: "22px",
          borderRadius: "50%",
          background: "white",
          boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
          transition: "left 0.2s",
        }}
      />
    </button>
  );
}

export function CTABtn({ onClick, loading, label }: { onClick: () => void; loading?: boolean; label: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        width: "100%",
        padding: "15px",
        borderRadius: "14px",
        background: "var(--stamp-vermilion)",
        color: "white",
        fontWeight: 600,
        fontSize: "15px",
        opacity: loading ? 0.6 : 1,
        minHeight: "52px",
        WebkitTapHighlightColor: "transparent",
        cursor: "pointer",
      }}
    >
      {loading ? "저장 중…" : label}
    </button>
  );
}

export function MenuRow({ label, onClick, color, last }: { label: string; onClick: () => void; color?: string; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 0",
        borderBottom: last ? "none" : "1px solid var(--border-hairline)",
        textAlign: "left",
        fontSize: "15px",
        fontWeight: 400,
        color: color || "var(--ink-body)",
        minHeight: "52px",
        WebkitTapHighlightColor: "transparent",
        cursor: "pointer",
      }}
    >
      <span>{label}</span>
      {!last && <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ color: "var(--ink-ghost)" }}><path d="M9 18l6-6-6-6" /></svg>}
    </button>
  );
}
