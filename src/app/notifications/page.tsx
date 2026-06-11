"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { formatRelative } from "@/lib/date";
import type { Notification } from "@/types";

function notifyBadgeChanged() {
  window.dispatchEvent(new CustomEvent("notifications:changed"));
}

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/auth"); return; }

      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        notifyBadgeChanged();
      }
      setLoading(false);
    };
    load();
  }, [router]);

  const handleRead = async (notifId: string) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notification_id: notifId }),
    });

    const readAt = res.ok ? (await res.json()).read_at : new Date().toISOString();

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notifId ? { ...n, read_at: readAt } : n
      )
    );
    notifyBadgeChanged();
  };

  const handleMarkAllRead = async () => {
    setMarkingAll(true);
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });

    const readAt = res.ok ? (await res.json()).read_at : new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || readAt })));
    notifyBadgeChanged();
    setMarkingAll(false);
  };

  const handleClick = async (notif: Notification) => {
    if (!notif.read_at) {
      await handleRead(notif.id);
    }
    if (notif.link) {
      router.push(notif.link);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="opacity-40">불러오는 중…</p>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-6">
        <button onClick={() => router.push("/")} className="text-sm opacity-40 hover:opacity-70">
          ← 홈
        </button>
        <h1 className="font-serif text-xl" style={{ color: "var(--deep-gray)" }}>
          알림
          {unreadCount > 0 && (
            <span
              className="ml-2 text-xs px-2 py-0.5 rounded-full text-white"
              style={{ background: "var(--warm-red)" }}
            >
              {unreadCount}
            </span>
          )}
        </h1>
        <div className="w-8" />
      </div>

      <div className="diary-card p-4 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>
              웹에서는 앱 안 알림함으로 알려드려요
            </p>
            <p className="text-xs opacity-50 mt-1 leading-relaxed">
              브라우저 푸시 대신, 로그인하거나 앱을 열 때 지난 리마인더를 확인해서 여기에 쌓아둘게요.
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              disabled={markingAll}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{ background: "var(--warm-bg)", color: "var(--deep-gray)" }}
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <div className="diary-card p-8 text-center">
          <p className="text-2xl mb-3">🔔</p>
          <p className="text-sm opacity-50">아직 알림이 없어요.</p>
          <p className="text-xs opacity-30 mt-2">리마인더 시간이 지나면 로그인 후 이곳에 표시돼요.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <button
              key={notif.id}
              onClick={() => handleClick(notif)}
              className="diary-card relative p-4 w-full text-left transition-all hover:shadow-md"
              style={{
                opacity: notif.read_at ? 0.6 : 1,
                borderLeft: notif.read_at
                  ? "3px solid var(--warm-bg-deep)"
                  : "3px solid var(--soft-accent)",
              }}
            >
              <div className="flex items-center justify-between gap-6 mb-1">
                <p className="text-sm font-medium" style={{ color: "var(--deep-gray)" }}>
                  {notif.title}
                </p>
                <span className="text-xs opacity-30 whitespace-nowrap">{formatRelative(notif.created_at)}</span>
              </div>
              <p className="text-sm opacity-60 leading-relaxed pr-2">{notif.body}</p>
              {!notif.read_at && (
                <div
                  className="w-2 h-2 rounded-full absolute top-3 right-3"
                  style={{ background: "var(--soft-accent)" }}
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
