"use client";

import AnnouncementPopup from "@/components/announcements/AnnouncementPopup";
import { ToastProvider } from "@/components/Toast";
import { useServiceWorker } from "@/lib/useServiceWorker";
import type { ReactNode } from "react";

export default function Providers({ children }: { children: ReactNode }) {
  useServiceWorker();
  return (
    <ToastProvider>
      {children}
      <AnnouncementPopup />
    </ToastProvider>
  );
}
