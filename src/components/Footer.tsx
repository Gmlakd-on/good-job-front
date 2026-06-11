"use client";

import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();
  if (pathname === "/") return null;

  return (
    <footer className="mt-16 pb-8 text-center">
      <div
        className="mx-auto mb-3 w-8"
        style={{ height: "1px", background: "var(--border-subtle)" }}
      />
      <p className="text-xs" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
        © 2026 참 잘했어요
      </p>
    </footer>
  );
}
