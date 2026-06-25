"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { ANNOUNCEMENT_NOTICES, ANNOUNCEMENT_POPUP_VERSION } from "@/lib/announcements/notices";

const STORAGE_PREFIX = "good-job-announcement-popup";

function buildStorageKey(userId: string) {
  return `${STORAGE_PREFIX}:${userId}:${ANNOUNCEMENT_POPUP_VERSION}`;
}

export default function AnnouncementPopup() {
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true);

  const storageKey = useMemo(() => (user ? buildStorageKey(user.id) : null), [user]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    const showForUser = (nextUser: User | null) => {
      if (!mounted) return;
      setUser(nextUser);

      if (!nextUser || ANNOUNCEMENT_NOTICES.length === 0) {
        setOpen(false);
        return;
      }

      const key = buildStorageKey(nextUser.id);
      const alreadyDismissed = window.localStorage.getItem(key) === "dismissed";
      setOpen(!alreadyDismissed);
    };

    supabase.auth.getUser().then(({ data }) => showForUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      const nextUser = session?.user ?? null;

      if (event === "SIGNED_OUT") {
        showForUser(null);
        return;
      }

      if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") {
        showForUser(nextUser);
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const closePopup = () => {
    if (dontShowAgain && storageKey) {
      window.localStorage.setItem(storageKey, "dismissed");
    }
    setOpen(false);
  };

  if (!open || !user || ANNOUNCEMENT_NOTICES.length === 0) return null;

  return (
    <div className="announcement-popup" role="dialog" aria-modal="true" aria-labelledby="announcement-popup-title">
      <button type="button" className="announcement-popup__backdrop" aria-label="업데이트 소식 닫기" onClick={closePopup} />
      <section className="announcement-popup__card">
        <button type="button" className="announcement-popup__close" onClick={closePopup} aria-label="닫기">
          ×
        </button>

        <div className="announcement-popup__header">
          <span className="announcement-popup__eyebrow">참 잘했어요 소식</span>
          <h2 id="announcement-popup-title">업데이트와 준비중인 기능을 알려드려요</h2>
          <p>로그인한 사용자에게 보여지는 안내 팝업입니다. 새 소식이 생기면 목록만 바꿔서 다시 띄울 수 있어요.</p>
        </div>

        <div className="announcement-popup__list">
          {ANNOUNCEMENT_NOTICES.map((notice) => (
            <article key={notice.id} className={`announcement-popup__notice announcement-popup__notice--${notice.kind}`}>
              <div className="announcement-popup__notice-head">
                {notice.badge && <span>{notice.badge}</span>}
                <h3>{notice.title}</h3>
              </div>
              <p>{notice.description}</p>
              {notice.items && notice.items.length > 0 && (
                <ul>
                  {notice.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
              {notice.ctaHref && notice.ctaLabel && (
                <Link href={notice.ctaHref} className="announcement-popup__link" onClick={closePopup} prefetch={false}>
                  {notice.ctaLabel}
                </Link>
              )}
            </article>
          ))}
        </div>

        <div className="announcement-popup__footer">
          <label className="announcement-popup__checkbox">
            <input type="checkbox" checked={dontShowAgain} onChange={(event) => setDontShowAgain(event.target.checked)} />
            <span>이번 소식은 다시 보지 않기</span>
          </label>
          <button type="button" className="announcement-popup__primary" onClick={closePopup}>
            확인했어요
          </button>
        </div>
      </section>
    </div>
  );
}
