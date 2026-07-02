"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import {
  ANNOUNCEMENT_NOTICES,
  ANNOUNCEMENT_POPUP_VERSION,
  type AnnouncementNoticeKind,
} from "@/lib/announcements/notices";
import styles from "./AnnouncementPopup.module.css";

const STORAGE_PREFIX = "good-job-announcement-popup";

const NOTICE_KIND_CLASS: Record<AnnouncementNoticeKind, string> = {
  update: styles.noticeUpdate,
  "coming-soon": styles.noticeComingSoon,
  maintenance: styles.noticeMaintenance,
};

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

  const closePopup = useCallback(() => {
    if (dontShowAgain && storageKey) {
      window.localStorage.setItem(storageKey, "dismissed");
    }
    setOpen(false);
  }, [dontShowAgain, storageKey]);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closePopup();
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [closePopup, open]);

  if (!open || !user || ANNOUNCEMENT_NOTICES.length === 0) return null;

  return (
    <div className={styles.popup} role="dialog" aria-modal="true" aria-labelledby="announcement-popup-title">
      <button type="button" className={styles.backdrop} aria-label="업데이트 소식 닫기" onClick={closePopup} />
      <section className={styles.card}>
        <button type="button" className={styles.close} onClick={closePopup} aria-label="닫기">
          ×
        </button>

        <div className={styles.header}>
          <span className={styles.eyebrow}>참 잘했어요 소식</span>
          <h2 id="announcement-popup-title">업데이트와 준비중인 기능을 알려드려요</h2>
        </div>

        <div className={styles.list}>
          {ANNOUNCEMENT_NOTICES.map((notice) => (
            <article key={notice.id} className={`${styles.notice} ${NOTICE_KIND_CLASS[notice.kind]}`}>
              <div className={styles.noticeHead}>
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
                <Link href={notice.ctaHref} className={styles.link} onClick={closePopup} prefetch={false}>
                  {notice.ctaLabel}
                </Link>
              )}
            </article>
          ))}
        </div>

        <div className={styles.footer}>
          <label className={styles.checkbox}>
            <input type="checkbox" checked={dontShowAgain} onChange={(event) => setDontShowAgain(event.target.checked)} />
            <span>이번 소식은 다시 보지 않기</span>
          </label>
          <button type="button" className={styles.primary} onClick={closePopup}>
            확인했어요
          </button>
        </div>
      </section>
    </div>
  );
}