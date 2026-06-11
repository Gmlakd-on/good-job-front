"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="ko">
      <body
        className="min-h-screen flex items-center justify-center"
        style={{ background: "#F3EDE2", fontFamily: "'Noto Sans KR', sans-serif" }}
      >
        <div
          className="max-w-sm mx-auto p-8 text-center rounded-2xl"
          style={{
            background: "#FAF6F0",
            boxShadow: "0 2px 12px rgba(62,58,54,0.08)",
            border: "1px solid rgba(231,199,182,0.3)",
          }}
        >
          <p className="text-4xl mb-4">🍃</p>
          <h2
            className="text-lg mb-2"
            style={{ fontFamily: "'Noto Serif KR', serif", color: "#3E3A36" }}
          >
            잠깐 쉬어가도 돼요
          </h2>
          <p className="text-sm mb-6" style={{ color: "#3E3A36", opacity: 0.6 }}>
            일시적인 오류가 발생했어요.
            <br />
            잠시 후 다시 시도해주세요.
          </p>
          <button
            onClick={reset}
            className="px-6 py-2 rounded-full text-white text-sm"
            style={{ background: "#E7C7B6" }}
          >
            다시 시도하기
          </button>
        </div>
      </body>
    </html>
  );
}
