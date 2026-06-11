import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
      <p className="text-4xl mb-4">🌙</p>
      <h2 className="font-serif text-xl mb-2" style={{ color: "var(--deep-gray)" }}>
        페이지를 찾지 못했어요
      </h2>
      <p className="text-sm opacity-50 mb-6">
        찾으시는 페이지가 이동되었거나 존재하지 않아요.
      </p>
      <Link
        href="/"
        className="px-6 py-2 rounded-full text-white text-sm"
        style={{ background: "var(--soft-accent)" }}
      >
        홈으로 돌아가기
      </Link>
    </div>
  );
}
