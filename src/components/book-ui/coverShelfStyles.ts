import type { CSSProperties } from "react";

export const shelfStyle: CSSProperties = {
  position: "relative",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflow: "visible",
};

export const railStyle: CSSProperties = {
  display: "flex",
  gap: "clamp(18px, 2.2vw, 28px)",
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  overflowX: "auto",
  overflowY: "hidden",
  padding: "14px 54px 26px",
  boxSizing: "border-box",
  scrollBehavior: "smooth",
  scrollSnapType: "none",
  overscrollBehaviorX: "contain",
  WebkitOverflowScrolling: "touch",
  touchAction: "pan-y",
  cursor: "grab",
};

export const boardStyle: CSSProperties = {
  height: 12,
  margin: "-8px 10px 0",
  borderRadius: 999,
  background: "linear-gradient(180deg, #b08a64, #8c6a48 70%, #715438)",
  boxShadow:
    "0 6px 14px rgba(62, 46, 30, 0.28), inset 0 1px 0 rgba(255, 255, 255, 0.25)",
};

export const imageBoxStyle: CSSProperties = {
  display: "flex",
  width: "100%",
  height: "clamp(156px, 14vw, 204px)",
  alignItems: "flex-end",
  justifyContent: "center",
  pointerEvents: "none",
};

export const imageStyle: CSSProperties = {
  width: "auto",
  height: "100%",
  maxWidth: "100%",
  objectFit: "contain",
  objectPosition: "center bottom",
  filter: "drop-shadow(0 10px 16px rgba(42, 36, 32, 0.18))",
};

export const labelStyle: CSSProperties = {
  fontFamily: '"Noto Serif KR", Georgia, serif',
  fontSize: "clamp(18px, 1.5vw, 24px)",
  fontWeight: 700,
  lineHeight: 1.35,
  pointerEvents: "none",
};

export const descStyle: CSSProperties = {
  minHeight: "1.6em",
  color: "var(--text-muted, #8f8378)",
  fontSize: "clamp(13px, 1vw, 16px)",
  lineHeight: 1.5,
  textAlign: "center",
  pointerEvents: "none",
};

export const arrowBaseStyle: CSSProperties = {
  position: "absolute",
  top: "42%",
  zIndex: 5,
  width: 40,
  height: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 999,
  border: "1px solid rgba(122, 86, 56, 0.18)",
  background: "rgba(255, 252, 246, 0.96)",
  color: "var(--text-secondary, #6b5a4c)",
  boxShadow: "0 4px 12px rgba(42, 36, 32, 0.14)",
  cursor: "pointer",
};

export function getCardStyle(isSelected: boolean): CSSProperties {
  return {
    flex: "0 0 clamp(200px, 22vw, 260px)",
    width: "clamp(200px, 22vw, 260px)",
    minHeight: "clamp(296px, 30vw, 340px)",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "flex-start",
    gap: 10,
    padding: "clamp(18px, 2vw, 24px) clamp(14px, 1.6vw, 20px) 24px",
    borderRadius: 24,
    border: isSelected
      ? "1.5px solid rgba(196, 85, 58, 0.82)"
      : "1px solid rgba(122, 86, 56, 0.12)",
    background: isSelected
      ? "linear-gradient(180deg, rgba(255, 247, 237, 0.98), rgba(255, 252, 247, 0.94))"
      : "rgba(255, 252, 246, 0.86)",
    color: "var(--text-primary, #3f3027)",
    boxShadow: isSelected
      ? "0 0 0 2px rgba(196, 85, 58, 0.10), 0 12px 26px rgba(42, 36, 32, 0.10)"
      : "0 2px 8px rgba(42, 36, 32, 0.04)",
    transform: isSelected ? "translateY(-4px)" : "none",
    transition:
      "transform 160ms ease, border-color 160ms ease, background 160ms ease, box-shadow 160ms ease",
    cursor: "pointer",
    userSelect: "none",
  };
}
