import { Suspense } from "react";
import BooksPageClient from "./BooksPageClient";

function LoadingFallback() {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <p style={{ color: "var(--text-muted)", fontSize: "14px" }}>책장을 여는 중…</p>
    </div>
  );
}

export default function BooksPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <BooksPageClient />
    </Suspense>
  );
}
