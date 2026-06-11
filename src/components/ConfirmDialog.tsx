"use client";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "확인",
  cancelLabel = "취소",
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(58, 50, 42, 0.25)", backdropFilter: "blur(4px)" }}
        onClick={onCancel}
      />

      {/* 다이얼로그 */}
      <div className="fixed inset-0 z-50 flex items-center justify-center px-6">
        <div
          className="w-full max-w-xs animate-fade-in-scale"
          style={{
            padding: "24px",
            borderRadius: "var(--radius-xl)",
            background: "var(--bg-card)",
            boxShadow: "var(--shadow-float)",
            border: "1px solid var(--border-subtle)",
          }}
          role="dialog"
          aria-modal="true"
          aria-label={title || "확인"}
        >
          {title && (
            <p
              className="font-serif text-base mb-2 font-medium"
              style={{ color: "var(--text-primary)" }}
            >
              {title}
            </p>
          )}
          <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {message}
          </p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onCancel}
              className="text-sm px-5 py-2.5 font-medium transition-all duration-200"
              style={{
                borderRadius: "var(--radius-full)",
                background: "var(--cream-deep)",
                color: "var(--text-secondary)",
                border: "1px solid var(--border-subtle)",
              }}
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="text-sm px-5 py-2.5 font-medium text-white transition-all duration-200"
              style={{
                borderRadius: "var(--radius-full)",
                background: danger ? "var(--chami-heart)" : "var(--accent)",
                boxShadow: danger
                  ? "0 4px 12px rgba(224, 107, 92, 0.3)"
                  : "0 4px 12px rgba(201, 123, 90, 0.3)",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {loading ? "처리 중…" : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
