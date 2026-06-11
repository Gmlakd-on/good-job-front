"use client";

type CompleteMode = "archived" | "locked";

interface BookCompleteModalProps {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSelect: (mode: CompleteMode) => void;
}

export default function BookCompleteModal({ open, loading = false, onClose, onSelect }: BookCompleteModalProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/25" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center px-5">
        <div className="diary-card w-full max-w-sm p-5">
          <h2 className="font-serif text-xl">일기장을 완결할까요?</h2>
          <p className="mt-2 text-sm leading-relaxed opacity-60">
            완결 방식에 따라 나중에 다시 이어 쓸 수 있는지 달라져요.
          </p>

          <div className="mt-5 grid gap-3">
            <button
              type="button"
              disabled={loading}
              onClick={() => onSelect("archived")}
              className="rounded-2xl border border-[rgba(122,86,56,0.18)] bg-[rgba(255,248,232,0.7)] p-4 text-left transition-transform hover:-rotate-1"
            >
              <span className="font-medium">수정/추가 가능, 보관</span>
              <span className="mt-1 block text-xs opacity-55">
                완결된 일기장으로 표시되지만 나중에 다시 이어 쓸 수 있어요.
              </span>
            </button>

            <button
              type="button"
              disabled={loading}
              onClick={() => onSelect("locked")}
              className="rounded-2xl border border-[rgba(186,74,59,0.28)] bg-[rgba(255,248,232,0.7)] p-4 text-left transition-transform hover:rotate-1"
            >
              <span className="font-medium text-[var(--warm-red)]">잠금</span>
              <span className="mt-1 block text-xs opacity-55">
                더 이상 수정/추가가 불가해집니다. 잠금 하시겠습니까?
              </span>
            </button>
          </div>

          <button type="button" onClick={onClose} className="mt-4 w-full rounded-full bg-[var(--warm-bg-deep)] py-2 text-sm">
            취소
          </button>
        </div>
      </div>
    </>
  );
}
