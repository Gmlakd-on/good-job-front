"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
      <p className="text-4xl mb-4">🍃</p>
      <h2 className="font-serif text-lg mb-2" style={{ color: "var(--deep-gray)" }}>
        잠깐 쉬어가도 돼요
      </h2>
      <p className="text-sm opacity-50 mb-6">
        일시적인 오류가 발생했어요.
      </p>
      <button
        onClick={reset}
        className="px-6 py-2 rounded-full text-white text-sm"
        style={{ background: "var(--soft-accent)" }}
      >
        다시 시도하기
      </button>
    </div>
  );
}
