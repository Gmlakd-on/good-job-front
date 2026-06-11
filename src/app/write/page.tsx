import { Suspense } from "react";
import WritePageClient from "./WritePageClient";

function LoadingFallback() {
  return (
    <div className="write-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
      <div style={{ textAlign: "center" }}>
        <div className="write-page__spinner" />
        <p style={{ color: "var(--text-muted)", fontSize: "14px", marginTop: "12px" }}>불러오는 중…</p>
      </div>
    </div>
  );
}

export default function WritePage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <WritePageClient />
    </Suspense>
  );
}
