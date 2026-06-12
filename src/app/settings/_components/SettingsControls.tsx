"use client";

/**
 * 설정 화면 공용 컨트롤 모음.
 * SettingsPage에서 분리해 페이지 컴포넌트의 책임(SRP)을 화면 흐름으로 한정한다.
 */
export function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      aria-label={value ? "켜짐" : "꺼짐"}
      onClick={() => onChange(!value)}
      className={`settings-toggle ${value ? "settings-toggle--on" : "settings-toggle--off"}`}
    >
      <span className="settings-toggle__state" aria-hidden="true">{value ? "ON" : "OFF"}</span>
      <span className="settings-toggle__knob" aria-hidden="true" />
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
